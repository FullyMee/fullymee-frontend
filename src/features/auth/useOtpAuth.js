import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as authService from "../../services/auth.service";
import { useGlobalError } from "../../context/ErrorContext";
import { disconnectSocket } from "../../services/socket";
import useTimedNotice from "../../hooks/useTimedNotice";
import { USERNAME_REGEX, EMAIL_REGEX, normalizeEmail, normalizeUsername, buildUsernameCandidate } from "./utils/authHelpers.js";

const OTP_STORAGE_KEY = "anonymous.auth.pendingOtpSession";
const OTP_TTL_MS = 15 * 60 * 1000;

export function savePendingOtpSession(data) {
    try {
        const payload = JSON.stringify({ ...data, timestamp: Date.now() });
        sessionStorage.setItem(OTP_STORAGE_KEY, payload);
        localStorage.setItem(OTP_STORAGE_KEY, payload);
        localStorage.setItem("fm_onboarding_completed", "1");
    } catch { /* ignore */ }
}

export function getPendingOtpSession() {
    try {
        const raw = sessionStorage.getItem(OTP_STORAGE_KEY) || localStorage.getItem(OTP_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.email || !parsed?.timestamp) return null;
        if (Date.now() - parsed.timestamp > OTP_TTL_MS) { clearPendingOtpSession(); return null; }
        return parsed;
    } catch { return null; }
}

export function clearPendingOtpSession() {
    try {
        sessionStorage.removeItem(OTP_STORAGE_KEY);
        localStorage.removeItem(OTP_STORAGE_KEY);
    } catch { /* ignore */ }
}

