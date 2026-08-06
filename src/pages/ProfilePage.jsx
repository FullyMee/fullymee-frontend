import { useEffect, useMemo, useState } from "react";
import DesktopAppShell from "../components/layout/DesktopAppShell.jsx";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CreditCard, Mail, MessageCircle, MessageSquareQuote, Moon, Settings, Shield, Users, LogOut, CheckCircle2, Plus, Sparkles, BarChart3, Bookmark, Grid, Radio, Lock, ShieldCheck, Menu, X } from "lucide-react";
import DesktopEmptyState from "../components/common/DesktopEmptyState.jsx";
import DesktopIconStatCard from "../components/common/DesktopIconStatCard.jsx";
import { InlineSpinner, ProfileSkeleton } from "../components/common/LoadingStates.jsx";
import { useGlobalError } from "../context/ErrorContext.jsx";
import { checkUsername, logout, updateCurrentUserPreferences } from "../services/auth.service";
import { getJoinedRooms, getMyConfessions } from "../services/confession.service";
import useIsDesktop from "../hooks/useIsDesktop";
import { useQuery } from "@tanstack/react-query";
import Modal from "../components/common/Modal";
import { disconnectSocket } from "../services/socket";
import ProfileEditForm from "../features/profile/components/ProfileEditForm.jsx";
import SettingsDrawer from "../features/profile/components/SettingsDrawer.jsx";
import useBodyClass from "../hooks/useBodyClass.js";
import useTimedNotice from "../hooks/useTimedNotice.js";
import { getInitial } from "../utils/presentation.js";
import usePrimaryTabSwipeNavigation from "../hooks/usePrimaryTabSwipeNavigation.js";
import UserAvatar from "../components/common/UserAvatar.jsx";

const VISIBLE_ROOMS_LIMIT = 6;

function SettingsIcon(props) { return <Settings size={18} strokeWidth={2} {...props} />; }

function ShieldIcon(props) { return <Shield size={18} strokeWidth={2} {...props} />; }
function QuoteIcon() { return <MessageSquareQuote size={18} strokeWidth={2} />; }
function EnvelopeIcon(props) { return <Mail size={18} strokeWidth={2} {...props} />; }
function PeopleIcon() { return <Users size={18} strokeWidth={2} />; }
function CardIcon() { return <CreditCard size={18} strokeWidth={2} />; }
function ArrowRightIcon(props) { return <ArrowRight size={18} strokeWidth={2} {...props} />; }
function MessageIcon() { return <MessageCircle size={18} strokeWidth={2} />; }
function LogoutIcon(props) { return <LogOut size={18} strokeWidth={2} {...props} />; }

function formatJoinedDate(value) {
    if (!value) return "Recently";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently";
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric"
    }).format(date);
}

function normalizeUsername(value) {
    return String(value || "").trim().toLowerCase();
}

