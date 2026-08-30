import { useEffect, useRef, useState } from "react";
import { Clock, CheckCircle, Trash2 } from "lucide-react";

const CONFIRM_WINDOW_MS = 5 * 60 * 1000;

function useCountdown(expiresAt) {
    const [msLeft, setMsLeft] = useState(() => {
        if (!expiresAt) return CONFIRM_WINDOW_MS;
        return Math.max(0, new Date(expiresAt).getTime() - Date.now());
    });

    useEffect(() => {
        if (!expiresAt) return;
        const tick = () => {
            const remaining = Math.max(0, new Date(expiresAt).getTime() - Date.now());
            setMsLeft(remaining);
        };
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    const minutes = Math.floor(msLeft / 60000);
    const seconds = Math.floor((msLeft % 60000) / 1000);
    const progress = expiresAt
        ? msLeft / CONFIRM_WINDOW_MS
        : 1;

    return { msLeft, minutes, seconds, progress };
}

import { safeUnicodeSlice, getUnicodeLength } from "../../../utils/unicode.js";

export default function ConfessionScheduleConfirmModal({
    confession,
    onConfirm,
    onCancel
}) {
    const { confessionId, content, confirmExpiresAt, audio } = confession || {};
    const { minutes, seconds, progress, msLeft } = useCountdown(confirmExpiresAt);
    const hasAutoPublished = useRef(false);
    const previewText = String(content || "").trim()
        ? `${safeUnicodeSlice(content, 140)}${getUnicodeLength(content) > 140 ? "..." : ""}`
        : audio ? "Audio confession" : "";

    // Auto-publish when countdown hits zero
    useEffect(() => {
        if (msLeft <= 0 && !hasAutoPublished.current) {
            hasAutoPublished.current = true;
            onConfirm(confessionId);
        }
    }, [msLeft, confessionId, onConfirm]);

    if (!confession) return null;

    const circumference = 2 * Math.PI * 28;
    const dashOffset = circumference * (1 - Math.max(0, Math.min(1, progress)));
    const isUrgent = msLeft < 60000;

    return (
        <div className="schedule-confirm-overlay" role="alertdialog" aria-modal="true" aria-labelledby="schedule-confirm-title">
            <div className="schedule-confirm-modal">
                <div className="schedule-confirm-clock">
                    <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
                        <circle
                            cx="36" cy="36" r="28"
                            fill="none"
                            stroke="rgba(126,136,255,0.15)"
                            strokeWidth="5"
                        />
                        <circle
                            cx="36" cy="36" r="28"
                            fill="none"
                            stroke={isUrgent ? "#e57b54" : "#7e88ff"}
                            strokeWidth="5"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1s linear, stroke 0.3s ease" }}
                        />
                    </svg>
                    <div className="schedule-confirm-clock-label" style={{ color: isUrgent ? "#e57b54" : "#7e88ff" }}>
                        <Clock size={14} strokeWidth={2} aria-hidden="true" />
                        <span>{minutes}:{String(seconds).padStart(2, "0")}</span>
                    </div>
                </div>

                <h2 id="schedule-confirm-title" className="schedule-confirm-title">
                    Your scheduled confession is ready
                </h2>
                <p className="schedule-confirm-sub">
                    Post it now, or delete it forever. It auto-posts when the timer ends.
                </p>

                <blockquote className="schedule-confirm-preview">
                    &ldquo;{previewText}&rdquo;
                </blockquote>

                <div className="schedule-confirm-actions">
                    <button
                        type="button"
                        className="schedule-confirm-btn schedule-confirm-btn--post"
                        onClick={() => onConfirm(confessionId)}
                    >
                        <CheckCircle size={16} strokeWidth={2} aria-hidden="true" />
                        Post it
                    </button>
                    <button
                        type="button"
                        className="schedule-confirm-btn schedule-confirm-btn--delete"
                        onClick={() => onCancel(confessionId)}
                    >
                        <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
                        Delete it
                    </button>
                </div>
            </div>
        </div>
    );
}
