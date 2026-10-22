import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    User, MessageCircle, Lock, Tag, Mail, Moon, EyeOff, Clock,
    CheckCircle2, ChevronDown, ChevronUp, LogOut, Check, Loader2
} from "lucide-react";
import DesktopAppShell from "../components/layout/DesktopAppShell.jsx";
import useAuth from "../hooks/useAuth.js";
import useIsDesktop from "../hooks/useIsDesktop.js";
import SettingsDrawer from "../features/profile/components/SettingsDrawer.jsx";
import useSettingsDrawer, {
    CHAT_PERMISSION_OPTIONS
} from "../features/profile/hooks/useSettingsDrawer.js";
import { AVATAR_OPTIONS } from "../constants/avatars.js";
import UserAvatar from "../components/common/UserAvatar.jsx";
import { logout } from "../services/auth.service.js";
import { getJoinedRooms } from "../services/confession.service.js";
import "../features/profile/settings-desktop.css";

const PREDEFINED_MOOD_TAGS = [
    "Late-night thoughts", "Heartbreak", "Career", "Anxiety",
    "Confidence", "Study stress", "Friendship", "Family",
    "Music", "Loneliness", "Self-doubt", "First love"
];

const QUIET_HOURS_FROM = ["9:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"];
const QUIET_HOURS_UNTIL = ["5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM"];

const AUDIO_EXPIRY_CARD_OPTIONS = [
    { value: "never", label: "Never", desc: "Audio confessions stay available." },
    { value: "once", label: "After playing once", desc: "Vanishes the moment it is heard." },
    { value: "24h", label: "After 24 hours", desc: "Disappears a day after posting." },
    { value: "7d", label: "After 7 days", desc: "Disappears a week after posting." }
];

function AccordionItem({ id, openId, onToggle, iconBubble, title, subtitle, rightContent, badge, children }) {
    const isExpanded = openId === id;
    return (
        <div className={`dt-settings-accordion-item${isExpanded ? " is-expanded" : ""}`}>
            <button
                type="button"
                className="dt-settings-accordion-header"
                onClick={() => onToggle(id)}
            >
                <div className="dt-settings-accordion-left">
                    {iconBubble}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <h4 className="dt-settings-accordion-title">{title}</h4>
                            {badge}
                        </div>
                        <p className="dt-settings-accordion-subtitle">{subtitle}</p>
                    </div>
                </div>
                <div className="dt-settings-accordion-right">
                    {rightContent}
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </button>
            {isExpanded && (
                <div className="dt-settings-accordion-body">
                    {children}
                </div>
            )}
        </div>
    );
}

