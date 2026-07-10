import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as authService from "../../services/auth.service";
import { useGlobalError } from "../../context/ErrorContext";
import { disconnectSocket } from "../../services/socket";
import useTimedNotice from "../../hooks/useTimedNotice";

const USERNAME_REGEX = /^[a-z0-9._]{3,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_ADJECTIVES = [
    "gentle",
    "bright",
    "calm",
    "kind",
    "silent",
    "steady",
    "open",
    "brave",
    "honest",
    "soft",
    "clear",
    "mellow"
];
const USERNAME_NOUNS = [
    "tiger",
    "river",
    "ember",
    "harbor",
    "meadow",
    "echo",
    "lantern",
    "summit",
    "willow",
    "comet",
    "sparrow",
    "horizon"
];

function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
}

function normalizeUsername(value) {
    return String(value || "").trim().toLowerCase();
}

function buildUsernameCandidate() {
    const adjective = USERNAME_ADJECTIVES[Math.floor(Math.random() * USERNAME_ADJECTIVES.length)];
    const noun = USERNAME_NOUNS[Math.floor(Math.random() * USERNAME_NOUNS.length)];
    const number = Math.floor(10 + Math.random() * 90);
    return `${adjective}${noun}${number}`.slice(0, 20);
}

export default function useOtpAuth(initialMode = "signin") {
    const navigate = useNavigate();
    const { showError, dismissError } = useGlobalError();
    const [mode, setModeState] = useState(initialMode === "signup" ? "signup" : "signin");
    const [step, setStep] = useState("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [username, setUsername] = useState("");
    const [requiresUsername, setRequiresUsername] = useState(initialMode === "signup");
    const [usernameStatus, setUsernameStatus] = useState({ status: "idle", message: "" });
    const [usernameRefreshing, setUsernameRefreshing] = useState(false);
    const [notice, setNotice, clearNotice] = useTimedNotice("", 3200);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ email: "", otp: "", username: "" });
    const autoSuggestedRef = useRef(false);
    const usernameRequestRef = useRef(0);

    const needsUsername = step === "otp" ? requiresUsername : mode === "signup";

    useEffect(() => {
        const safeMode = initialMode === "signup" ? "signup" : "signin";
        setModeState(safeMode);
        setStep("email");
        setOtp("");
        clearNotice();
        setFieldErrors({ email: "", otp: "", username: "" });
        dismissError();
        setRequiresUsername(safeMode === "signup");
        autoSuggestedRef.current = false;
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
