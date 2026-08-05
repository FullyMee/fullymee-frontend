import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    MessageCircle,
    Shield,
    Calendar,
    EyeOff
} from "lucide-react";
import DesktopAppShell from "../components/layout/DesktopAppShell.jsx";
import { ProfileSkeleton } from "../components/common/LoadingStates.jsx";
import { useGlobalError } from "../context/ErrorContext.jsx";
import { getJoinedRooms } from "../services/confession.service.js";
import api from "../services/api.js";
import useIsDesktop from "../hooks/useIsDesktop.js";
import useBodyClass from "../hooks/useBodyClass.js";
import useTimedNotice from "../hooks/useTimedNotice.js";
import { getInitial } from "../utils/presentation.js";

function formatJoinedDate(value) {
    if (!value) return "Recently";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently";
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric"
    }).format(date);
}

/* ─── Hidden-Profile Splash ─────────────────────────────────────────────────── */
function HiddenProfileSplash({ username, onBack }) {
    return (
        <div className="uprofile-hidden-splash">
            <div className="uprofile-hidden-splash__glow" />
            <div className="uprofile-hidden-splash__icon-ring">
                <EyeOff size={36} strokeWidth={1.5} color="#C084FC" />
            </div>
            <h2 className="uprofile-hidden-splash__title">Identity Kept Private</h2>
            <p className="uprofile-hidden-splash__sub">
                <strong>{username || "This user"}</strong> has chosen to keep their
                profile and identity hidden from others.
            </p>
            <p className="uprofile-hidden-splash__hint">
                Their confessions and room activity remain anonymous, as always.
            </p>
            <button
                type="button"
                className="uprofile-hidden-splash__back-btn"
                onClick={onBack}
            >
                <ArrowLeft size={16} strokeWidth={2.2} />
                Go Back
            </button>
        </div>
    );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function UserProfilePage({ user: currentUser }) {
    const { userId: rawUserId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isDesktop = useIsDesktop();
    const { showError, dismissError } = useGlobalError();
    const [notice] = useTimedNotice("", 2600);

    const currentUserId = Number(currentUser?.userId || 0);

    const passedUser = location.state?.profileUser || null;

    const [profileUser, setProfileUser]     = useState(passedUser);
    const [profileStats, setProfileStats]   = useState(null);
    const [isConnected, setIsConnected]     = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const [isProfileHidden, setIsProfileHidden] = useState(false);
    const [loading, setLoading]             = useState(true);
    const [joinedRooms, setJoinedRooms]     = useState([]);

    useBodyClass("confessions-scroll-unlocked");

    /* ── Fetch profile data ─────────────────────────────────────────────────── */
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

                // Backend says this is the current user → redirect to own profile
                if (data && data.isSelf) {
                    navigate("/profile", { replace: true });
                    return;
                }

                // Backend says profile is hidden
                if (data && data.isProfileHidden) {
                    setIsProfileHidden(true);
                    setProfileUser({ username: data.username || rawUserId });
                    setLoading(false);
                    return;
                }

                if (data && !data.error) {
                    setProfileUser({
                        ...passedUser,
                        userId: data.userId,
                        username: data.username,
                        avatar: data.avatar || null,
                        createdAt: data.createdAt,
                    });
                    setIsConnected(!!data.isConnected);
                    setConversationId(data.conversationId || null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawUserId]);

    /* ── Sidebar rooms (desktop) ────────────────────────────────────────────── */
    useEffect(() => {
        getJoinedRooms()
            .then((rooms) => setJoinedRooms(Array.isArray(rooms) ? rooms : []))
            .catch(() => {});
    }, []);

    const displayUsername = profileUser?.username || rawUserId || "User";

    function handleMessageButton() {
        if (conversationId) {
            navigate(`/chats?conversationId=${conversationId}`);
        } else {
            navigate(`/chats`);
        }
    }

    /* ════════════════════════════════════════════════════════════════════════
       DESKTOP LAYOUT
    ════════════════════════════════════════════════════════════════════════ */
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

                        {/* Hidden profile splash */}
                        {!loading && isProfileHidden && (
                            <HiddenProfileSplash
                                username={displayUsername}
                                onBack={() => navigate(-1)}
                            />
                        )}

                        {/* Normal profile */}
                        {!loading && !isProfileHidden && profileUser && (
                            <div className="desktop-profile-grid">
                                <section className="desktop-profile-banner-card">
                                    <div className="desktop-profile-banner-card__gradient" />
                                    <div className="desktop-profile-banner-card__bottom">
                                        <div className="desktop-profile-banner-card__avatar-shell">
                                            <div className="desktop-profile-banner-card__avatar">
                                                {profileUser?.avatar ? profileUser.avatar : getInitial(displayUsername)}
                                            </div>
                                        </div>
                                        <div className="desktop-profile-banner-card__info">
                                            <h2>{displayUsername}</h2>
                                            <p>
                                                {isConnected
                                                    ? "Anonymous identity on FullyMe."
                                                    : "Private Identity not yet connected"}
                                            </p>

                                            <div
                                                className="profile-redesign__stats-group"
                                                style={{ marginTop: "1rem", justifyContent: "flex-start", gap: "2rem" }}
                                            >
                                                <div className="profile-redesign__stat-item">
                                                    <span className="profile-redesign__stat-value">{profileStats ? profileStats.confessions : "—"}</span>
                                                    <span className="profile-redesign__stat-label" style={{ color: "black" }}>confessions</span>
                                                </div>
                                                <div className="profile-redesign__stat-item">
                                                    <span className="profile-redesign__stat-value">{profileStats ? profileStats.rooms : "—"}</span>
                                                    <span className="profile-redesign__stat-label" style={{ color: "black" }}>rooms</span>
                                                </div>
                                                <div className="profile-redesign__stat-item">
                                                    <span className="profile-redesign__stat-value">{profileStats ? profileStats.replies : "—"}</span>
                                                    <span className="profile-redesign__stat-label" style={{ color: "black" }}>replies</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="desktop-profile-banner-card__actions">
                                            {isConnected ? (
                                                <button
                                                    type="button"
                                                    className="desktop-profile-edit-button"
                                                    onClick={handleMessageButton}
                                                >
                                                    <MessageCircle size={18} strokeWidth={2} />
                                                    <span>Message</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="desktop-profile-edit-button"
                                                    style={{ opacity: 0.55, cursor: "default" }}
                                                    disabled
                                                >
                                                    <Shield size={18} strokeWidth={2} />
                                                    <span>Private</span>
                                                </button>
                                            )}
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
                                    {isConnected ? (
                                        <p>All identities on FullyMe are anonymous. Confessions and room activity are never shared on profiles.</p>
                                    ) : (
                                        <p>This is a room-specific anonymous identity. Their real profile is completely private and hidden.</p>
                                    )}
                                </section>
                            </div>
                        )}

                        {/* Not found */}
                        {!loading && !isProfileHidden && !profileUser && (
                            <div className="uprofile-empty">
                                <Shield size={48} strokeWidth={1.5} />
                                <h2>User not found</h2>
                                <p>This profile may no longer exist or the link is invalid.</p>
                                <button
                                    type="button"
                                    className="profile-redesign__btn profile-redesign__btn--primary"
                                    onClick={() => navigate(-1)}
                                >
                                    Go back
                                </button>
                            </div>
                        )}
                    </div>
                </DesktopAppShell>
            </div>
        );
    }

    /* ════════════════════════════════════════════════════════════════════════
       MOBILE LAYOUT
    ════════════════════════════════════════════════════════════════════════ */
    return (
        <div className="uprofile-mobile">
            {notice && <p className="profile-page-v2__alert profile-page-v2__alert--notice">{notice}</p>}

            <header className="uprofile-mobile__topbar">
                <button
                    type="button"
                    className="uprofile-mobile__back"
                    onClick={() => navigate(-1)}
                    aria-label="Go back"
                >
                    <ArrowLeft size={22} strokeWidth={2.2} color="#3B1F43" />
                </button>
                <h1 className="uprofile-mobile__topbar-title">
                    {loading ? "Profile" : displayUsername}
                </h1>
                <div className="uprofile-mobile__topbar-spacer" />
            </header>

            {loading ? (
                <div className="profile-content">
                    <ProfileSkeleton />
                </div>

            ) : isProfileHidden ? (
                /* ── Hidden profile ── */
                <HiddenProfileSplash
                    username={displayUsername}
                    onBack={() => navigate(-1)}
                />

            ) : profileUser ? (
                /* ── Normal profile ── */
                <main className="uprofile-mobile__content">
                    <section className="profile-redesign__header-card">
                        <div className="profile-redesign__top-row">
                            <div className="profile-redesign__avatar-wrapper">
                                <div className="profile-redesign__avatar-ring">
                                    <div className="profile-redesign__avatar-inner">
                                        {profileUser?.avatar ? profileUser.avatar : getInitial(displayUsername)}
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
                                {profileUser.createdAt && isConnected && (
                                    <span className="profile-redesign__joined-date">
                                        &nbsp;· {formatJoinedDate(profileUser.createdAt)}
                                    </span>
                                )}
                            </h1>
                            <p className="profile-redesign__tagline">
                                {isConnected
                                    ? "Anonymous identity on FullyMe."
                                    : "You are always anonymous in rooms."}
                            </p>
                            <div className="profile-redesign__badges-row">
                                <span className="profile-badge-pill">
                                    {isConnected ? "Anonymous" : "Private identity"}
                                </span>
                            </div>
                        </div>

                        <div className="profile-redesign__actions-row">
                            {isConnected ? (
                                <button
                                    type="button"
                                    className="profile-redesign__btn profile-redesign__btn--primary profile-redesign__btn--full"
                                    onClick={handleMessageButton}
                                >
                                    <span className="uprofile-btn-inner">
                                        <MessageCircle size={16} strokeWidth={2} />
                                        Message
                                    </span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="profile-redesign__btn profile-redesign__btn--primary profile-redesign__btn--full"
                                    disabled
                                    style={{ opacity: 0.55, cursor: "default" }}
                                >
                                    <span className="uprofile-btn-inner">
                                        <Shield size={16} strokeWidth={2} />
                                        Private
                                    </span>
                                </button>
                            )}
                        </div>
                    </section>

                    <section className="uprofile-privacy-card">
                        <div className="uprofile-privacy-card__icon">
                            <Shield size={20} strokeWidth={2} color="#8C6F8E" />
                        </div>
                        <div className="uprofile-privacy-card__copy">
                            <strong>Privacy Notice</strong>
                            {isConnected ? (
                                <p>All identities on FullyMe are anonymous. Confessions and room activity are never shared on profiles.</p>
                            ) : (
                                <p>This is a room-specific anonymous identity. Their real profile is completely private and hidden.</p>
                            )}
                        </div>
                    </section>

                    {profileUser.createdAt && isConnected && (
                        <section className="uprofile-info-card">
                            <Calendar size={18} strokeWidth={2} color="#E07A5F" />
                            <span>Joined {formatJoinedDate(profileUser.createdAt)}</span>
                        </section>
                    )}
                </main>

            ) : (
                /* ── Not found ── */
                <div className="uprofile-empty">
                    <Shield size={48} strokeWidth={1.5} />
                    <h2>User not found</h2>
                    <p>This profile may no longer exist or the link is invalid.</p>
                    <button
                        type="button"
                        className="profile-redesign__btn profile-redesign__btn--primary"
                        onClick={() => navigate(-1)}
                    >
                        Go back
                    </button>
                </div>
            )}
        </div>
    );
}
