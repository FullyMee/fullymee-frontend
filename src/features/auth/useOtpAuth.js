import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as authService from "../../services/auth.service";
import { useGlobalError } from "../../context/ErrorContext";
import { disconnectSocket } from "../../services/socket";
import useTimedNotice from "../../hooks/useTimedNotice";

import {
    USERNAME_REGEX,
    EMAIL_REGEX,
    normalizeEmail,
    normalizeUsername,
    buildUsernameCandidate
} from "./utils/authHelpers.js";

const PENDING_OTP_STORAGE_KEY = "anonymous.auth.pendingOtpSession";
const OTP_SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function savePendingOtpSession(data) {
    try {
        const payload = JSON.stringify({
            ...data,
            timestamp: Date.now()
        });
        sessionStorage.setItem(PENDING_OTP_STORAGE_KEY, payload);
        localStorage.setItem(PENDING_OTP_STORAGE_KEY, payload);
        localStorage.setItem("fm_onboarding_completed", "1");
    } catch {
        // ignore storage errors
    }
}

export function getPendingOtpSession() {
    try {
        const raw = sessionStorage.getItem(PENDING_OTP_STORAGE_KEY) || localStorage.getItem(PENDING_OTP_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.email || !parsed.timestamp) return null;
        if (Date.now() - parsed.timestamp > OTP_SESSION_TTL_MS) {
            clearPendingOtpSession();
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function clearPendingOtpSession() {
    try {
        sessionStorage.removeItem(PENDING_OTP_STORAGE_KEY);
        localStorage.removeItem(PENDING_OTP_STORAGE_KEY);
    } catch {
        // ignore
    }
}

export default function useOtpAuth(initialMode = "signin") {
    const navigate = useNavigate();
    const { showError, dismissError } = useGlobalError();
    
    // Check if there is an active OTP session from before closing/switching app
    const savedSession = getPendingOtpSession();

    const [mode, setModeState] = useState(() => {
        if (savedSession && savedSession.mode) return savedSession.mode;
        return initialMode === "signup" ? "signup" : "signin";
    });
    const [step, setStep] = useState(() => {
        if (savedSession && savedSession.step) return savedSession.step;
        return "email";
    });
    const [email, setEmail] = useState(() => {
        if (savedSession && savedSession.email) return savedSession.email;
        return "";
    });
    const [otp, setOtp] = useState("");
    const [username, setUsername] = useState(() => {
        if (savedSession && savedSession.username) return savedSession.username;
        return "";
    });
    const [requiresUsername, setRequiresUsername] = useState(() => {
        if (savedSession && typeof savedSession.requiresUsername === "boolean") return savedSession.requiresUsername;
        return initialMode === "signup";
    });
    const [usernameStatus, setUsernameStatus] = useState({ status: "idle", message: "" });
    const [usernameRefreshing, setUsernameRefreshing] = useState(false);
    const [notice, setNotice, clearNotice] = useTimedNotice(
        savedSession && savedSession.step === "otp"
            ? `Enter the 6-digit code sent to ${savedSession.email}.`
            : "",
        3200
    );
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ email: "", otp: "", username: "" });
    const autoSuggestedRef = useRef(false);
    const usernameRequestRef = useRef(0);
    const initialMountRef = useRef(true);

    const needsUsername = step === "otp" ? requiresUsername : mode === "signup";

    const lastInitialModeRef = useRef(initialMode);
    useEffect(() => {
        // If initialMode prop changes while in email step, sync the default mode
        if (lastInitialModeRef.current !== initialMode) {
            lastInitialModeRef.current = initialMode;
            setStep((currentStep) => {
                if (currentStep === "otp") return currentStep;
                const safeMode = initialMode === "signup" ? "signup" : "signin";
                setModeState(safeMode);
                setRequiresUsername(safeMode === "signup");
                return "email";
            });
        }
    }, [initialMode]);

    useEffect(() => {
        if (!needsUsername) {
            setUsernameStatus({ status: "idle", message: "" });
            autoSuggestedRef.current = false;
            return;
        }

        const normalizedUsername = normalizeUsername(username);
        if (!normalizedUsername) {
            setUsernameStatus({
                status: "idle",
                message: "Choose a username or refresh to get a new one."
            });
            return;
        }

        if (!USERNAME_REGEX.test(normalizedUsername)) {
            setUsernameStatus({
                status: "invalid",
                message: "Use 3-20 characters: a-z, 0-9, dot or underscore."
            });
            return;
        }

        setUsernameStatus({ status: "checking", message: "Checking username availability..." });

        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const result = await authService.checkUsername(normalizedUsername);
                if (cancelled) return;

                if (result && result.available) {
                    setUsernameStatus({
                        status: "available",
                        message: `@${result.username} is available`
                    });
                } else {
                    setUsernameStatus({
                        status: "taken",
                        message: (result && result.reason) || "Username is not available"
                    });
                }
            } catch {
                if (cancelled) return;
                setUsernameStatus({
                    status: "idle",
                    message: "Could not verify username right now. You can still continue."
                });
            }
        }, 320);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [needsUsername, username]);

    useEffect(() => {
        if (!needsUsername || username || autoSuggestedRef.current) return;
        autoSuggestedRef.current = true;
        void handleRefreshUsername();
    }, [needsUsername, username]);

    function clearFeedback() {
        clearNotice();
        setFieldErrors({ email: "", otp: "", username: "" });
        dismissError();
    }

    function handleEmailChange(value) {
        clearFeedback();
        setEmail(value);
    }

    function handleOtpChange(value) {
        clearFeedback();
        setOtp(value);
    }

    function handleUsernameChange(value) {
        clearFeedback();
        setUsername(value);
    }

    function resetForMode(nextMode) {
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

    function setMode(nextMode) {
        resetForMode(nextMode);
    }

    async function ensureUsernameIsUsable() {
        const normalizedUsername = normalizeUsername(username);
        if (!normalizedUsername) {
            const validationError = new Error("Choose a username");
            validationError.field = "username";
            throw validationError;
        }
        if (!USERNAME_REGEX.test(normalizedUsername)) {
            const validationError = new Error("Username must be 3-20 chars (a-z, 0-9, . and _)");
            validationError.field = "username";
            throw validationError;
        }

        const result = await authService.checkUsername(normalizedUsername);
        if (!result || !result.available) {
            const validationError = new Error((result && result.reason) || "Username is not available");
            validationError.field = "username";
            throw validationError;
        }

        setUsername(result.username);
        setUsernameStatus({
            status: "available",
            message: `@${result.username} is available`
        });

        return result.username;
    }

    async function handleRefreshUsername() {
        if (!needsUsername) return;

        const requestId = usernameRequestRef.current + 1;
        usernameRequestRef.current = requestId;
        setUsernameRefreshing(true);
        setFieldErrors((prev) => ({ ...prev, username: "" }));
        dismissError();
        setUsernameStatus({
            status: "checking",
            message: "Finding an available username..."
        });

        try {
            for (let attempt = 0; attempt < 18; attempt += 1) {
                const candidate = buildUsernameCandidate();
                const result = await authService.checkUsername(candidate);
                if (usernameRequestRef.current !== requestId) return;

                if (result && result.available) {
                    setUsername(result.username);
                    setUsernameStatus({
                        status: "available",
                        message: `@${result.username} is available`
                    });
                    return;
                }
            }

            throw new Error("Could not find an available username right now");
        } catch (err) {
            if (usernameRequestRef.current !== requestId) return;
            setUsernameStatus({
                status: "invalid",
                message: err && err.message ? err.message : "Could not generate a username right now"
            });
        } finally {
            if (usernameRequestRef.current === requestId) {
                setUsernameRefreshing(false);
            }
        }
    }

    async function requestOtp({ validateUsername = false, isResend = false } = {}) {
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) {
            setFieldErrors((prev) => ({ ...prev, email: "Enter your email address" }));
            return;
        }
        if (!EMAIL_REGEX.test(normalizedEmail)) {
            setFieldErrors((prev) => ({ ...prev, email: "Enter a valid email address" }));
            return;
        }

        try {
            setLoading(true);
            clearNotice();
            setFieldErrors({ email: "", otp: "", username: "" });
            dismissError();

            if (validateUsername) {
                await ensureUsernameIsUsable();
            }

            const response = await authService.requestOTP(normalizedEmail, mode);
            const nextRequiresUsername = !!(response && response.requiresUsername);

            setEmail(normalizedEmail);
            setModeState(nextRequiresUsername ? "signup" : "signin");
            setRequiresUsername(nextRequiresUsername);
            setStep("otp");
            setOtp("");
            setNotice(
                isResend
                    ? `A fresh code was sent to ${normalizedEmail}.`
                    : `We sent a 6-digit code to ${normalizedEmail}.`
            );

            // Persist pending OTP session so user can switch apps on mobile without losing state
            savePendingOtpSession({
                email: normalizedEmail,
                mode: nextRequiresUsername ? "signup" : "signin",
                requiresUsername: nextRequiresUsername,
                username,
                step: "otp"
            });

            if (!nextRequiresUsername) {
                setUsernameStatus({ status: "idle", message: "" });
            } else if (mode !== "signup" && !normalizeUsername(username)) {
                autoSuggestedRef.current = false;
            }
        } catch (err) {
            if (err && err.field === "username") {
                setFieldErrors((prev) => ({ ...prev, username: err.message || "Choose a valid username" }));
                return;
            }
            showError(err && err.message ? err.message : "Unable to send OTP right now.");
        } finally {
            setLoading(false);
        }
    }

    async function handleRequestOTP() {
        await requestOtp({ validateUsername: mode === "signup" });
    }

    async function handleResendOTP() {
        await requestOtp({ isResend: true });
    }

    async function handleVerifyOTP() {
        if (!otp.trim()) {
            setFieldErrors((prev) => ({ ...prev, otp: "Enter the OTP" }));
            return;
        }

        try {
            setLoading(true);
            setFieldErrors({ email: "", otp: "", username: "" });
            dismissError();

            let normalizedUsername = "";
            if (requiresUsername) {
                normalizedUsername = await ensureUsernameIsUsable();
            }

            const res = await authService.verifyOTP(
                normalizeEmail(email),
                otp.trim(),
                normalizedUsername
            );

            if (!res.user || !(res.user.id || res.user.userId)) {
                throw new Error("Invalid response from server");
            }

            clearPendingOtpSession();
            disconnectSocket();
            window.dispatchEvent(new Event("auth-changed"));
            navigate("/", { replace: true });
        } catch (err) {
            if (err && err.field === "username") {
                setFieldErrors((prev) => ({ ...prev, username: err.message || "Choose a valid username" }));
                return;
            }
            const message = err && err.message ? err.message : "Unable to verify OTP right now.";
            if (/otp|code/i.test(message)) {
                setFieldErrors((prev) => ({ ...prev, otp: message }));
                return;
            }
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
        setEmail: handleEmailChange,
        otp,
        setOtp: handleOtpChange,
        username,
        setUsername: handleUsernameChange,
        needsUsername,
        usernameStatus,
        usernameRefreshing,
        notice,
        loading,
        fieldErrors,
        handleRequestOTP,
        handleResendOTP,
        handleRefreshUsername,
        handleVerifyOTP
    };
}
