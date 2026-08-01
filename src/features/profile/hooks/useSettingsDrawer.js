import { useState, useCallback, useRef } from "react";
import { updateCurrentUserPreferences } from "../../../services/auth.service";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const AVATAR_OPTIONS = ['🌙', '⭐', '🌸', '🦋', '🌊', '🔮', '💫', '🌺', '🎭', '🌿', '🦅', '🐺'];

export const CHAT_PERMISSION_OPTIONS = [
    { value: 'everyone', label: 'Everyone' },
    { value: 'nobody',   label: 'Nobody' },
];

export const AUDIO_EXPIRY_OPTIONS = [
    { value: 'never', label: 'Never' },
    { value: '24h',   label: 'After 24 hours' },
    { value: '7d',    label: 'After 7 days' },
    { value: '30d',   label: 'After 30 days' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: extract initial preferences from user object
// ─────────────────────────────────────────────────────────────────────────────

function extractPrefs(user) {
    const p = (user && user.preferences) || {};
    return {
        avatar:                   p.avatar                   || '🌊',
        chatRequestPermission:    p.chatRequestPermission    || 'everyone',
        limitNighttimeRequests:   !!p.limitNighttimeRequests,
        hideJoinedRooms:          !!p.hideJoinedRooms,
        audioExpiry:              p.audioExpiry              || 'never',
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useSettingsDrawer
 *
 * Manages all settings drawer state and API persistence.
 *
 * @param {object}   user          - Current user object from ProfilePage
 * @param {function} onUserUpdated - Callback to propagate updated user upward
 */
export default function useSettingsDrawer(user, onUserUpdated) {
    // ── Identity ──────────────────────────────────────────────────────────────
    const [usernameDraft, setUsernameDraft]   = useState(user?.username || '');
    const [avatarDraft,   setAvatarDraft]     = useState(extractPrefs(user).avatar);
    const [identityStatus, setIdentityStatus] = useState({ status: 'idle', message: '' });
    const [savingIdentity, setSavingIdentity] = useState(false);

    // ── Interests / Mood tags ─────────────────────────────────────────────────
    const [interests,     setInterests]       = useState(Array.isArray(user?.interests) ? user.interests : []);
    const [interestInput, setInterestInput]   = useState('');
    const [savingInterests, setSavingInterests] = useState(false);

    // ── Chat controls ─────────────────────────────────────────────────────────
    const prefs = extractPrefs(user);
    const [chatPermission,   setChatPermission]   = useState(prefs.chatRequestPermission);
    const [nighttimeLimit,   setNighttimeLimit]   = useState(prefs.limitNighttimeRequests);

    // ── Privacy & Safety ──────────────────────────────────────────────────────
    const [hideRooms,   setHideRooms]   = useState(prefs.hideJoinedRooms);
    const [audioExpiry, setAudioExpiry] = useState(prefs.audioExpiry);

    // ── Misc notice ──────────────────────────────────────────────────────────
    const [notice, setNotice]   = useState('');
    const noticeTimer           = useRef(null);

    function showNotice(msg) {
        setNotice(msg);
        if (noticeTimer.current) clearTimeout(noticeTimer.current);
        noticeTimer.current = setTimeout(() => setNotice(''), 2800);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Save helpers
    // ─────────────────────────────────────────────────────────────────────────

    async function callPrefsAPI(payload) {
        const result = await updateCurrentUserPreferences(payload);
        const updatedUser = result?.user ?? null;
        if (updatedUser && typeof onUserUpdated === 'function') {
            onUserUpdated(updatedUser);
        }
        return updatedUser;
    }

    // Identity: username + avatar — explicit Save button
    const saveIdentity = useCallback(async (e) => {
        e?.preventDefault();
        const cleaned = String(usernameDraft || '').trim().toLowerCase();
        if (!cleaned) {
            setIdentityStatus({ status: 'error', message: 'Username cannot be empty.' });
            return;
        }
        try {
            setSavingIdentity(true);
            setIdentityStatus({ status: 'checking', message: 'Saving…' });
            await callPrefsAPI({ username: cleaned, avatar: avatarDraft });
            setIdentityStatus({ status: 'success', message: 'Saved!' });
            showNotice('Identity updated.');
            window.dispatchEvent(new Event('auth-changed'));
        } catch (err) {
            setIdentityStatus({ status: 'error', message: err?.message || 'Could not save identity.' });
        } finally {
            setSavingIdentity(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usernameDraft, avatarDraft]);

    // Interests: explicit Save button
    const saveInterests = useCallback(async () => {
        try {
            setSavingInterests(true);
            await callPrefsAPI({ interests });
            showNotice('Interests saved.');
        } catch (err) {
            showNotice(err?.message || 'Could not save interests.');
        } finally {
            setSavingInterests(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interests]);

    function addInterest(tag) {
        const cleaned = String(tag || '').trim().toLowerCase();
        if (!cleaned || interests.includes(cleaned) || interests.length >= 15) return;
        setInterests((prev) => [...prev, cleaned]);
    }

    function removeInterest(tag) {
        setInterests((prev) => prev.filter((t) => t !== tag));
    }

    // Immediate-save toggles / selects
    async function handleChatPermission(value) {
        setChatPermission(value);
        try {
            await callPrefsAPI({ chatRequestPermission: value });
        } catch {
            setChatPermission((prev) => prev); // revert optimistically if needed
            showNotice('Could not save chat permission.');
        }
    }

    async function handleNighttimeLimit(value) {
        setNighttimeLimit(value);
        try {
            await callPrefsAPI({ limitNighttimeRequests: value });
        } catch {
            setNighttimeLimit((prev) => !prev);
            showNotice('Could not save night-time setting.');
        }
    }

    async function handleHideRooms(value) {
        setHideRooms(value);
        try {
            await callPrefsAPI({ hideJoinedRooms: value });
        } catch {
            setHideRooms((prev) => !prev);
            showNotice('Could not save rooms visibility.');
        }
    }

    async function handleAudioExpiry(value) {
        setAudioExpiry(value);
        try {
            await callPrefsAPI({ audioExpiry: value });
            showNotice('Audio expiry updated.');
        } catch {
            showNotice('Could not save audio expiry.');
        }
    }

    return {
        // Identity
        usernameDraft, setUsernameDraft,
        avatarDraft,   setAvatarDraft,
        identityStatus, setIdentityStatus,
        savingIdentity,
        saveIdentity,

        // Interests
        interests, setInterests,
        interestInput, setInterestInput,
        addInterest, removeInterest,
        savingInterests, saveInterests,

        // Chat Controls
        chatPermission,   handleChatPermission,
        nighttimeLimit,   handleNighttimeLimit,

        // Privacy & Safety
        hideRooms,    handleHideRooms,
        audioExpiry,  handleAudioExpiry,

        // Notice
        notice,
    };
}