export default function useOtpAuth(initialMode = "signin") {
    const navigate = useNavigate();
    const { showError, dismissError } = useGlobalError();
    const savedSession = getPendingOtpSession();

    const [mode, setModeState] = useState(() => savedSession?.mode || (initialMode === "signup" ? "signup" : "signin"));
    const [step, setStep] = useState(() => savedSession?.step || "email");
    const [email, setEmail] = useState(() => savedSession?.email || "");
    const [otp, setOtp] = useState("");
    const [username, setUsername] = useState(() => savedSession?.username || "");
    const [requiresUsername, setRequiresUsername] = useState(() =>
        typeof savedSession?.requiresUsername === "boolean" ? savedSession.requiresUsername : initialMode === "signup"
    );
    const [usernameStatus, setUsernameStatus] = useState({ status: "idle", message: "" });
    const [usernameRefreshing, setUsernameRefreshing] = useState(false);
    const [notice, setNotice, clearNotice] = useTimedNotice(
        savedSession?.step === "otp" ? `Enter the 6-digit code sent to ${savedSession.email}.` : "",
        3200
    );
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ email: "", otp: "", username: "" });
    const autoSuggestedRef = useRef(false);
    const usernameRequestRef = useRef(0);

    const needsUsername = step === "otp" ? requiresUsername : mode === "signup";

    // Username availability check + auto-suggest
    useEffect(() => {
        if (!needsUsername) {
            setUsernameStatus({ status: "idle", message: "" });
            autoSuggestedRef.current = false;
            return;
        }

        // Auto-suggest if no username yet
        if (!username && !autoSuggestedRef.current) {
            autoSuggestedRef.current = true;
            void handleRefreshUsername();
            return;
        }

        const normalized = normalizeUsername(username);
        if (!normalized) {
            setUsernameStatus({ status: "idle", message: "Choose a username or refresh to get a new one." });
            return;
        }
        if (!USERNAME_REGEX.test(normalized)) {
            setUsernameStatus({ status: "invalid", message: "Use 3-20 characters: a-z, 0-9, dot or underscore." });
            return;
        }

        setUsernameStatus({ status: "checking", message: "Checking username availability..." });
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const result = await authService.checkUsername(normalized);
                if (cancelled) return;
                if (result?.available) {
                    setUsernameStatus({ status: "available", message: `@${result.username} is available` });
                } else {
                    setUsernameStatus({ status: "taken", message: result?.reason || "Username is not available" });
                }
            } catch {
                if (!cancelled) setUsernameStatus({ status: "idle", message: "Could not verify username right now. You can still continue." });
            }
        }, 320);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [needsUsername, username]);

    function clearFeedback() {
        clearNotice();
        setFieldErrors({ email: "", otp: "", username: "" });
        dismissError();
    }

    function setMode(nextMode) {
        clearPendingOtpSession();
        const safeMode = nextMode === "signup" ? "signup" : "signin";
        setModeState(safeMode);
        setStep("email");
        setOtp("");
        clearNotice();
        setFieldErrors({ email: "", otp: "", username: "" });
        dismissError();
        setRequiresUsername(safeMode === "signup");
        autoSuggestedRef.current = false;
    }

    async function ensureUsernameIsUsable() {
        const normalized = normalizeUsername(username);
        if (!normalized) { const e = new Error("Choose a username"); e.field = "username"; throw e; }
        if (!USERNAME_REGEX.test(normalized)) { const e = new Error("Username must be 3-20 chars (a-z, 0-9, . and _)"); e.field = "username"; throw e; }

        const result = await authService.checkUsername(normalized);
        if (!result?.available) { const e = new Error(result?.reason || "Username is not available"); e.field = "username"; throw e; }

        setUsername(result.username);
        setUsernameStatus({ status: "available", message: `@${result.username} is available` });
        return result.username;
    }

    async function handleRefreshUsername() {
        if (!needsUsername) return;
        const requestId = ++usernameRequestRef.current;
        setUsernameRefreshing(true);
        setFieldErrors((p) => ({ ...p, username: "" }));
        dismissError();
        setUsernameStatus({ status: "checking", message: "Finding an available username..." });

        try {
            for (let i = 0; i < 18; i++) {
                const candidate = buildUsernameCandidate();
                const result = await authService.checkUsername(candidate);
                if (usernameRequestRef.current !== requestId) return;
                if (result?.available) {
                    setUsername(result.username);
                    setUsernameStatus({ status: "available", message: `@${result.username} is available` });
                    return;
                }
            }
            throw new Error("Could not find an available username right now");
        } catch (err) {
            if (usernameRequestRef.current === requestId) {
                setUsernameStatus({ status: "invalid", message: err?.message || "Could not generate a username right now" });
            }
        } finally {
            if (usernameRequestRef.current === requestId) setUsernameRefreshing(false);
        }
    }

    async function requestOtp({ validateUsername = false, isResend = false } = {}) {
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) { setFieldErrors((p) => ({ ...p, email: "Enter your email address" })); return; }
        if (!EMAIL_REGEX.test(normalizedEmail)) { setFieldErrors((p) => ({ ...p, email: "Enter a valid email address" })); return; }

        try {
            setLoading(true);
            clearNotice();
            setFieldErrors({ email: "", otp: "", username: "" });
            dismissError();

            if (validateUsername) await ensureUsernameIsUsable();

            const response = await authService.requestOTP(normalizedEmail, mode);
            const nextRequiresUsername = !!(response?.requiresUsername);

            setEmail(normalizedEmail);
            setModeState(nextRequiresUsername ? "signup" : "signin");
            setRequiresUsername(nextRequiresUsername);
            setStep("otp");
            setOtp("");
            setNotice(isResend ? `A fresh code was sent to ${normalizedEmail}.` : `We sent a 6-digit code to ${normalizedEmail}.`);

            savePendingOtpSession({
                email: normalizedEmail,
                mode: nextRequiresUsername ? "signup" : "signin",
                requiresUsername: nextRequiresUsername,
                username,
                step: "otp"
            });

            if (!nextRequiresUsername) setUsernameStatus({ status: "idle", message: "" });
            else if (mode !== "signup" && !normalizeUsername(username)) autoSuggestedRef.current = false;
        } catch (err) {
            if (err?.field === "username") { setFieldErrors((p) => ({ ...p, username: err.message || "Choose a valid username" })); return; }
            showError(err?.message || "Unable to send OTP right now.");
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyOTP() {
        if (!otp.trim()) { setFieldErrors((p) => ({ ...p, otp: "Enter the OTP" })); return; }

        try {
            setLoading(true);
            setFieldErrors({ email: "", otp: "", username: "" });
            dismissError();

            let normalizedUsername = "";
            if (requiresUsername) normalizedUsername = await ensureUsernameIsUsable();

            const res = await authService.verifyOTP(normalizeEmail(email), otp.trim(), normalizedUsername);
            if (!res.user || !(res.user.id || res.user.userId)) throw new Error("Invalid response from server");

            clearPendingOtpSession();
            disconnectSocket();
            window.dispatchEvent(new Event("auth-changed"));
            navigate("/", { replace: true });
        } catch (err) {
            if (err?.field === "username") { setFieldErrors((p) => ({ ...p, username: err.message || "Choose a valid username" })); return; }
            const message = err?.message || "Unable to verify OTP right now.";
            if (/otp|code/i.test(message)) { setFieldErrors((p) => ({ ...p, otp: message })); return; }
            showError(message);
        } finally {
            setLoading(false);
        }
    }

    return {
        mode,
        setMode,
        step,
        email,
        setEmail: (v) => { clearFeedback(); setEmail(v); },
        otp,
        setOtp: (v) => { clearFeedback(); setOtp(v); },
        username,
        setUsername: (v) => { clearFeedback(); setUsername(v); },
        needsUsername,
        usernameStatus,
        usernameRefreshing,
        notice,
        loading,
        fieldErrors,
        handleRequestOTP: () => requestOtp({ validateUsername: mode === "signup" }),
        handleResendOTP: () => requestOtp({ isResend: true }),
        handleRefreshUsername,
        handleVerifyOTP
    };
}
