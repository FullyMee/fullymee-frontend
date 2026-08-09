import { useEffect, useState } from "react";
import {
    X, ChevronLeft, ChevronRight, User, Tag, Mail,
    MessageCircle, Moon, Lock, EyeOff, Clock, Check, Loader2, Smile, LogOut
} from "lucide-react";
import useSettingsDrawer, {
    CHAT_PERMISSION_OPTIONS,
    AUDIO_EXPIRY_OPTIONS
} from "../hooks/useSettingsDrawer.js";
import { logout } from "../../../services/auth.service.js";
import { disconnectSocket } from "../../../services/socket.js";
import UserAvatar from "../../../components/common/UserAvatar.jsx";
import AvatarPicker from "../../../components/common/AvatarPicker.jsx";
import { AVATAR_OPTIONS } from "../../../constants/avatars.js";
// ─────────────────────────────────────────────────────────────────────────────
// Shared atomic helpers
// ─────────────────────────────────────────────────────────────────────────────

function ToggleSwitch({ id, checked, onChange, disabled }) {
    return (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            className={`sd-toggle${checked ? " sd-toggle--on" : ""}`}
            onClick={() => onChange(!checked)}
        >
            <span className="sd-toggle__thumb" />
        </button>
    );
}

function StatusBadge({ status, message }) {
    if (!message) return null;
    return (
        <span className={`sd-status-badge sd-status-badge--${status}`}>
            {status === "checking" && <Loader2 size={11} className="sd-status-badge__spin" />}
            {status === "success"  && <Check size={11} />}
            {message}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Shell — wraps each sub-page with header + scrollable body
// ─────────────────────────────────────────────────────────────────────────────

function PageShell({ title, onBack, onClose, notice, children, animDir }) {
    return (
        <div className={`sd-page sd-page--${animDir}`} key={title}>
            {/* Header */}
            <div className="sd-header">
                <button
                    type="button"
                    className="sd-header__back"
                    onClick={onBack}
                    aria-label="Go back"
                >
                    <ChevronLeft size={20} strokeWidth={2} />
                    <span>Back</span>
                </button>
                <h2 className="sd-header__title sd-header__title--sub">{title}</h2>
                <button
                    type="button"
                    className="sd-header__close"
                    onClick={onClose}
                    aria-label="Close settings"
                >
                    <X size={20} strokeWidth={2} />
                </button>
            </div>

            {/* Notice toast */}
            {notice && (
                <div className="sd-notice" role="status">
                    <Check size={14} />
                    {notice}
                </div>
            )}

            {/* Scrollable content */}
            <div className="sd-body">
                {children}
                <div className="sd-bottom-spacer" />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main List — root settings page
// ─────────────────────────────────────────────────────────────────────────────

function ListRow({ icon: Icon, iconColor, title, subtitle, value, valueEmoji, onClick, isLast, titleColor, hideChevron }) {
    return (
        <button
            type="button"
            className={`sd-list-row${isLast ? " sd-list-row--last" : ""}`}
            onClick={onClick}
        >
            <div className="sd-list-row__icon-wrap" style={{ background: iconColor + "18", color: iconColor }}>
                <Icon size={16} strokeWidth={2} />
            </div>
            <div className="sd-list-row__body">
                <span className="sd-list-row__title" style={titleColor ? { color: titleColor } : undefined}>{title}</span>
                {subtitle && <span className="sd-list-row__sub">{subtitle}</span>}
            </div>
            <div className="sd-list-row__right">
                {valueEmoji && <span className="sd-list-row__emoji">{valueEmoji}</span>}
                {value && <span className="sd-list-row__value">{value}</span>}
                {!hideChevron && <ChevronRight size={15} className="sd-list-row__chevron" />}
            </div>
        </button>
    );
}

function SectionGroup({ label, children }) {
    return (
        <div className="sd-group">
            <div className="sd-group__label">{label}</div>
            <div className="sd-group__card">
                {children}
            </div>
        </div>
    );
}

function MainPage({ s, user, onNavigate, onClose, animDir, onLogout }) {
    const chatLabel = CHAT_PERMISSION_OPTIONS.find(o => o.value === s.chatPermission)?.label || "Everyone";
    const expiryLabel = AUDIO_EXPIRY_OPTIONS.find(o => o.value === s.audioExpiry)?.label || "Never";
    const interestCount = s.interests.length;

    async function handleLogoutClick() {
        if (typeof onLogout === "function") {
            onLogout();
            return;
        }
        disconnectSocket();
        try {
            await logout();
        } catch {
            // continue redirecting even if cleanup fails
        }
        window.dispatchEvent(new Event("auth-changed"));
        window.location.href = "/login";
    }

    return (
        <div className={`sd-page sd-page--${animDir}`}>
            {/* Header */}
            <div className="sd-header">
                <h2 className="sd-header__title">Settings</h2>
                <button type="button" className="sd-header__close" onClick={onClose} aria-label="Close settings">
                    <X size={20} strokeWidth={2} />
                </button>
            </div>

            {s.notice && (
                <div className="sd-notice" role="status">
                    <Check size={14} />
                    {s.notice}
                </div>
            )}

            <div className="sd-body">
                {/* ── IDENTITY ── */}
                <SectionGroup label="Identity">
                    <ListRow
                        icon={User}
                        iconColor="#7B4FA6"
                        title="Username & Avatar"
                        subtitle={user?.username ? `@${user.username}` : "Not set"}
                        valueEmoji={<div style={{ width: '20px', height: '20px' }}><UserAvatar avatarId={s.avatarDraft} /></div>}
                        onClick={() => onNavigate("identity")}
                    />
                    <ListRow
                        icon={Tag}
                        iconColor="#3B82F6"
                        title="Interests & Mood Tags"
                        subtitle="Personalise your experience"
                        value={interestCount > 0 ? `${interestCount} tag${interestCount !== 1 ? "s" : ""}` : "None"}
                        onClick={() => onNavigate("interests")}
                    />
                    <ListRow
                        icon={Mail}
                        iconColor="#EC4899"
                        title="Email"
                        subtitle="Your registered email"
                        value={user?.email ? user.email.split("@")[0] + "@…" : "—"}
                        onClick={() => onNavigate("email")}
                        isLast
                    />
                </SectionGroup>

                {/* ── CHAT CONTROLS ── */}
                <SectionGroup label="Chat Controls">
                    <ListRow
                        icon={MessageCircle}
                        iconColor="#10B981"
                        title="Chat Request Permissions"
                        subtitle="Who can send you requests"
                        value={chatLabel}
                        onClick={() => onNavigate("chat-permission")}
                    />
                    <ListRow
                        icon={Moon}
                        iconColor="#6366F1"
                        title="Limit Night-time Requests"
                        subtitle="Quiet hours: 11 PM – 7 AM"
                        value={s.nighttimeLimit ? "On" : "Off"}
                        onClick={() => onNavigate("nighttime")}
                        isLast
                    />
                </SectionGroup>

                {/* ── PRIVACY & SAFETY ── */}
                <SectionGroup label="Privacy & Safety">
                    <ListRow
                        icon={EyeOff}
                        iconColor="#F59E0B"
                        title="Hide Joined Rooms"
                        subtitle="Never show room history"
                        value={s.hideRooms ? "On" : "Off"}
                        onClick={() => onNavigate("hide-rooms")}
                    />
                    <ListRow
                        icon={Lock}
                        iconColor="#8B5CF6"
                        title="Hide My Profile"
                        subtitle="Invisible to all other users"
                        value={s.hideProfileGlobal ? "Hidden" : "Visible"}
                        onClick={() => onNavigate("hide-profile")}
                    />
                    <ListRow
                        icon={Clock}
                        iconColor="#EF4444"
                        title="Played Audio Expiry"
                        subtitle="When your audio confessions expire"
                        value={expiryLabel}
                        onClick={() => onNavigate("audio-expiry")}
                        isLast
                    />
                </SectionGroup>

                {/* ── ACCOUNT / LOG OUT ── */}
                <SectionGroup label="Account">
                    <ListRow
                        icon={LogOut}
                        iconColor="#EF4444"
                        title="Log Out"
                        subtitle="Sign out of your account"
                        onClick={handleLogoutClick}
                        titleColor="#EF4444"
                        hideChevron
                        isLast
                    />
                </SectionGroup>

                <div className="sd-bottom-spacer" />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-page: Identity (Username + Avatar)
// ─────────────────────────────────────────────────────────────────────────────

function IdentityPage({ s, onBack, onClose, animDir }) {
    return (
        <PageShell title="Username & Avatar" onBack={onBack} onClose={onClose} notice={s.notice} animDir={animDir}>
            <form onSubmit={s.saveIdentity} id="sd-identity-form" className="sd-subpage-form">

                {/* Current preview */}
                <div className="sd-identity-preview">
                    <div className="sd-identity-preview__avatar" style={{ width: '64px', height: '64px', overflow: 'hidden' }}>
                        <UserAvatar avatarId={s.avatarDraft} />
                    </div>
                    <div className="sd-identity-preview__name">
                        {s.usernameDraft || <span style={{ opacity: 0.4 }}>your_username</span>}
                    </div>
                </div>

                {/* Avatar grid */}
                <div className="sd-subpage-section">
                    <div className="sd-subpage-label">
                        <Smile size={14} />
                        Choose Avatar
                    </div>
                    <AvatarPicker selectedAvatar={s.avatarDraft} onSelect={s.setAvatarDraft} />
                    
                    {s.avatarDraft && (() => {
                        const sel = AVATAR_OPTIONS.find(a => a.id === s.avatarDraft);
                        if (sel) {
                            return (
                                <div className="sd-emotional-desc-box">
                                    <h5 className="sd-emotional-desc-title">{sel.name}</h5>
                                    <p className="sd-emotional-desc-text">{sel.quote}</p>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>

                {/* Username input */}
                <div className="sd-subpage-section">
                    <div className="sd-subpage-label">
                        <User size={14} />
                        Username
                    </div>
                    <input
                        id="sd-username-input"
                        type="text"
                        className={`sd-input${s.identityStatus.status === "error" ? " sd-input--error" : s.identityStatus.status === "success" ? " sd-input--success" : ""}`}
                        value={s.usernameDraft}
                        onChange={(e) => {
                            s.setUsernameDraft(e.target.value);
                            if (s.identityStatus.message) s.setIdentityStatus({ status: "idle", message: "" });
                        }}
                        placeholder="e.g. stargazer"
                        maxLength={20}
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                    />
                    <StatusBadge status={s.identityStatus.status} message={s.identityStatus.message} />
                    <p className="sd-hint">3–20 chars · letters, numbers, dots, underscores</p>
                </div>

                <div className="sd-subpage-footer">
                    <button
                        type="submit"
                        className="sd-save-btn"
                        disabled={s.savingIdentity}
                        id="sd-identity-save-btn"
                    >
                        {s.savingIdentity
                            ? <><Loader2 size={15} className="sd-save-btn__spin" /> Saving…</>
                            : <><Check size={15} /> Save Changes</>
                        }
                    </button>
                </div>
            </form>
        </PageShell>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-page: Interests & Mood Tags
// ─────────────────────────────────────────────────────────────────────────────

function InterestsPage({ s, onBack, onClose, animDir }) {
    function handleKeyDown(e) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            s.addInterest(s.interestInput);
            s.setInterestInput("");
        }
    }

    const suggestions = ["music", "art", "anxiety", "love", "healing", "poetry", "dreams", "books"];
    const unusedSuggestions = suggestions.filter(t => !s.interests.includes(t));

    return (
        <PageShell title="Interests & Mood Tags" onBack={onBack} onClose={onClose} notice={s.notice} animDir={animDir}>
            <div className="sd-subpage-form">
                {/* Current tags */}
                <div className="sd-subpage-section">
                    <div className="sd-subpage-label">
                        <Tag size={14} />
                        Your tags
                        <span className="sd-subpage-label__count">{s.interests.length}/15</span>
                    </div>

                    <div className="sd-tags-wrap">
                        {s.interests.map((tag) => (
                            <span key={tag} className="sd-tag-chip">
                                {tag}
                                <button
                                    type="button"
                                    className="sd-tag-chip__remove"
                                    aria-label={`Remove ${tag}`}
                                    onClick={() => s.removeInterest(tag)}
                                >
                                    <X size={10} />
                                </button>
                            </span>
                        ))}
                        {s.interests.length === 0 && (
                            <span className="sd-tags-empty">No tags yet — add some below</span>
                        )}
                    </div>
                </div>

                {/* Add tag input */}
                {s.interests.length < 15 && (
                    <div className="sd-subpage-section">
                        <div className="sd-subpage-label">Add a tag</div>
                        <div className="sd-add-tag-row">
                            <input
                                id="sd-interest-input"
                                type="text"
                                className="sd-input sd-input--sm"
                                value={s.interestInput}
                                onChange={(e) => s.setInterestInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type and press Enter…"
                                maxLength={40}
                            />
                            <button
                                type="button"
                                className="sd-add-tag-btn"
                                onClick={() => { s.addInterest(s.interestInput); s.setInterestInput(""); }}
                            >
                                Add
                            </button>
                        </div>

                        {/* Suggestions */}
                        {unusedSuggestions.length > 0 && (
                            <div className="sd-suggestions">
                                <span className="sd-suggestions__label">Suggestions:</span>
                                <div className="sd-suggestions__pills">
                                    {unusedSuggestions.slice(0, 6).map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            className="sd-suggestion-pill"
                                            onClick={() => s.addInterest(t)}
                                        >
                                            + {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="sd-subpage-footer">
                    <button
                        type="button"
                        className="sd-save-btn"
                        onClick={s.saveInterests}
                        disabled={s.savingInterests}
                        id="sd-interests-save-btn"
                    >
                        {s.savingInterests
                            ? <><Loader2 size={15} className="sd-save-btn__spin" /> Saving…</>
                            : <><Check size={15} /> Save Interests</>
                        }
                    </button>
                </div>
            </div>
        </PageShell>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-page: Email (read-only)
// ─────────────────────────────────────────────────────────────────────────────

function EmailPage({ user, onBack, onClose, animDir }) {
    return (
        <PageShell title="Email Address" onBack={onBack} onClose={onClose} animDir={animDir}>
            <div className="sd-subpage-form">
                <div className="sd-subpage-section">
                    <div className="sd-email-card">
                        <div className="sd-email-card__icon">
                            <Mail size={24} strokeWidth={1.5} />
                        </div>
                        <div className="sd-email-card__label">Registered Email</div>
                        <div className="sd-email-card__value">{user?.email || "—"}</div>
                        <p className="sd-email-card__note">
                            This is the email you signed up with. It cannot be changed here.
                        </p>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-page: Chat Request Permissions
// ─────────────────────────────────────────────────────────────────────────────

function ChatPermissionPage({ s, onBack, onClose, animDir }) {
    const descriptions = {
        everyone: "Anyone who sees your confessions or profile can send you a chat request.",
        nobody:   "No one can send you chat requests. You maintain complete privacy."
    };

    return (
        <PageShell title="Chat Permissions" onBack={onBack} onClose={onClose} notice={s.notice} animDir={animDir}>
            <div className="sd-subpage-form">
                <div className="sd-subpage-section">
                    <div className="sd-subpage-label">
                        <MessageCircle size={14} />
                        Who can send you chat requests?
                    </div>

                    <div className="sd-option-list" role="radiogroup" aria-label="Chat request permissions">
                        {CHAT_PERMISSION_OPTIONS.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={s.chatPermission === value}
                                id={`sd-chat-perm-${value}`}
                                className={`sd-option-row${s.chatPermission === value ? " sd-option-row--active" : ""}`}
                                onClick={() => s.handleChatPermission(value)}
                            >
                                <div className="sd-option-row__check">
                                    {s.chatPermission === value && <Check size={13} strokeWidth={2.5} />}
                                </div>
                                <div className="sd-option-row__body">
                                    <span className="sd-option-row__label">{label}</span>
                                    <span className="sd-option-row__desc">{descriptions[value]}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </PageShell>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-page: Night-time Limit
// ─────────────────────────────────────────────────────────────────────────────

function NighttimePage({ s, onBack, onClose, animDir }) {
    return (
        <PageShell title="Night-time Requests" onBack={onBack} onClose={onClose} notice={s.notice} animDir={animDir}>
            <div className="sd-subpage-form">
                <div className="sd-toggle-hero">
                    <div className="sd-toggle-hero__icon" style={{ background: "#6366F115", color: "#6366F1" }}>
                        <Moon size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="sd-toggle-hero__title">Quiet Hours</h3>
                    <p className="sd-toggle-hero__desc">
                        When enabled, no chat requests will be delivered between <strong>11 PM</strong> and <strong>7 AM</strong>. Perfect for protecting your rest.
                    </p>

                    <div className="sd-toggle-hero__control">
                        <span className="sd-toggle-hero__status">
                            {s.nighttimeLimit ? "Enabled" : "Disabled"}
                        </span>
                        <ToggleSwitch
                            id="sd-nighttime-toggle"
                            checked={s.nighttimeLimit}
                            onChange={s.handleNighttimeLimit}
                        />
                    </div>
                </div>

                <div className="sd-info-card">
                    <span className="sd-info-card__icon">🌙</span>
                    <span>Requests sent during quiet hours are held and delivered after 7 AM.</span>
                </div>
            </div>
        </PageShell>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-page: Hide Joined Rooms
// ─────────────────────────────────────────────────────────────────────────────

function HideRoomsPage({ s, onBack, onClose, animDir }) {
    return (
        <PageShell title="Hide Joined Rooms" onBack={onBack} onClose={onClose} notice={s.notice} animDir={animDir}>
            <div className="sd-subpage-form">
                <div className="sd-toggle-hero">
                    <div className="sd-toggle-hero__icon" style={{ background: "#F59E0B15", color: "#F59E0B" }}>
                        <EyeOff size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="sd-toggle-hero__title">Room Privacy</h3>
                    <p className="sd-toggle-hero__desc">
                        When enabled, your joined rooms are never shown outside your own profile view. Other users and guests won't be able to see your room history.
                    </p>

                    <div className="sd-toggle-hero__control">
                        <span className="sd-toggle-hero__status">
                            {s.hideRooms ? "Hidden" : "Visible"}
                        </span>
                        <ToggleSwitch
                            id="sd-hide-rooms-toggle"
                            checked={s.hideRooms}
                            onChange={s.handleHideRooms}
                        />
                    </div>
                </div>

                <div className="sd-info-card">
                    <span className="sd-info-card__icon">🔒</span>
                    <span>Your own profile page always shows your rooms, regardless of this setting.</span>
                </div>
            </div>
        </PageShell>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-page: Hide Profile Globally
// ─────────────────────────────────────────────────────────────────────────────

function HideProfilePage({ s, onBack, onClose, animDir }) {
    return (
        <PageShell title="Hide My Profile" onBack={onBack} onClose={onClose} notice={s.notice} animDir={animDir}>
            <div className="sd-subpage-form">
                <div className="sd-toggle-hero">
                    <div className="sd-toggle-hero__icon" style={{ background: "#8B5CF615", color: "#8B5CF6" }}>
                        <Lock size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="sd-toggle-hero__title">Profile Visibility</h3>
                    <p className="sd-toggle-hero__desc">
                        When enabled, your username and profile will be completely hidden from
                        other users. Nobody can search for you, and clicking your alias in a
                        room will show a &ldquo;kept private&rdquo; screen instead of your profile.
                    </p>

                    <div className="sd-toggle-hero__control">
                        <span className="sd-toggle-hero__status">
                            {s.hideProfileGlobal ? "Hidden" : "Visible"}
                        </span>
                        <ToggleSwitch
                            id="sd-hide-profile-toggle"
                            checked={s.hideProfileGlobal}
                            onChange={s.handleHideProfileGlobal}
                        />
                    </div>
                </div>

                <div className="sd-info-card">
                    <span className="sd-info-card__icon">👻</span>
                    <span>You can still see your own profile normally. Only others are affected by this setting.</span>
                </div>

                {s.hideProfileGlobal && (
                    <div className="sd-info-card" style={{ borderColor: "rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.06)" }}>
                        <span className="sd-info-card__icon">🔮</span>
                        <span>Your profile is currently hidden. Other users cannot find or view you.</span>
                    </div>
                )}
            </div>
        </PageShell>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-page: Audio Expiry
// ─────────────────────────────────────────────────────────────────────────────

function AudioExpiryPage({ s, onBack, onClose, animDir }) {
    const descriptions = {
        never: "Your audio confessions stay available forever until you delete them manually.",
        "24h": "Audio confessions automatically expire 24 hours after they are first played.",
        "7d":  "Audio confessions automatically expire 7 days after they are first played.",
        "30d": "Audio confessions automatically expire 30 days after they are first played."
    };

    return (
        <PageShell title="Audio Expiry" onBack={onBack} onClose={onClose} notice={s.notice} animDir={animDir}>
            <div className="sd-subpage-form">
                <div className="sd-subpage-section">
                    <div className="sd-subpage-label">
                        <Clock size={14} />
                        Expiry after first play
                    </div>

                    <div className="sd-option-list" role="radiogroup" aria-label="Audio expiry duration">
                        {AUDIO_EXPIRY_OPTIONS.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={s.audioExpiry === value}
                                id={`sd-audio-expiry-${value}`}
                                className={`sd-option-row${s.audioExpiry === value ? " sd-option-row--active" : ""}`}
                                onClick={() => s.handleAudioExpiry(value)}
                            >
                                <div className="sd-option-row__check">
                                    {s.audioExpiry === value && <Check size={13} strokeWidth={2.5} />}
                                </div>
                                <div className="sd-option-row__body">
                                    <span className="sd-option-row__label">{label}</span>
                                    <span className="sd-option-row__desc">{descriptions[value]}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="sd-info-card">
                    <span className="sd-info-card__icon">🎙️</span>
                    <span>This only applies to audio confessions. Text posts are unaffected.</span>
                </div>
            </div>
        </PageShell>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root: SettingsDrawer
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_COMPONENTS = {
    identity:        IdentityPage,
    interests:       InterestsPage,
    email:           EmailPage,
    "chat-permission": ChatPermissionPage,
    nighttime:       NighttimePage,
    "hide-rooms":    HideRoomsPage,
    "hide-profile":  HideProfilePage,
    "audio-expiry":  AudioExpiryPage,
};

export default function SettingsDrawer({ user, onClose, onUserUpdated, onLogout }) {
    const [page, setPage]       = useState("main");
    const [animDir, setAnimDir] = useState("forward");

    const s = useSettingsDrawer(user, onUserUpdated);

    function navigate(target) {
        setAnimDir("forward");
        setPage(target);
    }

    function goBack() {
        setAnimDir("back");
        setPage("main");
    }

    // Escape key
    useEffect(() => {
        function handleKey(e) {
            if (e.key === "Escape") {
                if (page !== "main") goBack();
                else onClose?.();
            }
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [page, onClose]);

    // ── Render ──────────────────────────────────────────────────────────────
    let pageNode;

    if (page === "main") {
        pageNode = (
            <MainPage
                key="main"
                s={s}
                user={user}
                onNavigate={navigate}
                onClose={onClose}
                animDir={animDir}
                onLogout={onLogout}
            />
        );
    } else {
        const SubPage = PAGE_COMPONENTS[page];
        pageNode = SubPage ? (
            <SubPage
                key={page}
                s={s}
                user={user}
                onBack={goBack}
                onClose={onClose}
                animDir={animDir}
            />
        ) : null;
    }

    return (
        <div
            className="sd-backdrop"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
            aria-label="Settings"
        >
            <aside
                className="sd-panel"
                onClick={(e) => e.stopPropagation()}
            >
                {pageNode}
            </aside>
        </div>
    );
}
