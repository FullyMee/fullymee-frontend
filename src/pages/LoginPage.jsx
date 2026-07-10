import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mail, RefreshCcw, Shield, Sparkles, Star, Users, Lock } from "lucide-react";
import InlineError from "../components/common/InlineError.jsx";
import { InlineSpinner } from "../components/common/LoadingStates.jsx";
import useOtpAuth from "../features/auth/useOtpAuth";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import * as authService from "../services/auth.service";
import { useGlobalError } from "../context/ErrorContext.jsx";
import { disconnectSocket } from "../services/socket.js";

const ONBOARDING_STORAGE_KEY = "anonymous.auth.onboardingSeen";

function PeopleIcon() { return <Users size={18} strokeWidth={2} />; }
function ShieldIcon() { return <Shield size={18} strokeWidth={2} />; }
function MailIcon() { return <Mail size={18} strokeWidth={2} />; }
function RefreshIcon() { return <RefreshCcw size={18} strokeWidth={2} />; }
function ArrowRightIcon() { return <ArrowRight size={18} strokeWidth={2} />; }
function UserSparkIcon() { return <Sparkles size={18} strokeWidth={2} />; }
function LockIcon() { return <Lock size={18} strokeWidth={2} />; }
function StarIcon() { return <Star size={18} strokeWidth={2} />; }

const ONBOARDING_SLIDES = [
    {
        accent: "pink",
        hero: "Receive Advice from Real People",
        description: "Get support from a caring community who understands what you're going through.",
        emoji: "💬"
    },
    {
        accent: "blue",
        hero: "Share Your Thoughts Anonymously",
        description: "Express yourself freely without revealing your identity. Your privacy is our priority.",
        emoji: "🔒"
    },
    {
        accent: "spring",
        hero: "Connect with Trusted Advisors",
        description: "Get expert guidance from verified mentors in career, relationships, finance, and mental health.",
        emoji: "⭐"
    },
    {
        accent: "sunset",
        hero: "Build Trust Through Helping",
        description: "Share your experiences and earn reputation by supporting others in the community.",
        emoji: "🤝"
    }
];

