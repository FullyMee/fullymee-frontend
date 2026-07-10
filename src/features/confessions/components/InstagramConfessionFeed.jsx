import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { useGlobalError } from "../../../context/ErrorContext.jsx";
import { 
    likeConfession, 
    getConfessionsFeed, 
    createConfession 
} from "../../../services/confession.service";
import { getSocket } from "../../../services/socket";
import { formatRelativeTime } from "../../../utils/time";
import { InlineSpinner } from "../../../components/common/LoadingStates.jsx";
import "./InstagramConfessionFeed.css";

export default function InstagramConfessionFeed() {
    const navigate = useNavigate();
    const { showError, dismissError } = useGlobalError();
    
    const [confessions, setConfessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [content, setContent] = useState("");
    
    // Track double tap animations per confession ID
    const [activeHeartPops, setActiveHeartPops] = useState({});
    // Track last tap time for double tap detection
    const lastTapRef = useRef({});

    // Fetch initial feed
    useEffect(() => {
        let isMounted = true;
        
        async function fetchFeed() {
            try {
                setLoading(true);
                dismissError();
                const feed = await getConfessionsFeed({ limit: 30, useAggregation: false });
                if (isMounted) {
                    setConfessions(feed);
                }
            } catch (err) {
                if (isMounted) {
                    showError(err && err.message ? err.message : "Failed to load confession feed.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchFeed();
        return () => {
            isMounted = false;
        };
    }, [dismissError, showError]);

    // Socket.io Listener for Real-time Likes Updates
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        function handleLikesUpdated(payload) {
            const { confessionId, likesCount } = payload;
            if (!confessionId) return;

            setConfessions(prev => prev.map(c => {
                if (c._id === confessionId) {
                    // Update only the likesCount from broadcast, keeping the current user's liked status intact.
                    return {
                        ...c,
                        likesCount
                    };
                }
                return c;
            }));
        }

        socket.on("confession:likesUpdated", handleLikesUpdated);

        return () => {
            socket.off("confession:likesUpdated", handleLikesUpdated);
        };
    }, []);

    // Handle Like Toggle with Optimistic UI updates
    const handleLikeToggle = async (confessionId) => {
        if (!confessionId) return;

        // 1. Take snapshot of current state for potential rollback
        const originalConfessions = [...confessions];

        // 2. Perform Optimistic Update: Immediately toggle state and increment/decrement locally
        setConfessions(prev => prev.map(c => {
            if (c._id === confessionId) {
                const alreadyLiked = !!c.likedByCurrentUser;
                const nextLiked = !alreadyLiked;
                return {
                    ...c,
                    likedByCurrentUser: nextLiked,
                    likesCount: Math.max(0, c.likesCount + (nextLiked ? 1 : -1))
                };
            }
            return c;
        }));

        try {
            // 3. Make API call
            const result = await likeConfession(confessionId);
            
            // 4. Update state with official server counts on success
            setConfessions(prev => prev.map(c => {
                if (c._id === confessionId) {
                    return {
                        ...c,
                        likedByCurrentUser: result.liked,
                        likesCount: result.likesCount
                    };
                }
                return c;
            }));
        } catch (err) {
            // 5. Rollback on failure
            setConfessions(originalConfessions);
            showError(err && err.message ? err.message : "Unable to process like action. Please check your connection.");
        }
    };

    // Double tap to like animation (Instagram style)
    const handleDoubleTap = (confessionId, isAlreadyLiked) => {
        const now = Date.now();
        const DOUBLE_PRESS_DELAY = 300;
        const lastTap = lastTapRef.current[confessionId] || 0;

        if (now - lastTap < DOUBLE_PRESS_DELAY) {
            // Trigger heart pop animation
            setActiveHeartPops(prev => ({
                ...prev,
                [confessionId]: true
            }));

            // Auto-hide the heart pop animation after 800ms
            setTimeout(() => {
                setActiveHeartPops(prev => {
                    const copy = { ...prev };
                    delete copy[confessionId];
                    return copy;
                });
            }, 800);

            // If not liked already, trigger the like function
            if (!isAlreadyLiked) {
                handleLikeToggle(confessionId);
            }
        } else {
            lastTapRef.current[confessionId] = now;
        }
    };

    // Publish a new confession
    const handlePublish = async (e) => {
        e.preventDefault();
        const text = content.trim();
        if (!text) return;

        try {
            setPublishing(true);
            dismissError();
            const newConf = await createConfession(text);
            setContent("");
            
            // Add new confession to top of the feed locally
            setConfessions(prev => [
                {
                    _id: newConf._id,
                    content: newConf.content,
                    likesCount: 0,
                    likedByCurrentUser: false,
                    createdAt: newConf.createdAt
                },
                ...prev
            ]);
        } catch (err) {
            showError(err && err.message ? err.message : "Failed to publish confession.");
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="instagram-feed-container">
            <header className="instagram-feed-header">
                <button 
                    type="button" 
                    className="instagram-back-button"
                    onClick={() => navigate("/profile")}
                    aria-label="Back to Profile"
                >
                    <ArrowLeft size={22} />
                </button>
                <h1>FullyMe Likes</h1>
                <div style={{ width: 30 }} /> {/* Spacer to center the title */}
            </header>

            {/* Composer */}
            <section className="instagram-composer-card">
                <form className="instagram-composer-form" onSubmit={handlePublish}>
                    <textarea
                        className="instagram-composer-textarea"
                        placeholder="Share a secret anonymously..."
                        value={content}
                        onChange={(e) => setContent(e.target.value.slice(0, 2000))}
                        disabled={publishing}
                    />
                    <div className="instagram-composer-footer">
                        <span className="instagram-char-count">
                            {content.length} / 2000
                        </span>
                        <button
                            type="submit"
                            className="instagram-publish-button"
                            disabled={publishing || !content.trim()}
                        >
                            {publishing ? "Sharing..." : "Publish"}
                        </button>
                    </div>
                </form>
            </section>

            {/* Feed Cards */}
            {loading ? (
                <div className="instagram-feed-loading">
                    <InlineSpinner size="md" tone="brand" />
                    <span>Loading feed...</span>
                </div>
            ) : confessions.length === 0 ? (
                <div className="instagram-feed-empty">
                    <h3>No confessions yet</h3>
                    <p>Be the first to share an anonymous confession tonight!</p>
                </div>
            ) : (
                <main className="instagram-feed-list">
                    {confessions.map((post) => {
                        const isLiked = !!post.likedByCurrentUser;
                        const showHeartPop = !!activeHeartPops[post._id];

                        return (
                            <article key={post._id} className="instagram-post-card">
                                {/* Post Header */}
                                <div className="instagram-post-header">
                                    <div className="instagram-post-avatar">
                                        <div className="instagram-post-avatar-inner">
                                            👤
                                        </div>
                                    </div>
                                    <div className="instagram-post-user-info">
                                        <span className="instagram-post-username">Anonymous Wanderer</span>
                                        <span className="instagram-post-time">
                                            {formatRelativeTime(post.createdAt, { short: true, nowLabel: "now" })}
                                        </span>
                                    </div>
                                </div>

                                {/* Post Body with Double Click listener */}
                                <div 
                                    className="instagram-post-body-container"
                                    onClick={() => handleDoubleTap(post._id, isLiked)}
                                >
                                    <p className="instagram-post-body">
                                        {post.content}
                                    </p>
                                    
                                    {showHeartPop && (
                                        <div className="instagram-heart-pop">
                                            <Heart size={64} fill="currentColor" />
                                        </div>
                                    )}
                                </div>

                                {/* Actions Bar */}
                                <div className="instagram-post-actions">
                                    <button
                                        type="button"
                                        className={`instagram-action-button${isLiked ? " liked" : ""}`}
                                        onClick={() => handleLikeToggle(post._id)}
                                        aria-label={isLiked ? "Unlike confession" : "Like confession"}
                                    >
                                        <Heart 
                                            size={24} 
                                            fill={isLiked ? "currentColor" : "none"} 
                                            strokeWidth={isLiked ? 0 : 2} 
                                        />
                                    </button>
                                </div>

                                {/* Likes Summary */}
                                <div className="instagram-post-likes-info">
                                    Liked by <span>{post.likesCount || 0}</span> people
                                </div>
                            </article>
                        );
                    })}
                </main>
            )}
        </div>
    );
}
