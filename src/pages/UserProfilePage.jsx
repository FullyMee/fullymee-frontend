import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    MessageCircle,
    Shield,
    Calendar
} from "lucide-react";
import DesktopAppShell from "../components/layout/DesktopAppShell.jsx";
import { InlineSpinner, ProfileSkeleton } from "../components/common/LoadingStates.jsx";
import { useGlobalError } from "../context/ErrorContext.jsx";
import { sendUserChatRequest } from "../services/chat.service.js";
import { getJoinedRooms } from "../services/confession.service.js";
import api from "../services/api.js";
import useIsDesktop from "../hooks/useIsDesktop.js";
import useBodyClass from "../hooks/useBodyClass.js";
import useTimedNotice from "../hooks/useTimedNotice.js";
import { getInitial, getAliasTone } from "../utils/presentation.js";

function formatJoinedDate(value) {
    if (!value) return "Recently";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently";
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric"
    }).format(date);
}

export default function UserProfilePage({ user: currentUser }) {
    const { userId: rawUserId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isDesktop = useIsDesktop();
    const { showError, dismissError } = useGlobalError();
    const [notice, setNotice] = useTimedNotice("", 2600);
    const [connecting, setConnecting] = useState(false);

    // If it's a number, it's a real user ID. If not, it's an alias name.
    const targetUserId = Number(rawUserId);
    const isAliasProfile = isNaN(targetUserId) || location.state?.profileUser?.isAlias;
    const currentUserId = Number(currentUser?.userId || 0);

    // Redirect to own profile page if viewing self
    useEffect(() => {
        if (targetUserId && currentUserId && targetUserId === currentUserId) {
            navigate("/profile", { replace: true });
        }
    }, [targetUserId, currentUserId, navigate]);

    // The user data may arrive through location.state
    const passedUser = location.state?.profileUser || null;

    const [profileUser, setProfileUser] = useState(passedUser);
    const [profileStats, setProfileStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joinedRooms, setJoinedRooms] = useState([]);

    useBodyClass("confessions-scroll-unlocked");

    // Fetch user data and stats
    useEffect(() => {
        if (!rawUserId) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function fetchProfile() {
            try {
                setLoading(true);
                dismissError();
                
                const data = await api.get(`/users/${rawUserId}/profile`);
                
                if (cancelled) return;
                
                if (data && !data.error) {
                    setProfileUser({
                        ...passedUser,
                        userId: data.userId,
                        username: data.username,
                        isAlias: data.isAlias,
                        createdAt: data.createdAt
                    });
                    setProfileStats(data.stats);
                } else {
                    showError(data?.error || "User not found.");
                }
            } catch (err) {
                if (!cancelled) {
                    showError(err?.message || "Unable to load user profile.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchProfile();
        return () => { cancelled = true; };
    }, [rawUserId, dismissError, showError, passedUser]);

    // Load sidebar rooms for desktop
    useEffect(() => {
        getJoinedRooms()
            .then((rooms) => setJoinedRooms(Array.isArray(rooms) ? rooms : []))
            .catch(() => {});
    }, []);

    const displayUsername = profileUser?.username || `User ${targetUserId}`;
    const avatarTone = getAliasTone(displayUsername);

    async function handleConnect() {
        if (isAliasProfile) {
            setNotice("You cannot directly connect with an anonymous identity from here.");
            return;
        }
        if (!targetUserId || connecting) return;
        try {
            setConnecting(true);
            dismissError();
            const result = await sendUserChatRequest(targetUserId);
            const requestState = String(result?.requestState || "").trim();

            if ((requestState === "already_connected" || requestState === "accepted") && Number(result?.conversationId)) {
                setNotice(`You are already connected with ${displayUsername}.`);
                navigate(`/chats?conversationId=${result.conversationId}`);
                return;
            }
            if (requestState === "already_pending") {
                setNotice(`Chat request already pending for ${displayUsername}.`);
                return;
            }
            if (requestState === "sent" || requestState === "pending") {
                setNotice(`Chat request sent to ${displayUsername}!`);
                return;
            }
            setNotice(`Chat request updated for ${displayUsername}.`);
        } catch (err) {
            showError(err?.message || "Unable to send a chat request right now.");
        } finally {
            setConnecting(false);
        }
    }

    // ── Desktop Layout ──
    if (isDesktop) {
        return (
            <div className="user-profile-page user-profile-page--desktop">
                {notice && <p className="profile-page-v2__alert profile-page-v2__alert--notice">{notice}</p>}

                <DesktopAppShell
                    sidebarRooms={joinedRooms}
                    onSelectSidebarRoom={(room) => navigate(`/confessions?roomId=${room.roomId}`)}
                    contentClassName="desktop-profile-shell"
                    hideStageHeader
                >
                    <div className="desktop-profile-container">
                        {loading && <ProfileSkeleton />}

                        {!loading && profileUser && (
                            <div className="desktop-profile-grid">
                                <section className="desktop-profile-banner-card">
                                    <div className="desktop-profile-banner-card__gradient"></div>
                                    <div className="desktop-profile-banner-card__bottom">
                                        <div className="desktop-profile-banner-card__avatar-shell">
                                            <div className="desktop-profile-banner-card__avatar">
                                                {getInitial(displayUsername)}
                                            </div>
                                        </div>
                                        <div className="desktop-profile-banner-card__info">
                                            <h2>{displayUsername}</h2>
                                            <p>{isAliasProfile ? "Private Identity" : "Anonymous User"}</p>
                                            
                                            <div className="profile-redesign__stats-group" style={{ marginTop: '1rem', justifyContent: 'flex-start', gap: '2rem' }}>
                                                <div className="profile-redesign__stat-item">
                                                    <span className="profile-redesign__stat-value">{profileStats ? profileStats.confessions : "—"}</span>
                                                    <span className="profile-redesign__stat-label" style={{ color: '#FDF2F8' }}>confessions</span>
                                                </div>
                                                <div className="profile-redesign__stat-item">
                                                    <span className="profile-redesign__stat-value">{profileStats ? profileStats.rooms : "—"}</span>
                                                    <span className="profile-redesign__stat-label" style={{ color: '#FDF2F8' }}>rooms</span>
                                                </div>
                                                <div className="profile-redesign__stat-item">
                                                    <span className="profile-redesign__stat-value">{profileStats ? profileStats.replies : "—"}</span>
                                                    <span className="profile-redesign__stat-label" style={{ color: '#FDF2F8' }}>replies</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="desktop-profile-banner-card__actions">
                                            <button
                                                type="button"
                                                className="desktop-profile-edit-button"
                                                onClick={handleConnect}
                                                disabled={connecting || isAliasProfile}
                                                style={{ opacity: isAliasProfile ? 0.5 : 1 }}
                                            >
                                                {connecting ? (
                                                    <InlineSpinner size="sm" tone="dark" label="Connecting" />
                                                ) : (
                                                    <MessageCircle size={18} strokeWidth={2} />
                                                )}
                                                <span>{connecting ? "Sending..." : (isAliasProfile ? "Private" : "Connect")}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="desktop-profile-edit-button"
                                                onClick={() => navigate(-1)}
                                            >
                                                <ArrowLeft size={18} strokeWidth={2} />
                                                <span>Go Back</span>
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section className="desktop-privacy-banner">
                                    <h3>Privacy Notice</h3>
                                    {isAliasProfile ? (
                                        <p>You are viewing an anonymous identity from a room. Their real profile remains private.</p>
                                    ) : (
                                        <p>This is a public profile. All identities on FullyMe are anonymous. Confessions and room activity are private and never shared on profiles.</p>
                                    )}
                                </section>
                            </div>
                        )}

                        {!loading && !profileUser && (
                            <div className="uprofile-empty">
                                <Shield size={48} strokeWidth={1.5} />
                                <h2>User not found</h2>
                                <p>This profile may no longer exist or the link is invalid.</p>
                                <button type="button" className="profile-redesign__btn profile-redesign__btn--primary" onClick={() => navigate(-1)}>
                                    Go back
                                </button>
                            </div>
                        )}
                    </div>
                </DesktopAppShell>
            </div>
        );
    }

    // ── Mobile Layout ──
    return (
        <div className="uprofile-mobile">
            {notice && <p className="profile-page-v2__alert profile-page-v2__alert--notice">{notice}</p>}

            <header className="uprofile-mobile__topbar">
                <button type="button" className="uprofile-mobile__back" onClick={() => navigate(-1)} aria-label="Go back">
                    <ArrowLeft size={22} strokeWidth={2.2} color="#3B1F43" />
                </button>
                <h1 className="uprofile-mobile__topbar-title">{loading ? "Profile" : displayUsername}</h1>
                <div className="uprofile-mobile__topbar-spacer" />
            </header>

            {loading ? (
                <div className="profile-content">
                    <ProfileSkeleton />
                </div>
            ) : profileUser ? (
                <main className="uprofile-mobile__content">
                    <section className="profile-redesign__header-card">
                        <div className="profile-redesign__top-row">
                            <div className="profile-redesign__avatar-wrapper">
                                <div className="profile-redesign__avatar-ring">
                                    <div className="profile-redesign__avatar-inner">
                                        {getInitial(displayUsername)}
                                    </div>
                                </div>
                                <div className="profile-redesign__verified-badge" title="Verified Identity">
                                    <CheckCircle2 size={18} fill="#3B82F6" color="#FFFFFF" />
                                </div>
                            </div>

                            <div className="profile-redesign__stats-group">
                                <div className="profile-redesign__stat-item">
                                    <span className="profile-redesign__stat-value">{profileStats ? profileStats.confessions : "—"}</span>
                                    <span className="profile-redesign__stat-label">confessions</span>
                                </div>
                                <div className="profile-redesign__stat-item">
                                    <span className="profile-redesign__stat-value">{profileStats ? profileStats.rooms : "—"}</span>
                                    <span className="profile-redesign__stat-label">rooms</span>
                                </div>
                                <div className="profile-redesign__stat-item">
                                    <span className="profile-redesign__stat-value">{profileStats ? profileStats.replies : "—"}</span>
                                    <span className="profile-redesign__stat-label">replies</span>
                                </div>
                            </div>
                        </div>

                        <div className="profile-redesign__bio-block">
                            <h1 className="profile-redesign__username">
                                {displayUsername}
                                {profileUser.createdAt && !isAliasProfile && (
                                    <span className="profile-redesign__joined-date"> · {formatJoinedDate(profileUser.createdAt)}</span>
                                )}
                            </h1>
                            <p className="profile-redesign__tagline">
                                {isAliasProfile ? "You are always anonymous in rooms." : "Anonymous identity on FullyMe."}
                            </p>
                            <div className="profile-redesign__badges-row">
                                <span className="profile-badge-pill">{isAliasProfile ? "Private identity" : "Anonymous"}</span>
                            </div>
                        </div>

                        <div className="profile-redesign__actions-row">
                            <button
                                type="button"
                                className="profile-redesign__btn profile-redesign__btn--primary profile-redesign__btn--full"
                                onClick={handleConnect}
                                disabled={connecting || isAliasProfile}
                                style={{ opacity: isAliasProfile ? 0.5 : 1 }}
                            >
                                {connecting ? (
                                    <span className="uprofile-btn-inner">
                                        <InlineSpinner size="sm" tone="light" label="Connecting" />
                                        Sending...
                                    </span>
                                ) : (
                                    <span className="uprofile-btn-inner">
                                        <MessageCircle size={16} strokeWidth={2} />
                                        {isAliasProfile ? "Private" : "Connect"}
                                    </span>
                                )}
                            </button>
                        </div>
                    </section>

                    <section className="uprofile-privacy-card">
                        <div className="uprofile-privacy-card__icon">
                            <Shield size={20} strokeWidth={2} color="#8C6F8E" />
                        </div>
                        <div className="uprofile-privacy-card__copy">
                            <strong>Privacy Notice</strong>
                            {isAliasProfile ? (
                                <p>This is a room-specific anonymous identity. Their real profile is completely private and hidden.</p>
                            ) : (
                                <p>All identities on FullyMe are anonymous. Confessions and room activity are never shared on profiles.</p>
                            )}
                        </div>
                    </section>

                    {profileUser.createdAt && !isAliasProfile && (
                        <section className="uprofile-info-card">
                            <Calendar size={18} strokeWidth={2} color="#E07A5F" />
                            <span>Joined {formatJoinedDate(profileUser.createdAt)}</span>
                        </section>
                    )}
                </main>
            ) : (
                <div className="uprofile-empty">
                    <Shield size={48} strokeWidth={1.5} />
                    <h2>User not found</h2>
                    <p>This profile may no longer exist or the link is invalid.</p>
                    <button type="button" className="profile-redesign__btn profile-redesign__btn--primary" onClick={() => navigate(-1)}>
                        Go back
                    </button>
                </div>
            )}
        </div>
    );
}
