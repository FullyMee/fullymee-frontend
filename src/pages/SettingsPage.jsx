import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    User, MessageCircle, Lock, Tag, Mail, Moon, EyeOff, Clock,
    CheckCircle2, ChevronDown, ChevronUp, LogOut, Check, Loader2
} from "lucide-react";
import DesktopAppShell from "../components/layout/DesktopAppShell.jsx";
import useAuth from "../hooks/useAuth.js";
import useSettingsDrawer, {
    AVATAR_OPTIONS,
    CHAT_PERMISSION_OPTIONS,
    AUDIO_EXPIRY_OPTIONS
} from "../features/profile/hooks/useSettingsDrawer.js";
import { logout } from "../services/auth.service.js";
import "../features/profile/settings-desktop.css";

const PREDEFINED_MOOD_TAGS = [
    "Late-night thoughts", "Heartbreak", "Career", "Anxiety",
    "Confidence", "Study stress", "Friendship", "Family",
    "Music", "Loneliness", "Self-doubt", "First love"
];

const QUIET_HOURS_FROM = [
    "9:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"
];
const QUIET_HOURS_UNTIL = [
    "5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM"
];



const AUDIO_EXPIRY_CARD_OPTIONS = [
    { value: "never", label: "Never", desc: "Audio confessions stay available." },
    { value: "once", label: "After playing once", desc: "Vanishes the moment it is heard." },
    { value: "24h", label: "After 24 hours", desc: "Disappears a day after posting." },
    { value: "7d", label: "After 7 days", desc: "Disappears a week after posting." }
];

const CHAT_PERMISSION_CARD_OPTIONS = [
    { value: "everyone", label: "Everyone", desc: "Anyone on FullyMe can send you a chat request." },
    { value: "rooms", label: "People in my rooms", desc: "Only members of rooms you have joined can reach you." },
    { value: "nobody", label: "No one", desc: "Requests are turned off. You can still start chats yourself." }
];