export default function ProfilePage({ user }) {
    const isDesktop = useIsDesktop();
    const navigate = useNavigate();
    const { showError, dismissError } = useGlobalError();
    const [profileUser, setProfileUser] = useState(user || null);
    const [notice, setNotice] = useTimedNotice("", 2600);
    const [expandedRooms, setExpandedRooms] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [usernameDraft, setUsernameDraft] = useState(user && user.username ? user.username : "");
    const [usernameStatus, setUsernameStatus] = useState({ status: "idle", message: "" });
    const [savingUsername, setSavingUsername] = useState(false);
    const [draftAvatar, setDraftAvatar] = useState('flowing_waterfall');

    const { data: profileData, isLoading: loading, error } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const [rooms, confessions] = await Promise.all([
                getJoinedRooms(),
                getMyConfessions({ limit: 50 })
            ]);
            return {
                joinedRooms: Array.isArray(rooms) ? rooms : [],
                myConfessions: Array.isArray(confessions) ? confessions : []
            };
        },
        staleTime: 60000,
        refetchOnWindowFocus: false
    });

    useEffect(() => {
        if (error) {
            showError(error.message || "Unable to load profile right now.");
        } else {
            dismissError();
        }
    }, [error, dismissError, showError]);

    // Sync local profileUser whenever the upstream user prop changes
    // (e.g. after avatar / username changes on Settings page trigger auth-changed)
    useEffect(() => {
        if (user) {
            setProfileUser(user);
            setUsernameDraft(user.username || "");
            setDraftAvatar(user.preferences?.avatar || user.avatar || 'flowing_waterfall');
        }
    }, [user]);

    const joinedRooms = profileData?.joinedRooms || [];
    const myConfessions = profileData?.myConfessions || [];

    useBodyClass("confessions-scroll-unlocked");

    const visibleRooms = useMemo(() => (
        expandedRooms ? joinedRooms : joinedRooms.slice(0, VISIBLE_ROOMS_LIMIT)
    ), [expandedRooms, joinedRooms]);

    const hasMoreRooms = joinedRooms.length > VISIBLE_ROOMS_LIMIT;
    const messageCount = Number(
        (profileUser && (profileUser.messageCount || profileUser.messagesCount || profileUser.messagesSent)) || 0
    );

    const [activeTab, setActiveTab] = useState("posts");
    const [showRightSidebar, setShowRightSidebar] = useState(false);

    const activeJoinedRooms = useMemo(() => (
        joinedRooms.filter((r) => r && r.isActive !== false)
    ), [joinedRooms]);

    const audioPostsCount = useMemo(() => (
        myConfessions.filter((c) => !!(c.hasAudio || (c.audioMeta && c.audioMeta.publicId))).length
    ), [myConfessions]);

    const totalRepliesCount = useMemo(() => (
        Number(profileUser?.replyCount ?? profileUser?.repliesCount ?? profileUser?.repliesCountSent ?? 0)
    ), [profileUser]);

    const swipeNavigationHandlers = usePrimaryTabSwipeNavigation({
        enabled: !isDesktop && !showEditModal && !showRightSidebar
    });

    async function handleUsernameSave(event) {
        event.preventDefault();
        const normalizedUsername = normalizeUsername(usernameDraft);
        if (!normalizedUsername) {
            setUsernameStatus({ status: "error", message: "Username is required." });
            return;
        }

        try {
            setSavingUsername(true);
            setUsernameStatus({ status: "checking", message: "Checking username..." });

            const availability = await checkUsername(normalizedUsername);
            const currentUsername = normalizeUsername(profileUser && profileUser.username);

            if (!availability.available && normalizedUsername !== currentUsername) {
                throw new Error(availability.reason || "Username is not available.");
            }

            const result = await updateCurrentUserPreferences({ username: normalizedUsername, avatar: draftAvatar });
            const updatedUser = result && result.user ? result.user : null;

            if (!updatedUser) {
                throw new Error("Could not update profile right now.");
            }

            // Fallback: If backend doesn't support avatars yet, we optimistically set it locally
            updatedUser.avatar = draftAvatar;

            setProfileUser(updatedUser);
            setUsernameDraft(updatedUser.username || normalizedUsername);
            setShowEditModal(false);
            setUsernameStatus({ status: "success", message: `Profile updated` });
            setNotice("Profile updated successfully.");
            window.dispatchEvent(new Event("auth-changed"));
        } catch (err) {
            setUsernameStatus({
                status: "error",
                message: err && err.message ? err.message : "Unable to update username."
            });
        } finally {
            setSavingUsername(false);
        }
    }

    function handleMenuClick(item) {
        setNotice(item.description);
    }

    async function handleLogout() {
        disconnectSocket();
        try {
            await logout();
        } catch {
            // Continue redirecting to login even if server-side cleanup fails.
        }
        window.dispatchEvent(new Event("auth-changed"));
        navigate("/login", { replace: true });
    }

    if (isDesktop) {
        return (
            <div className="profile-page-v2 profile-page-v2--desktop">
                {notice && <p className="profile-page-v2__alert profile-page-v2__alert--notice">{notice}</p>}

                <DesktopAppShell
                    sidebarRooms={joinedRooms}
                    onSelectSidebarRoom={(room) => navigate(`/confessions?roomId=${room.roomId}`)}
                    contentClassName="desktop-profile-shell"
                    hideStageHeader
                >
                    <div className="desktop-profile-container">
                        {loading && <ProfileSkeleton />}

                        {!loading && (
                            <div className="desktop-profile-grid">
                                <section className="desktop-profile-banner-card">
                                    <div className="desktop-profile-banner-card__gradient"></div>
                                    <div className="desktop-profile-banner-card__bottom">
                                        <div className="desktop-profile-banner-card__avatar-shell">
                                            <div className="desktop-profile-banner-card__avatar">
                                                {profileUser && (profileUser.preferences?.avatar || profileUser.avatar) ? (
                                                    <UserAvatar avatarId={profileUser.preferences?.avatar || profileUser.avatar} />
                                                ) : getInitial(profileUser?.username || profileUser?.email || "A")}
                                            </div>
                                        </div>
                                        <div className="desktop-profile-banner-card__info">
                                            <h2>{profileUser && profileUser.username ? profileUser.username : "Anonymous User"}</h2>
                                            <p>Anonymous User</p>
                                        </div>
                                        <div className="desktop-profile-banner-card__actions">
                                            <button
                                                type="button"
                                                className="desktop-profile-edit-button desktop-profile-edit-button--logout"
                                                onClick={handleLogout}
                                            >
                                                <LogoutIcon />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section className="desktop-profile-stats-row">
                                    <DesktopIconStatCard
                                        icon={<PeopleIcon />}
                                        iconTone="blue"
                                        value={joinedRooms.length}
                                        label="Rooms Joined"
                                    />
                                    <DesktopIconStatCard
                                        icon={<QuoteIcon />}
                                        iconTone="magenta"
                                        value={myConfessions.length}
                                        label="Confessions Posted"
                                    />
                                    <DesktopIconStatCard
                                        icon={<EnvelopeIcon />}
                                        iconTone="red"
                                        value={messageCount}
                                        label="Messages Sent"
                                    />
                                </section>

                                <section className="desktop-profile-section-card">
                                    <div className="desktop-profile-section-card__head">
                                        <h2>Joined Rooms</h2>
                                    </div>

                                    {joinedRooms.length === 0 && (
                                        <DesktopEmptyState
                                            compact
                                            title="No rooms joined yet"
                                            description="Discover rooms from Home and they will appear here."
                                        />
                                    )}

                                    {visibleRooms.length > 0 && (
                                        <div className="desktop-profile-room-list">
                                            {visibleRooms.map((room) => (
                                                <button
                                                    key={room.roomId}
                                                    type="button"
                                                    className="desktop-profile-room-card-v2"
                                                    onClick={() => navigate(`/confessions?roomId=${room.roomId}`)}
                                                >
                                                    <div className="desktop-profile-room-card-v2__avatar" aria-hidden="true">
                                                        {getInitial(room.title || "R")}
                                                    </div>
                                                    <div className="desktop-profile-room-card-v2__main">
                                                        <h4>{room.title}</h4>
                                                        <p>{room.description || "Quietly connect with others"}</p>
                                                        <div className="desktop-profile-room-card-v2__meta">
                                                            <PeopleIcon />
                                                            <span>{Number(room.currentUserCount || 0).toLocaleString()}</span>
                                                            {Number(room.currentUserCount || 0) > 0 && (
                                                                <>
                                                                    <span className="desktop-profile-room-card-v2__dot" aria-hidden="true"></span>
                                                                    <span className="desktop-profile-room-card-v2__status">active</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {hasMoreRooms && (
                                        <button
                                            type="button"
                                            className="desktop-link-button profile-view-all"
                                            onClick={() => setExpandedRooms((prev) => !prev)}
                                        >
                                            {expandedRooms ? "Show fewer rooms" : `View all ${joinedRooms.length} rooms`}
                                        </button>
                                    )}
                                </section>

                                <section className="desktop-privacy-banner">
                                    <h3>Your Privacy Matters</h3>
                                    <p>Your identity is completely anonymous. All confessions and messages are encrypted and your personal information is never shared with other users. Feel safe to express yourself freely.</p>
                                </section>
                            </div>
                        )}
                    </div>
                </DesktopAppShell>
            </div>
        );
    }

    return (
        <>
            <div className="profile-mobile-page profile-mobile-redesign" {...swipeNavigationHandlers}>
                {notice && <p className="profile-page-v2__alert profile-page-v2__alert--notice">{notice}</p>}

                {/* ── Top Bar with 3-lines Hamburger Menu Icon ── */}
                <div className="profile-mobile-topbar">
                    <div className="profile-mobile-topbar__title">Profile</div>
                    <button
                        type="button"
                        className="profile-mobile-menu-btn"
                        onClick={() => setShowRightSidebar(true)}
                        aria-label="Open settings menu"
                    >
                        <Menu size={24} color="#3B1F43" strokeWidth={2.2} />
                    </button>
                </div>

                {loading ? (
                    <div className="profile-content">
                        <ProfileSkeleton />
                    </div>
                ) : (
                    <main className="profile-mobile-redesign__content">
                        {/* ── 1. Top Header Card: Avatar + Stats ── */}
                        <section className="profile-redesign__header-card">
                            <div className="profile-redesign__top-row">
                                {/* Large Avatar with verified badge */}
                                <div className="profile-redesign__avatar-wrapper">
                                    <div className="profile-redesign__avatar-ring">
                                        <div className="profile-redesign__avatar-inner">
                                            {profileUser && (profileUser.preferences?.avatar || profileUser.avatar) ? (
                                                <UserAvatar avatarId={profileUser.preferences?.avatar || profileUser.avatar} />
                                            ) : getInitial(profileUser?.username || profileUser?.email || "A")}
                                        </div>
                                    </div>
                                    <div className="profile-redesign__verified-badge" title="Verified Anonymous Identity">
                                        <CheckCircle2 size={18} fill="#3B82F6" color="#FFFFFF" />
                                    </div>
                                </div>

                                {/* 3 Stats Columns */}
                                <div className="profile-redesign__stats-group">
                                    <div className="profile-redesign__stat-item">
                                        <span className="profile-redesign__stat-value">{myConfessions.length}</span>
                                        <span className="profile-redesign__stat-label">confessions</span>
                                    </div>
                                    <div className="profile-redesign__stat-item">
                                        <span className="profile-redesign__stat-value">{activeJoinedRooms.length}</span>
                                        <span className="profile-redesign__stat-label">rooms</span>
                                    </div>
                                    <div className="profile-redesign__stat-item">
                                        <span className="profile-redesign__stat-value">{totalRepliesCount}</span>
                                        <span className="profile-redesign__stat-label">replies</span>
                                    </div>
                                </div>
                            </div>

                            {/* User Bio Line */}
                            <div className="profile-redesign__bio-block">
                                <h1 className="profile-redesign__username">
                                    {profileUser?.username || "Anonymous User"}
                                    <span className="profile-redesign__joined-date"> · {formatJoinedDate(profileUser?.createdAt)}</span>
                                </h1>
                                <p className="profile-redesign__tagline">You are always anonymous in rooms.</p>
                                <div className="profile-redesign__badges-row">
                                    <span className="profile-badge-pill">Private identity</span>
                                </div>
                            </div>

                            {/* Single Prominent Edit Identity Button */}
                            <div className="profile-redesign__actions-row">
                                <button
                                    type="button"
                                    className="profile-redesign__btn profile-redesign__btn--primary profile-redesign__btn--full"
                                    onClick={() => {
                                        setShowEditModal(true);
                                        setUsernameStatus({ status: "idle", message: "" });
                                    }}
                                >
                                    Edit identity
                                </button>
                            </div>
                        </section>

                        {/* ── 2. Circular Story Bubbles Row (Joined Rooms + "+ New") ── */}
                        <section className="profile-redesign__bubbles-section">
                            <div className="profile-redesign__bubbles-scroll">
                                {/* Actively Joined Rooms */}
                                {activeJoinedRooms.map((room) => (
                                    <button
                                        key={room.roomId}
                                        type="button"
                                        className="profile-story-bubble"
                                        onClick={() => navigate(`/confessions?roomId=${room.roomId}`)}
                                    >
                                        <div className="profile-story-bubble__avatar">
                                            <span>{getInitial(room.title || "R")}</span>
                                        </div>
                                        <span className="profile-story-bubble__label">{room.title}</span>
                                    </button>
                                ))}

                                {/* "+ New" Bubble to Redirect to Search Page */}
                                <button
                                    type="button"
                                    className="profile-story-bubble profile-story-bubble--new"
                                    onClick={() => navigate('/search')}
                                >
                                    <div className="profile-story-bubble__avatar profile-story-bubble__avatar--add">
                                        <Plus size={22} strokeWidth={2.2} />
                                    </div>
                                    <span className="profile-story-bubble__label">New</span>
                                </button>
                            </div>
                        </section>

                        {/* ── 3. Section Tabs Bar ── */}
                        <nav className="profile-redesign__tabs-nav">
                            <button
                                type="button"
                                className={`profile-tab-btn${activeTab === "posts" ? " is-active" : ""}`}
                                onClick={() => setActiveTab("posts")}
                                aria-label="Confessions posts tab"
                            >
                                <Grid size={20} />
                            </button>
                            <button
                                type="button"
                                className={`profile-tab-btn${activeTab === "vault" ? " is-active" : ""}`}
                                onClick={() => setActiveTab("vault")}
                                aria-label="Vault tab"
                            >
                                <Bookmark size={20} />
                            </button>
                            <button
                                type="button"
                                className={`profile-tab-btn${activeTab === "expression" ? " is-active" : ""}`}
                                onClick={() => setActiveTab("expression")}
                                aria-label="Activity tab"
                            >
                                <Radio size={20} />
                            </button>
                        </nav>

                        {/* ── 4. Card 1: Emotional Weather Card ── */}
                        <section className="profile-redesign__card profile-weather-card">
                            <div className="profile-weather-card__header">
                                <span className="profile-weather-card__kicker">EMOTIONAL WEATHER</span>
                                <Sparkles size={18} className="profile-weather-card__sparkle" />
                            </div>
                            <h2 className="profile-weather-card__title">A thoughtful week</h2>

                            {/* Days row */}
                            <div className="profile-weather-card__days-row">
                                {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => (
                                    <div key={idx} className={`profile-weather-card__day${idx === 2 || idx === 4 ? " is-active" : ""}`}>
                                        <span className="profile-weather-card__day-letter">{day}</span>
                                        <span className="profile-weather-card__day-dot" />
                                    </div>
                                ))}
                            </div>

                            <p className="profile-weather-card__footer">Only you can see this gentle reflection.</p>
                        </section>

                        {/* ── 5. Card 2: Expression / Stats Grid ── */}
                        <section className="profile-redesign__section">
                            <div className="profile-redesign__section-title-row">
                                <h2 className="profile-redesign__section-title">Expression</h2>
                                <BarChart3 size={18} className="profile-redesign__section-icon" />
                            </div>

                            <div className="profile-redesign__expression-grid">
                                <div className="expression-pill-card">
                                    <strong className="expression-pill-card__num expression-pill-card__num--plum">
                                        {myConfessions.length}
                                    </strong>
                                    <span className="expression-pill-card__label">Confessions</span>
                                </div>

                                <div className="expression-pill-card">
                                    <strong className="expression-pill-card__num expression-pill-card__num--purple">
                                        {audioPostsCount}
                                    </strong>
                                    <span className="expression-pill-card__label">Audio</span>
                                </div>

                                <div className="expression-pill-card">
                                    <strong className="expression-pill-card__num expression-pill-card__num--dark">
                                        {totalRepliesCount}
                                    </strong>
                                    <span className="expression-pill-card__label">Replies</span>
                                </div>
                            </div>
                        </section>
                    </main>
                )}
            </div>

            {/* Edit Username & Avatar Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Identity"
                className="profile-modal-custom"
            >
                <ProfileEditForm
                    usernameId="profile-username-mobile"
                    usernameDraft={usernameDraft}
                    onUsernameChange={(event) => {
                        setUsernameDraft(event.target.value);
                        if (usernameStatus.message) setUsernameStatus({ status: "idle", message: "" });
                    }}
                    usernameStatus={usernameStatus}
                    draftAvatar={draftAvatar}
                    onAvatarSelect={setDraftAvatar}
                    saving={savingUsername}
                    onCancel={() => setShowEditModal(false)}
                    onSubmit={handleUsernameSave}
                />
            </Modal>

            {/* Right Sidebar Drawer — Settings Panel */}
            {showRightSidebar && (
                <SettingsDrawer
                    user={profileUser}
                    onClose={() => setShowRightSidebar(false)}
                    onUserUpdated={(updatedUser) => {
                        setProfileUser(updatedUser);
                        setUsernameDraft(updatedUser.username || "");
                        setDraftAvatar(updatedUser.preferences?.avatar || updatedUser.avatar || 'flowing_waterfall');
                        window.dispatchEvent(new Event("auth-changed"));
                    }}
                    onLogout={handleLogout}
                />
            )}
        </>
    );
}
