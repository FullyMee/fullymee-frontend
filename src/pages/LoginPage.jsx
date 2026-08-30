import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, ChevronRight, Gift, Heart, Lock, Mail, RefreshCcw, Shield, Sparkles, User, Users } from "lucide-react";
import InlineError from "../components/common/InlineError.jsx";
import { InlineSpinner } from "../components/loaders";
import useOtpAuth from "../features/auth/useOtpAuth";
import Button from "../components/common/Button";
import * as authService from "../services/auth.service";
import { useGlobalError } from "../context/ErrorContext.jsx";
import { disconnectSocket } from "../services/socket.js";
import fullymeLogo from "../assets/fullyme-logo.png";
import authIllustration from "../assets/auth-illustration.jpg";
import authSignupOrb from "../assets/auth-signup-orb.jpg";
import onboardingAdvisorRoom from "../assets/onboarding-advisor-room.jpg";
import onboardingSlide1Art from "../assets/onboarding-slide1-art.png";
import onboardingSlide2Art from "../assets/onboarding-slide2-art.png";

const ONBOARDING_STORAGE_KEY = "anonymous.auth.onboardingSeen";

/* ── Mask/Glasses Icon for "100% Anonymous" ── */
function MaskIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 10s3-4 10-4 10 4 10 4-3 7-10 7-10-7-10-7z" />
            <circle cx="7" cy="11" r="2.5" />
            <circle cx="17" cy="11" r="2.5" />
        </svg>
    );
}

/* ── Google Multi-Color "G" Icon ── */
function GoogleIcon() {
    return (
        <svg className="auth-google-btn__icon" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.09 24.09 0 0 0 0 21.56l7.98-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    );
}

/* ── Brand Logo with Official FullyMee Logo Mark ── */
function FullyMeeBrandLogo({ className = "" }) {
    return (
        <div className={`auth-brand ${className}`}>
            <img src={fullymeLogo} alt="FullyMee logo" className="auth-brand__img" />
            <span className="auth-brand__wordmark">FullyMee</span>
        </div>
    );
}

/* ── Shield Heart Icon for Privacy Badge ── */
function ShieldHeartIcon() {
    return (
        <svg width="34" height="38" viewBox="0 0 34 38" fill="none" className="auth-privacy-shield" aria-hidden="true">
            <path
                d="M17 2L3 7.5V17C3 26.5 9 34.5 17 37C25 34.5 31 26.5 31 17V7.5L17 2Z"
                fill="#f3e8ff"
                stroke="#a855f7"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M17 14C15 12 11.5 12.5 11 15.5C10.5 18.5 14 21.5 17 24C20 21.5 23.5 18.5 23 15.5C22.5 12.5 19 12 17 14Z"
                fill="#7c3aed"
            />
        </svg>
    );
}

/* ── 6-Box Separate OTP Component ── */
function SixDigitOtpInput({ value = "", onChange, isError, disabled }) {
    const inputRefs = useRef([]);
    const digits = useMemo(() => {
        const raw = (value || "").split("");
        return Array.from({ length: 6 }, (_, i) => raw[i] || "");
    }, [value]);

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace") {
            if (!digits[index] && index > 0) {
                e.preventDefault();
                const newDigits = [...digits];
                newDigits[index - 1] = "";
                onChange(newDigits.join(""));
                inputRefs.current[index - 1]?.focus();
            } else if (digits[index]) {
                e.preventDefault();
                const newDigits = [...digits];
                newDigits[index] = "";
                onChange(newDigits.join(""));
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < 5) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleChange = (index, e) => {
        const char = e.target.value.replace(/\D/g, "");
        if (!char) {
            const newDigits = [...digits];
            newDigits[index] = "";
            onChange(newDigits.join(""));
            return;
        }

        if (char.length === 1) {
            const newDigits = [...digits];
            newDigits[index] = char;
            const updated = newDigits.join("");
            onChange(updated);
            if (index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        } else {
            const pasted = char.slice(0, 6).split("");
            const newDigits = [...digits];
            for (let i = 0; i < pasted.length && index + i < 6; i++) {
                newDigits[index + i] = pasted[i];
            }
            const updated = newDigits.join("");
            onChange(updated);
            const nextIndex = Math.min(index + pasted.length, 5);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pastedData) {
            onChange(pastedData);
            const focusIdx = Math.min(pastedData.length, 5);
            inputRefs.current[focusIdx]?.focus();
        }
    };

    return (
        <div className="auth-otp-grid" onPaste={handlePaste} role="group" aria-label="6-digit verification code">
            {digits.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    pattern="[0-9]*"
                    maxLength={1}
                    className={`auth-otp-cell${isError ? " auth-otp-cell--error" : ""}${digit ? " is-filled" : ""}`}
                    value={digit}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onFocus={(e) => e.target.select()}
                    disabled={disabled}
                    aria-label={`Digit ${index + 1} of 6`}
                />
            ))}
        </div>
    );
}