export default function SettingsPage({ user: propUser }) {
    const navigate = useNavigate();
    const { user: authUser, setUser } = useAuth();
    const currentUser = propUser || authUser;

    const s = useSettingsDrawer(currentUser, (updated) => {
        if (typeof setUser === "function") setUser(updated);
    });

    // Single Accordion Expansion State — Default open: "username-avatar"
    const [openAccordion, setOpenAccordion] = useState("username-avatar");
    const [activeTab, setActiveTab] = useState("identity");
    const [quietFrom, setQuietFrom] = useState("11:00 PM");
    const [quietUntil, setQuietUntil] = useState("7:00 AM");

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

    return (
        <DesktopAppShell hideStageHeader={true}>
            <div className="dt-settings-container">
                {/* Header */}
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
                    {/* Left Column */}
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

                        {/* Dark Purple Callout Card */}
                        <div className="dt-settings-anon-card">
                            <div className="dt-settings-anon-icon">
                                <Lock size={16} />
                            </div>
                            <h2 className="dt-settings-anon-title">Anonymous by design</h2>
                            <p className="dt-settings-anon-desc">
                                Your email is never shown to anyone. Only your generated handle travels with your confessions and chats.
                            </p>
                        </div>

                        {/* Logout Button */}
                        <button
                            type="button"
                            className="dt-settings-logout-btn"
                            onClick={handleLogout}
                        >
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </aside>

                    {/* Right Main Content Column */}
                    <main className="dt-settings-right">
                        {/* SECTION 1: IDENTITY */}
                        <section id="identity">
                            <div className="dt-settings-section-head">
                                <h3 className="dt-settings-section-title">IDENTITY</h3>
                                <p className="dt-settings-section-desc">The handle and details attached to everything you post.</p>
                            </div>

                            <div className="dt-settings-accordion-group">
                                {/* Accordion 1: Username & Avatar */}
                                <div className={`dt-settings-accordion-item${openAccordion === "username-avatar" ? " is-expanded" : ""}`}>
                                    <button
                                        type="button"
                                        className="dt-settings-accordion-header"
                                        onClick={() => toggleAccordion("username-avatar")}
                                    >
                                        <div className="dt-settings-accordion-left">
                                            <span className="dt-settings-icon-bubble dt-settings-icon-bubble--purple" style={{ overflow: 'hidden' }}>
                                                {s.avatarDraft ? (
                                                    <span style={{ fontSize: '18px', lineHeight: 1 }}>{s.avatarDraft}</span>
                                                ) : (
                                                    <User size={18} />
                                                )}
                                            </span>
                                            <div>
                                                <h4 className="dt-settings-accordion-title">Username & Avatar</h4>
                                                <p className="dt-settings-accordion-subtitle">@{s.usernameDraft || "amber.dolphin3279"}</p>
                                            </div>
                                        </div>
                                        <div className="dt-settings-accordion-right">
                                            <span>@{s.usernameDraft || "amber.dolphin3279"}</span>
                                            {openAccordion === "username-avatar" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </button>

                                    {openAccordion === "username-avatar" && (
                                        <div className="dt-settings-accordion-body">
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
                                                Choose a unique handle. Past confessions keep the old one.
                                            </p>

                                            <label className="dt-settings-field-label" style={{ marginTop: "1.25rem" }}>Avatar</label>
                                            <div className="dt-settings-avatar-grid">
                                                {AVATAR_OPTIONS.map((emoji) => {
                                                    const isSelected = s.avatarDraft === emoji;
                                                    return (
                                                        <button
                                                            key={emoji}
                                                            type="button"
                                                            className={`dt-settings-avatar-btn${isSelected ? " is-selected" : ""}`}
                                                            onClick={() => s.setAvatarDraft(emoji)}
                                                            aria-label={`Select avatar ${emoji}`}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {s.identityStatus.message && (
                                                <p className={`dt-settings-help-text dt-settings-help-text--${s.identityStatus.status}`}
                                                   style={{ marginTop: "0.75rem" }}>
                                                    {s.identityStatus.message}
                                                </p>
                                            )}

                                            <button
                                                type="button"
                                                className="dt-settings-save-btn"
                                                disabled={s.savingIdentity}
                                                onClick={() => s.saveIdentity()}
                                                style={{ marginTop: "1.25rem" }}
                                            >
                                                {s.savingIdentity
                                                    ? <><Loader2 size={15} className="dt-settings-save-btn__spin" /> Saving…</>
                                                    : <><Check size={15} /> Save Changes</>
                                                }
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Accordion 2: Interests & Mood Tags */}
                                <div className={`dt-settings-accordion-item${openAccordion === "interests" ? " is-expanded" : ""}`}>
                                    <button
                                        type="button"
                                        className="dt-settings-accordion-header"
                                        onClick={() => toggleAccordion("interests")}
                                    >
                                        <div className="dt-settings-accordion-left">
                                            <span className="dt-settings-icon-bubble dt-settings-icon-bubble--pink">
                                                <Tag size={18} />
                                            </span>
                                            <div>
                                                <h4 className="dt-settings-accordion-title">Interests & Mood Tags</h4>
                                                <p className="dt-settings-accordion-subtitle">Personalise the rooms and confessions you see</p>
                                            </div>
                                        </div>
                                        <div className="dt-settings-accordion-right">
                                            <span>{s.interests.length > 0 ? `${s.interests.length} tags` : "None"}</span>
                                            {openAccordion === "interests" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </button>

                                    {openAccordion === "interests" && (
                                        <div className="dt-settings-accordion-body">
                                            <p className="dt-settings-mood-hint">
                                                Pick the moods you want in your feed. Tags are private — nobody sees them on your profile.
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
                                        </div>
                                    )}
                                </div>

                                {/* Accordion 3: Email */}
                                <div className={`dt-settings-accordion-item${openAccordion === "email" ? " is-expanded" : ""}`}>
                                    <button
                                        type="button"
                                        className="dt-settings-accordion-header"
                                        onClick={() => toggleAccordion("email")}
                                    >
                                        <div className="dt-settings-accordion-left">
                                            <span className="dt-settings-icon-bubble dt-settings-icon-bubble--rose">
                                                <Mail size={18} />
                                            </span>
                                            <div>
                                                <h4 className="dt-settings-accordion-title">Email</h4>
                                                <p className="dt-settings-accordion-subtitle">Your registered email, used only for account recovery</p>
                                            </div>
                                        </div>
                                        <div className="dt-settings-accordion-right">
                                            <span>{currentUser?.email || "ayush.khanna@gmail.com"}</span>
                                            {openAccordion === "email" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </button>

                                    {openAccordion === "email" && (
                                        <div className="dt-settings-accordion-body">
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
                                        </div>
                                    )}
                                </div>
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
                                <div className={`dt-settings-accordion-item${openAccordion === "chat-permissions" ? " is-expanded" : ""}`}>
                                    <button
                                        type="button"
                                        className="dt-settings-accordion-header"
                                        onClick={() => toggleAccordion("chat-permissions")}
                                    >
                                        <div className="dt-settings-accordion-left">
                                            <span className="dt-settings-icon-bubble dt-settings-icon-bubble--green">
                                                <MessageCircle size={18} />
                                            </span>
                                            <div>
                                                <h4 className="dt-settings-accordion-title">Chat Request Permissions</h4>
                                                <p className="dt-settings-accordion-subtitle">Who can send you requests</p>
                                            </div>
                                        </div>
                                        <div className="dt-settings-accordion-right">
                                            <span>{CHAT_PERMISSION_CARD_OPTIONS.find((o) => o.value === s.chatPermission)?.label || "Everyone"}</span>
                                            {openAccordion === "chat-permissions" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </button>

                                    {openAccordion === "chat-permissions" && (
                                        <div className="dt-settings-accordion-body">
                                            <div className="dt-settings-card-grid-3">
                                                {CHAT_PERMISSION_CARD_OPTIONS.map((opt) => {
                                                    const selected = s.chatPermission === opt.value;
                                                    return (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            className={`dt-settings-audio-card${selected ? " is-selected" : ""}`}
                                                            onClick={() => s.handleChatPermission(opt.value)}
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
                                        </div>
                                    )}
                                </div>

                                {/* Accordion 5: Limit Night-time Requests */}
                                <div className={`dt-settings-accordion-item${openAccordion === "nighttime" ? " is-expanded" : ""}`}>
                                    <button
                                        type="button"
                                        className="dt-settings-accordion-header"
                                        onClick={() => toggleAccordion("nighttime")}
                                    >
                                        <div className="dt-settings-accordion-left">
                                            <span className="dt-settings-icon-bubble dt-settings-icon-bubble--indigo">
                                                <Moon size={18} />
                                            </span>
                                            <div>
                                                <h4 className="dt-settings-accordion-title">Limit Night-time Requests</h4>
                                                <p className="dt-settings-accordion-subtitle">Quiet hours: 11:00 PM – 7:00 AM</p>
                                            </div>
                                        </div>
                                        <div className="dt-settings-accordion-right">
                                            <span>{s.nighttimeLimit ? `${quietFrom} – ${quietUntil}` : "Off"}</span>
                                            {openAccordion === "nighttime" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </button>

                                    {openAccordion === "nighttime" && (
                                        <div className="dt-settings-accordion-body">
                                            <div className="dt-settings-switch-row dt-settings-switch-row--card">
                                                <div>
                                                    <span className="dt-settings-field-label" style={{ margin: 0 }}>Mute requests during quiet hours</span>
                                                    <p className="dt-settings-help-text" style={{ margin: 0 }}>
                                                        Requests still arrive, they just stay silent until morning.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={s.nighttimeLimit}
                                                    className={`dt-settings-toggle${s.nighttimeLimit ? " dt-settings-toggle--on" : ""}`}
                                                    onClick={() => s.handleNighttimeLimit(!s.nighttimeLimit)}
                                                >
                                                    <span className="dt-settings-toggle__thumb" />
                                                </button>
                                            </div>
                                            <div className={`dt-settings-quiet-hours-row${!s.nighttimeLimit ? " is-disabled" : ""}`}>
                                                <div className="dt-settings-quiet-hours-field">
                                                    <label className="dt-settings-quiet-hours-label">From</label>
                                                    <select
                                                        className="dt-settings-select dt-settings-select--time"
                                                        value={quietFrom}
                                                        disabled={!s.nighttimeLimit}
                                                        onChange={(e) => setQuietFrom(e.target.value)}
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
                                                        disabled={!s.nighttimeLimit}
                                                        onChange={(e) => setQuietUntil(e.target.value)}
                                                    >
                                                        {QUIET_HOURS_UNTIL.map((t) => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                                <div className={`dt-settings-accordion-item${openAccordion === "hide-rooms" ? " is-expanded" : ""}`}>
                                    <button
                                        type="button"
                                        className="dt-settings-accordion-header"
                                        onClick={() => toggleAccordion("hide-rooms")}
                                    >
                                        <div className="dt-settings-accordion-left">
                                            <span className="dt-settings-icon-bubble dt-settings-icon-bubble--amber">
                                                <EyeOff size={18} />
                                            </span>
                                            <div>
                                                <h4 className="dt-settings-accordion-title">Hide Joined Rooms</h4>
                                                <p className="dt-settings-accordion-subtitle">Never show room history on your profile</p>
                                            </div>
                                        </div>
                                        <div className="dt-settings-accordion-right">
                                            <span>{s.hideRooms ? "On" : "Off"}</span>
                                            {openAccordion === "hide-rooms" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </button>

                                    {openAccordion === "hide-rooms" && (
                                        <div className="dt-settings-accordion-body">
                                            <div className="dt-settings-switch-row">
                                                <div>
                                                    <span className="dt-settings-field-label" style={{ margin: 0 }}>Hide Room History</span>
                                                    <p className="dt-settings-help-text" style={{ margin: 0 }}>
                                                        Rooms you join will not be listed publicly on your user profile.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={s.hideRooms}
                                                    className={`dt-settings-toggle${s.hideRooms ? " dt-settings-toggle--on" : ""}`}
                                                    onClick={() => s.handleHideRooms(!s.hideRooms)}
                                                >
                                                    <span className="dt-settings-toggle__thumb" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Accordion 7: Hide My Profile */}
                                <div className={`dt-settings-accordion-item${openAccordion === "hide-profile" ? " is-expanded" : ""}`}>
                                    <button
                                        type="button"
                                        className="dt-settings-accordion-header"
                                        onClick={() => toggleAccordion("hide-profile")}
                                    >
                                        <div className="dt-settings-accordion-left">
                                            <span className="dt-settings-icon-bubble dt-settings-icon-bubble--purple">
                                                <Lock size={18} />
                                            </span>
                                            <div>
                                                <h4 className="dt-settings-accordion-title">Hide My Profile</h4>
                                                <p className="dt-settings-accordion-subtitle">Choose how discoverable you are to other users</p>
                                            </div>
                                        </div>
                                        <div className="dt-settings-accordion-right">
                                            <span>{s.hideProfileGlobal ? "Hidden" : "Visible"}</span>
                                            {openAccordion === "hide-profile" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </button>

                                    {openAccordion === "hide-profile" && (
                                        <div className="dt-settings-accordion-body">
                                            <div className="dt-settings-switch-row">
                                                <div>
                                                    <span className="dt-settings-field-label" style={{ margin: 0 }}>Private Profile</span>
                                                    <p className="dt-settings-help-text" style={{ margin: 0 }}>
                                                        When hidden, your profile cannot be found through global search.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={s.hideProfileGlobal}
                                                    className={`dt-settings-toggle${s.hideProfileGlobal ? " dt-settings-toggle--on" : ""}`}
                                                    onClick={() => s.handleHideProfileGlobal(!s.hideProfileGlobal)}
                                                >
                                                    <span className="dt-settings-toggle__thumb" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Accordion 8: Played Audio Expiry */}
                                <div className={`dt-settings-accordion-item${openAccordion === "audio-expiry" ? " is-expanded" : ""}`}>
                                    <button
                                        type="button"
                                        className="dt-settings-accordion-header"
                                        onClick={() => toggleAccordion("audio-expiry")}
                                    >
                                        <div className="dt-settings-accordion-left">
                                            <span className="dt-settings-icon-bubble dt-settings-icon-bubble--rose">
                                                <Clock size={18} />
                                            </span>
                                            <div>
                                                <h4 className="dt-settings-accordion-title">Played Audio Expiry</h4>
                                                <p className="dt-settings-accordion-subtitle">When your audio confessions disappear</p>
                                            </div>
                                        </div>
                                        <div className="dt-settings-accordion-right">
                                            <span>{AUDIO_EXPIRY_CARD_OPTIONS.find((o) => o.value === s.audioExpiry)?.label || "Never"}</span>
                                            {openAccordion === "audio-expiry" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </button>

                                    {openAccordion === "audio-expiry" && (
                                        <div className="dt-settings-accordion-body">
                                            <div className="dt-settings-audio-expiry-grid">
                                                {AUDIO_EXPIRY_CARD_OPTIONS.map((opt) => {
                                                    const selected = s.audioExpiry === opt.value;
                                                    return (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            className={`dt-settings-audio-card${selected ? " is-selected" : ""}`}
                                                            onClick={() => s.handleAudioExpiry(opt.value)}
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
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </DesktopAppShell>
    );
}
