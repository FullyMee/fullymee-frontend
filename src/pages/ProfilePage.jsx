import { useEffect, useMemo, useState } from "react";
import DesktopAppShell from "../components/layout/DesktopAppShell.jsx";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CreditCard, Mail, MessageCircle, MessageSquareQuote, Moon, Pencil, Settings, Shield, Users, LogOut } from "lucide-react";
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
import useBodyClass from "../hooks/useBodyClass.js";
import useTimedNotice from "../hooks/useTimedNotice.js";
import { getInitial } from "../utils/presentation.js";
import usePrimaryTabSwipeNavigation from "../hooks/usePrimaryTabSwipeNavigation.js";

const VISIBLE_ROOMS_LIMIT = 6;

function SettingsIcon(props) { return <Settings size={18} strokeWidth={2} {...props} />; }
function PencilIcon() { return <Pencil size={18} strokeWidth={2} />; }
function ShieldIcon(props) { return <Shield size={18} strokeWidth={2} {...props} />; }
function QuoteIcon() { return <MessageSquareQuote size={18} strokeWidth={2} />; }
function EnvelopeIcon(props) { return <Mail size={18} strokeWidth={2} {...props} />; }
function PeopleIcon() { return <Users size={18} strokeWidth={2} />; }
function MoonIcon() { return <Moon size={18} strokeWidth={2} />; }
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
    const AVATAR_OPTIONS = ['🌙', '⭐', '🌸', '🦋', '🌊', '🔮', '💫', '🌺'];
    const [draftAvatar, setDraftAvatar] = useState('🌊');

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

    const swipeNavigationHandlers = usePrimaryTabSwipeNavigation({
        enabled: !isDesktop && !showEditModal
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
                                                {profileUser && profileUser.avatar ? profileUser.avatar : <MoonIcon />}
                                            </div>
                                        </div>
                                        <div className="desktop-profile-banner-card__info">
                                            <h2>{profileUser && profileUser.username ? profileUser.username : "Anonymous User"}</h2>
                                            <p>Anonymous User</p>
                                        </div>
                                        <div className="desktop-profile-banner-card__actions">
                                            <button
                                                type="button"
                                                className="desktop-profile-edit-button"
                                                onClick={() => {
                                                    setShowEditModal(true);
                                                    setUsernameStatus({ status: "idle", message: "" });
                                                    setDraftAvatar(profileUser && profileUser.avatar ? profileUser.avatar : '🌊');
                                                }}
                                            >
                                                <PencilIcon />
                                                <span>Edit Profile</span>
                                            </button>
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

                <Modal 
                    isOpen={showEditModal} 
                    onClose={() => setShowEditModal(false)} 
                    title="Edit Profile" 
                    className="profile-modal-custom"
                >
                    <ProfileEditForm
                        usernameId="profile-username"
                        usernameDraft={usernameDraft}
                        onUsernameChange={(event) => {
                            setUsernameDraft(event.target.value);
                            if (usernameStatus.message) setUsernameStatus({ status: "idle", message: "" });
                        }}
                        usernameStatus={usernameStatus}
                        draftAvatar={draftAvatar}
                        onAvatarSelect={setDraftAvatar}
                        avatarOptions={AVATAR_OPTIONS}
                        saving={savingUsername}
                        onCancel={() => setShowEditModal(false)}
                        onSubmit={handleUsernameSave}
                    />
                </Modal>
            </div>
        );
    }

    return (
        <>
            <div className="profile-mobile-page" {...swipeNavigationHandlers}>
                {notice && <p className="profile-page-v2__alert profile-page-v2__alert--notice">{notice}</p>}

            <header className="profile-header">
                {/* <h1>Profile</h1> */}
                <p>Manage your account and preferences</p>
            </header>

            <main className="profile-content">
                {loading ? (
                    <ProfileSkeleton />
                ) : (
                    <>
                        <section className="profile-hero">
                            <div className="profile-hero__avatar">
                                {getInitial(profileUser && profileUser.username ? profileUser.username : profileUser && profileUser.email ? profileUser.email : "A")}
                            </div>
                            <div className="profile-hero__info">
                                <h2>{profileUser && profileUser.username ? profileUser.username : "Anonymous User"}</h2>
                                <p>Joined {formatJoinedDate(profileUser && profileUser.createdAt)}</p>
                            </div>
                            <button
                                type="button"
                                className="profile-hero__edit"
                                onClick={() => {
                                    setShowEditModal(true);
                                    setUsernameStatus({ status: "idle", message: "" });
                                }}
                            >
                                Edit Profile
                            </button>
                        </section>

                        <section className="profile-stats">
                            <div className="profile-stat-box">
                                <strong>{myConfessions.length}</strong>
                                <span>Posts</span>
                            </div>
                            <div className="profile-stat-box">
                                <strong>{profileUser && profileUser.reactionCount || 0}</strong>
                                <span>Likes</span>
                            </div>
                            <div className="profile-stat-box">
                                <strong>{joinedRooms.length}</strong>
                                <span>Rooms</span>
                            </div>
                        </section>

                        <div className="profile-menu">
                            <button
                                type="button"
                                className="profile-menu__item"
                                onClick={() => {
                                    setShowEditModal(true);
                                    setUsernameStatus({ status: "idle", message: "" });
                                }}
                            >
                                <div className="profile-menu__icon">
                                    <SettingsIcon />
                                </div>
                                <span className="profile-menu__label">Account Settings</span>
                                <ArrowRightIcon className="profile-menu__chevron" />
                            </button>

                            <button
                                type="button"
                                className="profile-menu__item"
                                onClick={() => handleMenuClick({ id: 'privacy', label: 'Privacy & Security' })}
                            >
                                <div className="profile-menu__icon">
                                    <ShieldIcon />
                                </div>
                                <span className="profile-menu__label">Privacy & Security</span>
                                <ArrowRightIcon className="profile-menu__chevron" />
                            </button>

                            <button
                                type="button"
                                className="profile-menu__item"
                                onClick={() => handleMenuClick({ id: 'help', label: 'Help & Support' })}
                            >
                                <div className="profile-menu__icon">
                                    <EnvelopeIcon />
                                </div>
                                <span className="profile-menu__label">Help & Support</span>
                                <ArrowRightIcon className="profile-menu__chevron" />
                            </button>

                            <button
                                type="button"
                                className="profile-menu__item profile-menu__item--logout"
                                onClick={handleLogout}
                            >
                                <div className="profile-menu__icon">
                                    <LogoutIcon />
                                </div>
                                <span className="profile-menu__label">Logout</span>
                                <ArrowRightIcon className="profile-menu__chevron" />
                            </button>
                        </div>
                    </>
                )}
            </main>

            </div>

            <Modal 
                isOpen={showEditModal} 
                onClose={() => setShowEditModal(false)} 
                title="Edit Profile" 
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
                    avatarOptions={AVATAR_OPTIONS}
                    saving={savingUsername}
                    onCancel={() => setShowEditModal(false)}
                    onSubmit={handleUsernameSave}
                />
            </Modal>
        </>
    );
}