function ToggleSwitchRow({ label, description, checked, onChange, disabled }) {
    return (
        <div className={`dt-settings-switch-row${disabled ? " dt-settings-switch-row--card" : ""}`} style={disabled ? { opacity: 0.6, cursor: "not-allowed" } : undefined}>
            <div>
                <span className="dt-settings-field-label" style={{ margin: 0 }}>{label}</span>
                <p className="dt-settings-help-text" style={{ margin: 0 }}>{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                className={`dt-settings-toggle${checked ? " dt-settings-toggle--on" : ""}`}
                style={disabled ? { cursor: "not-allowed", opacity: 0.5 } : undefined}
                onClick={() => !disabled && onChange && onChange(!checked)}
            >
                <span className="dt-settings-toggle__thumb" />
            </button>
        </div>
    );
}

function OptionCardGrid({ className, options, selectedValue, onSelect }) {
    return (
        <div className={className}>
            {options.map((opt) => {
                const selected = selectedValue === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        className={`dt-settings-audio-card${selected ? " is-selected" : ""}`}
                        onClick={() => onSelect(opt.value)}
                    >
                        <span className={`dt-settings-audio-radio${selected ? " is-selected" : ""}`}>
                            {selected && <Check size={10} strokeWidth={3} />}
                        </span>
                        <div className="dt-settings-audio-card-copy">
                            <span className="dt-settings-audio-card-title">{opt.label}</span>
                            <span className="dt-settings-audio-card-desc">{opt.desc}</span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

export default function SettingsPage({ user: propUser }) {
    const navigate = useNavigate();
    const isDesktop = useIsDesktop();
    const { user: authUser, setUser } = useAuth();
    const currentUser = propUser || authUser;

    const s = useSettingsDrawer(currentUser, (updated) => {
        if (typeof setUser === "function") setUser(updated);
    });

    const [joinedRooms, setJoinedRooms] = useState([]);

    useEffect(() => {
        getJoinedRooms()
            .then((rooms) => setJoinedRooms(Array.isArray(rooms) ? rooms : []))
            .catch(() => {});
    }, []);

    const [openAccordion, setOpenAccordion] = useState("username-avatar");
    const [activeTab, setActiveTab] = useState("identity");
    const [quietFrom] = useState("11:00 PM");
    const [quietUntil] = useState("7:00 AM");

    const toggleAccordion = (id) => {
        setOpenAccordion((prev) => (prev === id ? null : id));
    };

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = "/login";
        } catch {
            window.location.href = "/login";
        }
    };

    const scrollToSection = (sectionId) => {
        setActiveTab(sectionId);
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    if (!isDesktop) {
        return (
            <SettingsDrawer
                isOpen={true}
                onClose={() => navigate(-1)}
                user={currentUser}
            />
        );
    }

    return (
        <DesktopAppShell
            sidebarRooms={joinedRooms}
            onSelectSidebarRoom={(room) => navigate(`/confessions?roomId=${room.roomId}`)}
            hideStageHeader={true}
        >
            <div className="dt-settings-container">
                <header className="dt-settings-header">
                    <div>
                        <h1 className="dt-settings-header__title">Settings</h1>
                        <p className="dt-settings-header__subtitle">
                            Control who can reach you, what you reveal, and how long your confessions live.
                        </p>
                    </div>
                    <div className="dt-settings-badge">
                        <CheckCircle2 size={15} color="#10B981" />
                        <span>Changes save automatically</span>
                    </div>
                </header>

                <div className="dt-settings-grid">
                    <aside className="dt-settings-left">
                        <nav className="dt-settings-nav-card" aria-label="Settings Categories">
                            <button
                                type="button"
                                className={`dt-settings-nav-btn${activeTab === "identity" ? " is-active" : ""}`}
                                onClick={() => scrollToSection("identity")}
                            >
                                <span className="dt-settings-nav-btn__left">
                                    <User size={18} />
                                    <span>Identity</span>
                                </span>
                                <span className="dt-settings-nav-btn__count">3</span>
                            </button>

                            <button
                                type="button"
                                className={`dt-settings-nav-btn${activeTab === "chat-controls" ? " is-active" : ""}`}
                                onClick={() => scrollToSection("chat-controls")}
                            >
                                <span className="dt-settings-nav-btn__left">
                                    <MessageCircle size={18} />
                                    <span>Chat Controls</span>
                                </span>
                                <span className="dt-settings-nav-btn__count">2</span>
                            </button>

                            <button
                                type="button"
                                className={`dt-settings-nav-btn${activeTab === "privacy-safety" ? " is-active" : ""}`}
                                onClick={() => scrollToSection("privacy-safety")}
                            >
                                <span className="dt-settings-nav-btn__left">
                                    <Lock size={18} />
                                    <span>Privacy & Safety</span>
                                </span>
                                <span className="dt-settings-nav-btn__count">3</span>
                            </button>
                        </nav>

                        <div className="dt-settings-anon-card">
                            <div className="dt-settings-anon-icon">
                                <Lock size={16} />
                            </div>
                            <h2 className="dt-settings-anon-title">Anonymous by design</h2>
                            <p className="dt-settings-anon-desc">
                                Your email is never shown to anyone. Only your generated handle travels with your confessions and chats.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="dt-settings-logout-btn"
                            onClick={handleLogout}
                        >
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </aside>

                    <main className="dt-settings-right">
                        {/* SECTION 1: IDENTITY */}
                        <section id="identity">
                            <div className="dt-settings-section-head">
                                <h3 className="dt-settings-section-title">IDENTITY</h3>
                                <p className="dt-settings-section-desc">The handle and details attached to everything you post.</p>
                            </div>

                            <div className="dt-settings-accordion-group">
                                {/* Accordion 1: Username & Avatar */}
                                <AccordionItem
                                    id="username-avatar"
                                    openId={openAccordion}
                                    onToggle={toggleAccordion}
                                    iconBubble={
                                        <span className="dt-settings-icon-bubble" style={{ overflow: 'hidden', padding: 0, backgroundColor: 'transparent', width: '36px', height: '36px' }}>
                                            {s.avatarDraft ? (
                                                <UserAvatar avatarId={s.avatarDraft} />
                                            ) : (
                                                <div className="dt-settings-icon-bubble dt-settings-icon-bubble--purple"><User size={18} /></div>
                                            )}
                                        </span>
                                    }
                                    title="Username & Emotional Identity"
                                    subtitle={`@${s.usernameDraft || "amber.dolphin3279"}`}
                                    rightContent={<span>@{s.usernameDraft || "amber.dolphin3279"}</span>}
                                >
                                    <label className="dt-settings-field-label">Anonymous handle</label>
                                    <div className="dt-settings-input-row">
                                        <div className="dt-settings-input-wrapper">
                                            <span className="dt-settings-input-prefix">@</span>
                                            <input
                                                type="text"
                                                className="dt-settings-input"
                                                value={s.usernameDraft}
                                                onChange={(e) => s.setUsernameDraft(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <p className="dt-settings-help-text">
                                        3–20 chars · letters, numbers, dots, underscores
                                    </p>

                                    <label className="dt-settings-field-label" style={{ marginTop: "1.25rem" }}>Emotional Identity</label>
                                    <p className="dt-settings-help-text" style={{ marginTop: 0, marginBottom: '1.25rem' }}>
                                        Choose the symbol that feels closest to you today.
                                    </p>

                                    <div className="dt-settings-emotional-grid">
                                        {AVATAR_OPTIONS.map((avatarObj) => {
                                            const isSelected = s.avatarDraft === avatarObj.id;
                                            return (
                                                <button
                                                    key={avatarObj.id}
                                                    type="button"
                                                    className={`dt-settings-emotional-btn${isSelected ? " is-selected" : ""}`}
                                                    onClick={() => s.setAvatarDraft(avatarObj.id)}
                                                    aria-label={`Select avatar ${avatarObj.name}`}
                                                >
                                                    <div className="dt-settings-emotional-img-wrapper">
                                                        <UserAvatar avatarId={avatarObj.id} />
                                                        {isSelected && (
                                                            <div className="dt-settings-emotional-check">
                                                                <Check size={12} strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {s.avatarDraft && (() => {
                                        const sel = AVATAR_OPTIONS.find(a => a.id === s.avatarDraft);
                                        return sel ? (
                                            <div className="dt-settings-emotional-desc-box">
                                                <h5 className="dt-settings-emotional-desc-title">{sel.name}</h5>
                                                <p className="dt-settings-emotional-desc-text">{sel.quote}</p>
                                            </div>
                                        ) : null;
                                    })()}

                                    {s.identityStatus.message && (
                                        <p className={`dt-settings-help-text dt-settings-help-text--${s.identityStatus.status}`}
                                            style={{ marginTop: "0.75rem" }}>
                                            {s.identityStatus.message}
                                        </p>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: "1.25rem" }}>
                                        <button
                                            type="button"
                                            className="dt-settings-save-btn"
                                            disabled={s.savingIdentity}
                                            onClick={() => s.saveIdentity()}
                                            style={{ width: 'auto' }}
                                        >
                                            {s.savingIdentity
                                                ? <><Loader2 size={15} className="dt-settings-save-btn__spin" /> Saving…</>
                                                : <>Save Changes</>
                                            }
                                        </button>
                                        <span className="dt-settings-help-text" style={{ margin: 0, fontSize: '0.75rem' }}>
                                            You can change your Emotional Identity whenever you want.
                                        </span>
                                    </div>
                                </AccordionItem>

                                {/* Accordion 2: Interests & Mood Tags */}
                                <AccordionItem
                                    id="interests"
                                    openId={openAccordion}
                                    onToggle={toggleAccordion}
                                    iconBubble={
                                        <span className="dt-settings-icon-bubble dt-settings-icon-bubble--pink">
                                            <Tag size={18} />
                                        </span>
                                    }
                                    title="Interests & Mood Tags"
                                    subtitle="Personalise the rooms and confessions you see"
                                    rightContent={<span>{s.interests.length > 0 ? `${s.interests.length} tags` : "None"}</span>}
                                >
                                    <p className="dt-settings-mood-hint">
                                        Pick the moods you want in your feed. Tags are private - nobody sees them on your profile.
                                    </p>
                                    <div className="dt-settings-mood-tags">
                                        {PREDEFINED_MOOD_TAGS.map((tag) => {
                                            const key = tag.toLowerCase();
                                            const selected = s.interests.includes(key);
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    className={`dt-settings-mood-pill${selected ? " is-selected" : ""}`}
                                                    onClick={() => selected ? s.removeInterest(key) : s.addInterest(key)}
                                                >
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </AccordionItem>

                                {/* Accordion 3: Email */}
                                <AccordionItem
                                    id="email"
                                    openId={openAccordion}
                                    onToggle={toggleAccordion}
                                    iconBubble={
                                        <span className="dt-settings-icon-bubble dt-settings-icon-bubble--rose">
                                            <Mail size={18} />
                                        </span>
                                    }
                                    title="Email"
                                    subtitle="Your registered email, used only for account recovery"
                                    rightContent={<span>{currentUser?.email || "ayush.khanna@gmail.com"}</span>}
                                >
                                    <div className="dt-settings-email-label-row">
                                        <span className="dt-settings-field-label" style={{ margin: 0 }}>Registered email</span>
                                        <span className="dt-settings-verified-badge">Verified</span>
                                    </div>
                                    <div className="dt-settings-input-wrapper" style={{ marginTop: "0.5rem", maxWidth: "380px" }}>
                                        <input
                                            type="email"
                                            className="dt-settings-input"
                                            value={currentUser?.email || "ayush.khanna@gmail.com"}
                                            readOnly
                                        />
                                    </div>
                                    <p className="dt-settings-help-text" style={{ marginTop: "0.5rem" }}>
                                        Never shown publicly and never linked to your confessions.
                                    </p>
                                </AccordionItem>
                            </div>
                        </section>

                        {/* SECTION 2: CHAT CONTROLS */}
                        <section id="chat-controls">
                            <div className="dt-settings-section-head">
                                <h3 className="dt-settings-section-title">CHAT CONTROLS</h3>
                                <p className="dt-settings-section-desc">Decide who can start a real-time chat with you, and when.</p>
                            </div>

                            <div className="dt-settings-accordion-group">
                                {/* Accordion 4: Chat Request Permissions */}
                                <AccordionItem
                                    id="chat-permissions"
                                    openId={openAccordion}
                                    onToggle={toggleAccordion}
                                    iconBubble={
                                        <span className="dt-settings-icon-bubble dt-settings-icon-bubble--green">
                                            <MessageCircle size={18} />
                                        </span>
                                    }
                                    title="Chat Request Permissions"
                                    subtitle="Who can send you requests"
                                    rightContent={<span>{CHAT_PERMISSION_OPTIONS.find((o) => o.value === s.chatPermission)?.label || "Anyone"}</span>}
                                >
                                    <OptionCardGrid
                                        className="dt-settings-chat-permission-grid"
                                        options={CHAT_PERMISSION_OPTIONS}
                                        selectedValue={s.chatPermission}
                                        onSelect={s.handleChatPermission}
                                    />
                                </AccordionItem>

                                {/* Accordion 5: Limit Night-time Requests (Disabled for future implementation) */}
                                <AccordionItem
                                    id="nighttime"
                                    openId={openAccordion}
                                    onToggle={toggleAccordion}
                                    iconBubble={
                                        <span className="dt-settings-icon-bubble dt-settings-icon-bubble--indigo" style={{ opacity: 0.7 }}>
                                            <Moon size={18} />
                                        </span>
                                    }
                                    badge={
                                        <span style={{
                                            fontSize: "0.68rem",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.04em",
                                            background: "rgba(99, 102, 241, 0.12)",
                                            color: "#6366F1",
                                            padding: "0.15rem 0.5rem",
                                            borderRadius: "999px"
                                        }}>
                                            Coming Soon
                                        </span>
                                    }
                                    title="Limit Night-time Requests"
                                    subtitle="Quiet hours: 11:00 PM – 7:00 AM"
                                    rightContent={<span style={{ color: "#9c829e", fontSize: "0.85rem", fontWeight: 600 }}>Disabled</span>}
                                >
                                    <ToggleSwitchRow
                                        label="Mute requests during quiet hours"
                                        description="This feature is preserved for future implementation and is currently disabled."
                                        checked={false}
                                        disabled={true}
                                    />
                                    <div className="dt-settings-quiet-hours-row is-disabled" style={{ opacity: 0.5 }}>
                                        <div className="dt-settings-quiet-hours-field">
                                            <label className="dt-settings-quiet-hours-label">From</label>
                                            <select
                                                className="dt-settings-select dt-settings-select--time"
                                                value={quietFrom}
                                                disabled={true}
                                            >
                                                {QUIET_HOURS_FROM.map((t) => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="dt-settings-quiet-hours-field">
                                            <label className="dt-settings-quiet-hours-label">Until</label>
                                            <select
                                                className="dt-settings-select dt-settings-select--time"
                                                value={quietUntil}
                                                disabled={true}
                                            >
                                                {QUIET_HOURS_UNTIL.map((t) => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </AccordionItem>
                            </div>
                        </section>

                        {/* SECTION 3: PRIVACY & SAFETY */}
                        <section id="privacy-safety">
                            <div className="dt-settings-section-head">
                                <h3 className="dt-settings-section-title">PRIVACY & SAFETY</h3>
                                <p className="dt-settings-section-desc">How much of your activity other people can trace back to you.</p>
                            </div>

                            <div className="dt-settings-accordion-group">
                                {/* Accordion 6: Hide Joined Rooms */}
                                <AccordionItem
                                    id="hide-rooms"
                                    openId={openAccordion}
                                    onToggle={toggleAccordion}
                                    iconBubble={
                                        <span className="dt-settings-icon-bubble dt-settings-icon-bubble--amber">
                                            <EyeOff size={18} />
                                        </span>
                                    }
                                    title="Hide Joined Rooms"
                                    subtitle="Never show room history on your profile"
                                    rightContent={<span>{s.hideRooms ? "On" : "Off"}</span>}
                                >
                                    <ToggleSwitchRow
                                        label="Hide Room History"
                                        description="Rooms you join will not be listed publicly on your user profile."
                                        checked={s.hideRooms}
                                        onChange={s.handleHideRooms}
                                    />
                                </AccordionItem>

                                {/* Accordion 7: Hide My Profile */}
                                <AccordionItem
                                    id="hide-profile"
                                    openId={openAccordion}
                                    onToggle={toggleAccordion}
                                    iconBubble={
                                        <span className="dt-settings-icon-bubble dt-settings-icon-bubble--purple">
                                            <Lock size={18} />
                                        </span>
                                    }
                                    title="Hide My Profile"
                                    subtitle="Choose how discoverable you are to other users"
                                    rightContent={<span>{s.hideProfileGlobal ? "Hidden" : "Visible"}</span>}
                                >
                                    <ToggleSwitchRow
                                        label="Private Profile"
                                        description="When hidden, your profile cannot be found through global search."
                                        checked={s.hideProfileGlobal}
                                        onChange={s.handleHideProfileGlobal}
                                    />
                                </AccordionItem>

                                {/* Accordion 8: Played Audio Expiry */}
                                <AccordionItem
                                    id="audio-expiry"
                                    openId={openAccordion}
                                    onToggle={toggleAccordion}
                                    iconBubble={
                                        <span className="dt-settings-icon-bubble dt-settings-icon-bubble--rose">
                                            <Clock size={18} />
                                        </span>
                                    }
                                    title="Played Audio Expiry"
                                    subtitle="When your audio confessions disappear"
                                    rightContent={<span>{AUDIO_EXPIRY_CARD_OPTIONS.find((o) => o.value === s.audioExpiry)?.label || "Never"}</span>}
                                >
                                    <OptionCardGrid
                                        className="dt-settings-audio-expiry-grid"
                                        options={AUDIO_EXPIRY_CARD_OPTIONS}
                                        selectedValue={s.audioExpiry}
                                        onSelect={s.handleAudioExpiry}
                                    />
                                </AccordionItem>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </DesktopAppShell>
    );
}