export default function LoginPage() {
    const navigate = useNavigate();
    const { showError } = useGlobalError();
    const [googleLoading, setGoogleLoading] = useState(false);
    const googleButtonHostRef = useRef(null);
    const [showOnboarding, setShowOnboarding] = useState(() => {
        try {
            return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) !== "1";
        } catch {
            return true;
        }
    });
    const [authModeDefault, setAuthModeDefault] = useState(() => {
        try {
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

    useEffect(() => {
        const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
        if (!clientId) return;
        if (!window.google || !window.google.accounts || !window.google.accounts.id) return;
        if (mode !== "signin" || step !== "email") return;
        if (!googleButtonHostRef.current) return;

        const onCredential = async (response) => {
            const credential = String((response && response.credential) || "").trim();
            if (!credential) {
                showError("Google sign-in failed. Please try again.");
                return;
            }

            try {
                setGoogleLoading(true);
                await authService.googleSignIn(credential);
                disconnectSocket();
                window.dispatchEvent(new Event("auth-changed"));
                navigate("/", { replace: true });
            } catch (err) {
                showError(err && err.message ? err.message : "Unable to sign in with Google right now.");
            } finally {
                setGoogleLoading(false);
            }
        };

        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: onCredential
        });

        googleButtonHostRef.current.innerHTML = "";
        const width = Math.max(220, Math.min(380, Math.floor(googleButtonHostRef.current.clientWidth || 320)));
        window.google.accounts.id.renderButton(googleButtonHostRef.current, {
            theme: "outline",
            size: "large",
            shape: "pill",
            text: "signin_with",
            width
        });
    }, [mode, step, navigate, showError]);

    const activeSlide = ONBOARDING_SLIDES[slideIndex];
    const authIntro = useMemo(() => {
        if (step === "otp") {
            return needsUsername
                ? {
                    icon: <UserSparkIcon />,
                    title: "Verify Email to Finish Signup",
                    description: "Enter the OTP we sent and confirm your anonymous username."
                }
                : {
                    icon: <MailIcon />,
                    title: "Enter Your OTP",
                    description: "We sent a one-time code to your email. No password is needed."
                };
        }

        return mode === "signup"
            ? {
                icon: <ShieldIcon />,
                title: "Join Anonymously",
                description: "Your identity stays completely private"
            }
            : {
                icon: <MailIcon />,
                title: "Welcome Back",
                description: "Enter your email and we'll send a one-time sign-in code. No password needed."
            };
    }, [mode, needsUsername, step]);

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

    if (showOnboarding) {
        const isLastSlide = slideIndex === ONBOARDING_SLIDES.length - 1;
        return (
            <div className="auth-page auth-page--onboarding">
                <button
                    type="button"
                    className="auth-onboarding-skip"
                    onClick={finishOnboarding}
                >
                    Skip
                </button>

                <div className="auth-onboarding-layout">
                    <section className={`auth-onboarding-visual auth-onboarding-visual--${activeSlide.accent}`}>
                        <div className="auth-onboarding-emoji" aria-hidden="true">
                            {activeSlide.emoji}
                        </div>
                    </section>

                    <section className="auth-onboarding-content">
                        <div className="auth-onboarding-copy auth-onboarding-copy--desktop">
                            <h1>{activeSlide.hero}</h1>
                            <p>{activeSlide.description}</p>
                        </div>

                        <div className="auth-onboarding-dots" aria-label="Onboarding progress">
                            {ONBOARDING_SLIDES.map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className={`auth-onboarding-dots__dot${index === slideIndex ? " is-active" : ""}`}
                                    onClick={() => setSlideIndex(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>

                        <div className="auth-onboarding-actions">
                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleNextSlide}
                            >
                                <span>{isLastSlide ? "Get Started" : "Next"}</span>
                                <ArrowRightIcon />
                            </Button>
                        </div>

                        <ul className="auth-onboarding-benefits">
                            <li>Join 10,000+ anonymous users</li>
                            <li>100% free and always will be</li>
                            <li>Safe and moderated community</li>
                        </ul>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <section className="auth-visual" aria-hidden="true">
                <div className="auth-visual__panel">
                    <div className="auth-visual__badge">
                        <ShieldIcon />
                    </div>
                    <h2>{mode === "signup" ? "Join Anonymously" : "Welcome Back"}</h2>
                    <p>
                        {mode === "signup"
                            ? "Share your thoughts, get advice, and connect with a supportive community while staying completely anonymous."
                            : "Sign in quickly to continue your anonymous conversations and trusted support network."}
                    </p>
                    <div className="auth-visual__features">
                        <div>
                            <span className="auth-visual__feature-icon"><LockIcon /></span>
                            <span>
                                <strong>100% Anonymous</strong>
                                <small>Your identity stays completely private</small>
                            </span>
                        </div>
                        <div>
                            <span className="auth-visual__feature-icon"><PeopleIcon /></span>
                            <span>
                                <strong>Safe Community</strong>
                                <small>Get support from real people</small>
                            </span>
                        </div>
                        <div>
                            <span className="auth-visual__feature-icon"><StarIcon /></span>
                            <span>
                                <strong>Expert Advice</strong>
                                <small>Connect with trusted advisors</small>
                            </span>
                        </div>
                    </div>
                </div>
            </section>
            <div className="auth-shell">
                <section className="auth-card">
                    <div className="auth-card__icon">{authIntro.icon}</div>
                    <div className="auth-card__copy">
                        <h1>{authIntro.title}</h1>
                        <p>{authIntro.description}</p>
                    </div>

                    {step === "email" && (
                        <div className="auth-form">
                            {mode === "signup" && (
                                <div className="auth-field">
                                    <label className="auth-label" htmlFor="username">Your Anonymous Username</label>
                                    <div className={`auth-input-group auth-input-group--with-action${fieldErrors.username ? " auth-input-group--error" : ""}`}>
                                        <input
                                            id="username"
                                            autoComplete="username"
                                            className={`auth-input${fieldErrors.username ? " auth-input--error" : ""}`}
                                            placeholder="gentletiger51"
                                            value={username}
                                            onChange={(event) => setUsername(event.target.value)}
                                            aria-invalid={fieldErrors.username ? "true" : "false"}
                                        />
                                        <button
                                            type="button"
                                            className="auth-icon-button"
                                            onClick={handleRefreshUsername}
                                            disabled={loading || usernameRefreshing}
                                            aria-label="Generate another username"
                                        >
                                            <RefreshIcon />
                                        </button>
                                    </div>
                                    {!fieldErrors.username && (
                                        <p className={`auth-hint auth-hint--${usernameStatus.status || "idle"}`}>
                                            {usernameRefreshing
                                                ? "Generating a fresh available username..."
                                                : (usernameStatus.message || "Refresh to generate a new username")}
                                        </p>
                                    )}
                                    <InlineError error={fieldErrors.username} className="auth-inline-error" />
                                </div>
                            )}

                            <div className="auth-field">
                                <Input
                                    label="Email"
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="your.email@example.com"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    error={fieldErrors.email}
                                    helperText={mode === "signup" ? "Email is required for OTP signup and recovery." : "We only use your email to send the OTP sign-in code."}
                                    startIcon={<MailIcon />}
                                />
                            </div>

                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleRequestOTP}
                                isLoading={loading}
                            >
                                <span>Continue</span>
                                <ArrowRightIcon />
                            </Button>

                            {mode === "signin" && (
                                <>
                                    <div className="auth-divider" role="separator" aria-label="or">
                                        <span>or</span>
                                    </div>
                                    <div className="auth-google-wrap">
                                        <div ref={googleButtonHostRef} className="auth-google-button-host" />
                                        {googleLoading && (
                                            <p className="auth-hint auth-hint--checking" style={{ textAlign: "center" }}>
                                                <InlineSpinner /> Signing in with Google...
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="auth-trust-note">
                                <span aria-hidden="true">🔒</span>
                                <p>Your posts and comments are never linked to your email or identity.</p>
                            </div>
                        </div>
                    )}

                    {step === "otp" && (
                        <div className="auth-form">
                            <div className="auth-info-chip">
                                <span>OTP sent to</span>
                                <strong>{email}</strong>
                            </div>

                            <div className="auth-field">
                                <label className="auth-label" htmlFor="otp">One-Time Password</label>
                                <input
                                    id="otp"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    className={`auth-input auth-input--otp${fieldErrors.otp ? " auth-input--error" : ""}`}
                                    placeholder="6-digit code"
                                    value={otp}
                                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                                    aria-invalid={fieldErrors.otp ? "true" : "false"}
                                />
                                <InlineError error={fieldErrors.otp} className="auth-inline-error" />
                                <p className="auth-hint auth-hint--idle">
                                    Enter the 6-digit code from your email inbox.
                                </p>
                            </div>

                            {needsUsername && (
                                <div className="auth-field">
                                    <label className="auth-label" htmlFor="otp-username">Anonymous Username</label>
                                    <div className={`auth-input-group auth-input-group--with-action${fieldErrors.username ? " auth-input-group--error" : ""}`}>
                                        <input
                                            id="otp-username"
                                            autoComplete="username"
                                            className={`auth-input${fieldErrors.username ? " auth-input--error" : ""}`}
                                            placeholder="gentletiger51"
                                            value={username}
                                            onChange={(event) => setUsername(event.target.value)}
                                            aria-invalid={fieldErrors.username ? "true" : "false"}
                                        />
                                        <button
                                            type="button"
                                            className="auth-icon-button"
                                            onClick={handleRefreshUsername}
                                            disabled={loading || usernameRefreshing}
                                            aria-label="Generate another username"
                                        >
                                            <RefreshIcon />
                                        </button>
                                    </div>
                                    {!fieldErrors.username && (
                                        <p className={`auth-hint auth-hint--${usernameStatus.status || "idle"}`}>
                                            {usernameRefreshing
                                                ? "Generating a fresh available username..."
                                                : (usernameStatus.message || "Choose a username to finish setup")}
                                        </p>
                                    )}
                                    <InlineError error={fieldErrors.username} className="auth-inline-error" />
                                </div>
                            )}

                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleVerifyOTP}
                                isLoading={loading}
                            >
                                <span>Verify & Continue</span>
                                <ArrowRightIcon />
                            </Button>

                            <div className="auth-inline-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleResendOTP}
                                    disabled={loading}
                                >
                                    Resend OTP
                                </Button>
                                <Button
                                    type="button"
                                    variant="text"
                                    onClick={() => setMode(mode)}
                                    disabled={loading}
                                >
                                    Change email
                                </Button>
                            </div>
                        </div>
                    )}

                    {notice && <p className="auth-message auth-message--notice">{notice}</p>}

                    <div className="auth-switch">
                        <span>{mode === "signup" ? "Already have an account?" : "New here?"}</span>
                        <Button
                            type="button"
                            variant="text"
                            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                            disabled={loading}
                        >
                            {mode === "signup" ? "Sign in with email OTP" : "Create an anonymous account"}
                        </Button>
                    </div>

                    <p className="auth-legal">
                        By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