const ONBOARDING_SLIDES = [
    {
        badge: { icon: Lock, text: "Your identity stays yours" },
        title: "Share your thoughts",
        highlight: "anonymously",
        hasSparkle: true,
        description: "Express yourself freely without revealing your identity. Your privacy is our priority.",
        image: onboardingSlide1Art,
        quote: null
    },
    {
        badge: { icon: Sparkles, text: "YOU'RE IN SAFE HANDS" },
        title: "Connect with",
        highlight: "Trusted Advisors",
        hasSparkle: false,
        description: "Get expert guidance from verified mentors in career, relationships, finance, and mental health.",
        image: onboardingSlide2Art,
        quote: {
            text: "The right guidance can change everything.",
            subtext: "We're here to help you every step of the way."
        }
    }
];

export default function LoginPage() {
    const navigate = useNavigate();
    const { showError } = useGlobalError();
    const [googleLoading, setGoogleLoading] = useState(false);
    const googleButtonHostRef = useRef(null);
    const googleVisualBtnRef = useRef(null);
    const [showOnboarding, setShowOnboarding] = useState(() => {
        try {
            const raw = window.sessionStorage.getItem("anonymous.auth.pendingOtpSession") || window.localStorage.getItem("anonymous.auth.pendingOtpSession");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.email && Date.now() - parsed.timestamp < 15 * 60 * 1000) {
                    return false;
                }
            }
            return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) !== "1";
        } catch {
            return true;
        }
    });
    const [authModeDefault, setAuthModeDefault] = useState(() => {
        try {
            const raw = window.sessionStorage.getItem("anonymous.auth.pendingOtpSession") || window.localStorage.getItem("anonymous.auth.pendingOtpSession");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.mode) {
                    return parsed.mode;
                }
            }
            return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1" ? "signin" : "signup";
        } catch {
            return "signup";
        }
    });
    const [slideIndex, setSlideIndex] = useState(0);

    const {
        mode,
        setMode,
        step,
        email,
        setEmail,
        otp,
        setOtp,
        username,
        setUsername,
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
    } = useOtpAuth(authModeDefault);

    /* ── Google Auth setup ── */
    useEffect(() => {
        const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
        if (!clientId) return;
        if (!window.google || !window.google.accounts || !window.google.accounts.id) return;
        if (step !== "email") return;
        if (!googleButtonHostRef.current) return;

        const onCredential = async (response) => {
            const credential = String((response && response.credential) || "").trim();
            if (!credential) {
                showError("Google sign-in failed. Please try again.");
                return;
            }

            try {
                setGoogleLoading(true);
                await authService.googleSignIn(credential, mode);
                disconnectSocket();
                window.dispatchEvent(new Event("auth-changed"));
                navigate("/", { replace: true });
            } catch (err) {
                const payloadCode = err && err.payload && err.payload.code ? String(err.payload.code) : "";
                if ((err && err.status === 404) || payloadCode === "GOOGLE_SIGNIN_NO_ACCOUNT") {
                    showError(err && err.message ? err.message : "User does not exist, sign up first.");
                } else {
                    showError(err && err.message ? err.message : "Unable to continue with Google right now.");
                }
            } finally {
                setGoogleLoading(false);
            }
        };

        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: onCredential
        });

        googleButtonHostRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleButtonHostRef.current, {
            theme: "outline",
            size: "large",
            shape: "pill",
            text: mode === "signup" ? "signup_with" : "signin_with",
            width: 360
        });
    }, [mode, step, navigate, setMode, showError]);

    /* ── Trigger hidden Google button from custom button ── */
    function handleGoogleClick() {
        if (googleButtonHostRef.current) {
            const realBtn = googleButtonHostRef.current.querySelector('[role="button"]')
                || googleButtonHostRef.current.querySelector('div[tabindex]')
                || googleButtonHostRef.current.querySelector('iframe')
                || googleButtonHostRef.current.querySelector('div');
            if (realBtn) {
                realBtn.click();
                return;
            }
        }
        if (window.google && window.google.accounts && window.google.accounts.id) {
            window.google.accounts.id.prompt();
        }
    }

    const activeSlide = ONBOARDING_SLIDES[slideIndex] || ONBOARDING_SLIDES[0];

    /* ── Card Hero Content ── */
    const heroContent = useMemo(() => {
        if (step === "otp") {
            return {
                title: "Almost there",
                subtitle: needsUsername
                    ? "Verify your email and confirm your anonymous identity."
                    : "Enter the code we sent to your email."
            };
        }

        return mode === "signup"
            ? {
                title: "Join anonymously",
                subtitle: "Choose the identity the world sees here."
            }
            : {
                title: "Welcome back",
                subtitle: "Your quiet space is still here."
            };
    }, [mode, needsUsername, step]);

    /* ── Privacy note content ── */
    const privacyContent = useMemo(() => {
        if (mode === "signup") {
            return {
                title: "Your email stays private.",
                body: ""
            };
        }
        return {
            title: "Your identity stays yours.",
            body: ""
        };
    }, [mode]);

    function finishOnboarding() {
        try {
            window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
        } catch {
            // ignore
        }
        setShowOnboarding(false);
        setAuthModeDefault("signin");
        setMode("signin");
    }

    function handleNextSlide() {
        if (slideIndex === ONBOARDING_SLIDES.length - 1) {
            finishOnboarding();
            return;
        }
        setSlideIndex((current) => current + 1);
    }

    /* ═══════════════════════════════════════════════
       ONBOARDING VIEW (Full-Bleed Experience)
       ═══════════════════════════════════════════════ */
    if (showOnboarding) {
        const isLastSlide = slideIndex === ONBOARDING_SLIDES.length - 1;
        return (
            <div className="auth-page auth-page--onboarding-screen">
                <div className="auth-onboarding-container">
                    {/* Top Header */}
                    <div className="auth-onboarding-top-bar">
                        <FullyMeeBrandLogo />
                    </div>

                    {/* Main 2-Column Content */}
                    <div className="auth-onboarding-main">
                        {/* Left Column: Content, Progress, Actions, Benefits */}
                        <div className="auth-onboarding-left" key={slideIndex}>
                            {/* Floating Mobile Artwork Banner */}
                            <div className="auth-onboarding-mobile-art" aria-hidden="true">
                                <img
                                    src={activeSlide.image}
                                    alt=""
                                    className="auth-onboarding-mobile-art__img"
                                />
                            </div>

                            <div className="auth-onboarding-tag">
                                {activeSlide.badge.icon && <activeSlide.badge.icon size={13} strokeWidth={2.4} />}
                                <span>{activeSlide.badge.text}</span>
                            </div>

                            <h1 className="auth-onboarding-title">
                                {activeSlide.title} <br />
                                <span className="auth-onboarding-title__highlight">
                                    {activeSlide.highlight}
                                </span>
                                {activeSlide.hasSparkle && <span className="auth-sparkle-pink"> ✦</span>}
                            </h1>

                            <p className="auth-onboarding-desc">{activeSlide.description}</p>

                            {/* Segmented Progress Capsules */}
                            <div className="auth-onboarding-capsules" aria-label="Onboarding progress">
                                {ONBOARDING_SLIDES.map((_, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`auth-onboarding-capsule${index === slideIndex ? " is-active" : ""}`}
                                        onClick={() => setSlideIndex(index)}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>

                            {/* Action Buttons: Skip & Next */}
                            <div className="auth-onboarding-buttons">
                                <button
                                    type="button"
                                    className="auth-onboarding-btn auth-onboarding-btn--skip"
                                    onClick={finishOnboarding}
                                >
                                    Skip
                                </button>
                                <button
                                    type="button"
                                    className="auth-onboarding-btn auth-onboarding-btn--next"
                                    onClick={handleNextSlide}
                                >
                                    <span>{isLastSlide ? "Get Started" : "Next"}</span>
                                    <ArrowRight size={17} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* 3 Value Propositions (Mobile Glassmorphic Cards) */}
                            <div className="auth-onboarding-benefits-list">
                                <div className="auth-onboarding-benefit">
                                    <div className="auth-onboarding-benefit__icon auth-onboarding-benefit__icon--purple">
                                        <Users size={17} strokeWidth={2.2} />
                                    </div>
                                    <div className="auth-onboarding-benefit__text">
                                        <strong>Join 10,000+ anonymous users</strong>
                                        <span>A growing community of real people.</span>
                                    </div>
                                    <ChevronRight size={16} strokeWidth={2.2} className="auth-onboarding-benefit__chevron" />
                                </div>
                                <div className="auth-onboarding-benefit">
                                    <div className="auth-onboarding-benefit__icon auth-onboarding-benefit__icon--pink">
                                        <Gift size={17} strokeWidth={2.2} />
                                    </div>
                                    <div className="auth-onboarding-benefit__text">
                                        <strong>100% free and always will be</strong>
                                        <span>No hidden fees. No subscriptions.</span>
                                    </div>
                                    <ChevronRight size={16} strokeWidth={2.2} className="auth-onboarding-benefit__chevron" />
                                </div>
                                <div className="auth-onboarding-benefit">
                                    <div className="auth-onboarding-benefit__icon auth-onboarding-benefit__icon--rose">
                                        <Shield size={17} strokeWidth={2.2} />
                                    </div>
                                    <div className="auth-onboarding-benefit__text">
                                        <strong>Safe and moderated community</strong>
                                        <span>We keep it safe, respectful and real.</span>
                                    </div>
                                    <ChevronRight size={16} strokeWidth={2.2} className="auth-onboarding-benefit__chevron" />
                                </div>
                            </div>

                            {/* Mobile Quote Card for Slide 2 */}
                            {activeSlide.quote && (
                                <div className="auth-onboarding-quote-card auth-onboarding-quote-card--mobile">
                                    <div className="auth-onboarding-quote-card__quote-mark">❝</div>
                                    <div className="auth-onboarding-quote-card__content">
                                        <strong>{activeSlide.quote.text}</strong>
                                        <span>{activeSlide.quote.subtext}</span>
                                    </div>
                                    <Heart size={18} strokeWidth={2} className="auth-onboarding-quote-card__heart" />
                                </div>
                            )}
                        </div>

                        {/* Right Atmospheric Visual Stage (Desktop only) */}
                        <div className="auth-onboarding-right">
                            <div className="auth-onboarding-art-wrapper">
                                <img
                                    src={activeSlide.image}
                                    alt={activeSlide.title}
                                    className="auth-onboarding-art-img"
                                />
                            </div>

                            {activeSlide.quote && (
                                <div className="auth-onboarding-quote-card auth-onboarding-quote-card--desktop">
                                    <div className="auth-onboarding-quote-card__quote-mark">❝</div>
                                    <div className="auth-onboarding-quote-card__content">
                                        <strong>{activeSlide.quote.text}</strong>
                                        <span>{activeSlide.quote.subtext}</span>
                                    </div>
                                    <Heart size={18} strokeWidth={2} className="auth-onboarding-quote-card__heart" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Centered Floating Pill */}
                    <div className="auth-onboarding-bottom-pill">
                        <Sparkles size={14} strokeWidth={2.2} />
                        <span>No names · No judgment · Just you</span>
                    </div>
                </div>
            </div>
        );
    }

    /* ═══════════════════════════════════════════════
       MAIN AUTH VIEW
       ═══════════════════════════════════════════════ */
    return (
        <div className="auth-page">
            <div className="auth-container">
                {/* ── Left Editorial & Illustration Column (Desktop) ── */}
                <section className="auth-visual" aria-hidden="true">
                    <div className="auth-visual__panel">
                        <FullyMeeBrandLogo className="auth-brand--desktop" />

                        {/* Top Pill Tag */}
                        <div className="auth-tag-pill">
                            <span>A SAFE SPACE TO BE YOU</span>
                        </div>

                        <div className="auth-hero-statement">
                            <h1 className="auth-hero-statement__title">
                                Be real.<br />
                                <span className="auth-hero-statement__gradient">Without revealing.</span>
                            </h1>
                            <p className="auth-hero-statement__subtitle">
                                FullyMee is your safe space to share, confess, and connect anonymously.
                            </p>
                        </div>

                        <div className="auth-features">
                            <div className="auth-feature-item">
                                <div className="auth-feature-item__icon auth-feature-item__icon--purple">
                                    <MaskIcon />
                                </div>
                                <div className="auth-feature-item__text">
                                    <strong>100% Anonymous</strong>
                                    <span>Your identity stays completely private.</span>
                                </div>
                            </div>

                            <div className="auth-feature-item">
                                <div className="auth-feature-item__icon auth-feature-item__icon--pink">
                                    <Lock size={18} strokeWidth={2.2} />
                                </div>
                                <div className="auth-feature-item__text">
                                    <strong>Safe & Secure</strong>
                                    <span>Your confessions are never linked to you.</span>
                                </div>
                            </div>

                            <div className="auth-feature-item">
                                <div className="auth-feature-item__icon auth-feature-item__icon--rose">
                                    <Heart size={18} strokeWidth={2.2} />
                                </div>
                                <div className="auth-feature-item__text">
                                    <strong>No Judgment</strong>
                                    <span>Share freely. Be heard. Be you.</span>
                                </div>
                            </div>
                        </div>

                        <div className="auth-pill-badge">
                            <Shield size={14} strokeWidth={2.2} />
                            <span>No names · No judgment · Just you</span>
                        </div>
                    </div>

                    <div className="auth-visual__art">
                        <img src={authIllustration} alt="" className="auth-visual__art-img" />
                    </div>
                </section>

                {/* ── Right Form Column (Desktop & Mobile) ── */}
                <div className="auth-shell">
                    {/* ── Mobile-Specific Top Hero Header matching attached design ── */}
                    <div className="auth-mobile-hero" aria-hidden="true">
                        <div className="auth-mobile-hero__top">
                            <FullyMeeBrandLogo />
                        </div>
                        <div className="auth-tag-pill auth-tag-pill--mobile">
                            <Shield size={12} strokeWidth={2.4} />
                            <span>A SAFE SPACE TO BE YOU</span>
                        </div>
                        <div className="auth-hero-statement auth-hero-statement--mobile">
                            <h1 className="auth-hero-statement__title">
                                Be real.<br />
                                <span className="auth-hero-statement__gradient">Without revealing.</span>
                                <span className="auth-sparkle-pink">✦</span>
                            </h1>
                            <p className="auth-hero-statement__subtitle">
                                FullyMee is your safe space to share, confess, and connect anonymously.
                            </p>
                        </div>
                        <div className="auth-mobile-hero__art">
                            <img
                                src={authIllustration}
                                alt=""
                                className="auth-mobile-hero__art-img"
                            />
                        </div>
                    </div>

                    <section className="auth-card">
                        {/* ── Card Sparkle Badge & Hero Title ── */}
                        <div className="auth-card-header">
                            <div className="auth-card__sparkle-badge" aria-hidden="true">
                                <Sparkles size={18} strokeWidth={2.2} />
                            </div>
                            <div className="auth-hero">
                                <h1 className="auth-hero__title">
                                    {heroContent.title} <span className="auth-sparkle-pink">✦</span>
                                </h1>
                                <p className="auth-hero__subtitle">{heroContent.subtitle}</p>
                            </div>
                        </div>

                        {/* ════════════════════════════════════════
                           EMAIL STEP
                           ════════════════════════════════════════ */}
                        {step === "email" && (
                            <div className="auth-form">
                                {/* ── Identity Box (Signup Mode Only) ── */}
                                {mode === "signup" && (
                                    <div className="auth-identity">
                                        <div className="auth-section-header">
                                            <span className="auth-section-header__badge">
                                                <User size={13} strokeWidth={2.4} />
                                            </span>
                                            <span className="auth-section-header__title">YOUR FULLYMEE IDENTITY</span>
                                        </div>
                                        <p className="auth-identity__field-label">Anonymous username</p>
                                        <div className={`auth-input-row auth-input-row--has-action${fieldErrors.username ? " auth-input-row--error" : ""}`}>
                                            <span className="auth-input-row__prefix">@</span>
                                            <input
                                                id="username"
                                                autoComplete="username"
                                                className="auth-input-row__input auth-input-row__input--bold"
                                                placeholder="softsparrow54"
                                                value={username}
                                                onChange={(event) => setUsername(event.target.value)}
                                                aria-invalid={fieldErrors.username ? "true" : "false"}
                                            />
                                            <button
                                                type="button"
                                                className="auth-input-row__action"
                                                onClick={handleRefreshUsername}
                                                disabled={loading || usernameRefreshing}
                                                aria-label="Generate another username"
                                            >
                                                <RefreshCcw size={15} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                        {!fieldErrors.username && (
                                            <div className={`auth-hint auth-hint--${usernameStatus.status || "idle"}`}>
                                                {usernameStatus.status === "available" && <CheckCircle2 size={13} className="auth-hint-check-icon" />}
                                                <span>
                                                    {usernameRefreshing
                                                        ? "Finding you a fresh identity..."
                                                        : (usernameStatus.message || "Tap refresh to generate a new identity")}
                                                </span>
                                            </div>
                                        )}
                                        <InlineError error={fieldErrors.username} className="auth-inline-error" />
                                    </div>
                                )}

                                {/* ── Email Field ── */}
                                <div className="auth-field">
                                    <label className="auth-field-label" htmlFor="auth-email">EMAIL</label>
                                    <div className={`auth-input-row${fieldErrors.email ? " auth-input-row--error" : ""}`}>
                                        <span className="auth-input-row__icon">
                                            <Mail size={17} strokeWidth={2} />
                                        </span>
                                        <input
                                            id="auth-email"
                                            type="email"
                                            autoComplete="email"
                                            className="auth-input-row__input"
                                            placeholder="your.email@example.com"
                                            value={email}
                                            onChange={(event) => setEmail(event.target.value)}
                                            aria-invalid={fieldErrors.email ? "true" : "false"}
                                        />
                                    </div>


                                </div>

                                {/* ── CTA Button ── */}
                                <button
                                    type="button"
                                    className="auth-cta"
                                    onClick={handleRequestOTP}
                                    disabled={loading}
                                >
                                    {loading
                                        ? <span className="auth-cta__spinner" />
                                        : <>Continue <ArrowRight size={17} strokeWidth={2.5} /></>
                                    }
                                </button>

                                {/* ── Divider ── */}
                                <div className="auth-divider" role="separator">
                                    <span>or</span>
                                </div>

                                {/* ── Google Button ── */}
                                <div className="auth-google-wrap">
                                    <div ref={googleButtonHostRef} className="auth-google-button-host" aria-hidden="true" />
                                    <button
                                        type="button"
                                        className="auth-google-btn"
                                        ref={googleVisualBtnRef}
                                        onClick={handleGoogleClick}
                                        disabled={googleLoading}
                                    >
                                        <GoogleIcon />
                                        <span>Continue with Google</span>
                                    </button>

                                    {googleLoading && (
                                        <p className="auth-hint auth-hint--checking" style={{ textAlign: "center" }}>
                                            <InlineSpinner /> Continuing with Google...
                                        </p>
                                    )}
                                </div>

                                {/* ── Privacy Note Card (with Shield Heart Badge) ── */}
                                <div className="auth-privacy auth-privacy--shield">
                                    <ShieldHeartIcon />
                                    <div className="auth-privacy__content">
                                        <p className="auth-privacy__title">
                                            <span>{privacyContent.title}</span>
                                            <span className="auth-sparkle-pink" style={{ fontSize: '0.85rem' }}>✦</span>
                                        </p>

                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ════════════════════════════════════════
                           OTP STEP
                           ════════════════════════════════════════ */}
                        {step === "otp" && (
                            <div className="auth-form">
                                <div className="auth-info-chip">
                                    <span>Code sent to</span>
                                    <strong>{email}</strong>
                                </div>

                                <div className="auth-field">
                                    <label className="auth-field-label">ONE-TIME PASSWORD</label>
                                    <SixDigitOtpInput
                                        value={otp}
                                        onChange={(val) => setOtp(val)}
                                        isError={Boolean(fieldErrors.otp)}
                                        disabled={loading}
                                    />
                                    <InlineError error={fieldErrors.otp} className="auth-inline-error" />
                                </div>

                                {needsUsername && (
                                    <div className="auth-identity">
                                        <div className="auth-section-header">
                                            <span className="auth-section-header__badge">
                                                <User size={13} strokeWidth={2.4} />
                                            </span>
                                            <span className="auth-section-header__title">YOUR FULLYMEE IDENTITY</span>
                                        </div>
                                        <p className="auth-identity__field-label">Anonymous username</p>
                                        <div className={`auth-input-row auth-input-row--has-action${fieldErrors.username ? " auth-input-row--error" : ""}`}>
                                            <span className="auth-input-row__prefix">@</span>
                                            <input
                                                id="otp-username"
                                                autoComplete="username"
                                                className="auth-input-row__input auth-input-row__input--bold"
                                                placeholder="softsparrow54"
                                                value={username}
                                                onChange={(event) => setUsername(event.target.value)}
                                                aria-invalid={fieldErrors.username ? "true" : "false"}
                                            />
                                            <button
                                                type="button"
                                                className="auth-input-row__action"
                                                onClick={handleRefreshUsername}
                                                disabled={loading || usernameRefreshing}
                                                aria-label="Generate another username"
                                            >
                                                <RefreshCcw size={15} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                        {!fieldErrors.username && (
                                            <div className={`auth-hint auth-hint--${usernameStatus.status || "idle"}`}>
                                                {usernameStatus.status === "available" && <CheckCircle2 size={13} className="auth-hint-check-icon" />}
                                                <span>
                                                    {usernameRefreshing
                                                        ? "Finding you a fresh identity..."
                                                        : (usernameStatus.message || "Choose a username to finish setup")}
                                                </span>
                                            </div>
                                        )}
                                        <InlineError error={fieldErrors.username} className="auth-inline-error" />
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className="auth-cta"
                                    onClick={handleVerifyOTP}
                                    disabled={loading}
                                >
                                    {loading
                                        ? <span className="auth-cta__spinner" />
                                        : <>Verify & Continue <ArrowRight size={17} strokeWidth={2.5} /></>
                                    }
                                </button>

                                <div className="auth-otp-actions">
                                    <button
                                        type="button"
                                        className="auth-otp-actions__btn auth-otp-actions__btn--secondary"
                                        onClick={handleResendOTP}
                                        disabled={loading}
                                    >
                                        Resend OTP
                                    </button>
                                    <button
                                        type="button"
                                        className="auth-otp-actions__btn auth-otp-actions__btn--text"
                                        onClick={() => setMode(mode)}
                                        disabled={loading}
                                    >
                                        Change email
                                    </button>
                                </div>

                                <div className="auth-privacy auth-privacy--shield">
                                    <ShieldHeartIcon />
                                    <div className="auth-privacy__content">
                                        <p className="auth-privacy__title">
                                            <span>{privacyContent.title}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Notice ── */}
                        {notice && <p className="auth-notice">{notice}</p>}

                        {/* ── Mode Switch ── */}
                        <div className="auth-switch auth-switch--row">
                            <span className="auth-switch__lead">
                                {mode === "signup" ? "Already have an account?" : "New here?"}
                            </span>
                            <button
                                type="button"
                                className="auth-switch__action-link"
                                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                                disabled={loading}
                            >
                                <span>{mode === "signup" ? "Sign in with email OTP" : "Create an anonymous account"}</span>
                                <span className="auth-switch__chevron" aria-hidden="true">›</span>
                            </button>
                        </div>

                        {/* ── Legal Footer ── */}
                        <div className="auth-legal-footer">
                            <p className="auth-legal-footer__prompt">By continuing, you agree to our</p>
                            <p className="auth-legal-footer__links">
                                <a href="#">Terms of Service</a>
                                <span className="auth-legal__sep">·</span>
                                <a href="#">Privacy Policy</a>
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
