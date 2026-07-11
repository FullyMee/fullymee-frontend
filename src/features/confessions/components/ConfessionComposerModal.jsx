import { useEffect, useState } from "react";
import { RefreshCw, Clock, Mic, Type, X } from "lucide-react";
import { InlineSpinner } from "../../../components/common/LoadingStates.jsx";
import AudioConfessionRecorder from "./AudioConfessionRecorder.jsx";
import {
    formatCompactMemberCount,
    getRoomTone,
    RoomGlyphIcon
} from "../../../components/common/MobileRoomVisuals.jsx";
import { ArrowLeftIcon, ShieldIcon } from "./ConfessionIcons.jsx";

const SCHEDULE_OPTIONS = [
    { label: "2 hours", getDate: () => new Date(Date.now() + 2 * 60 * 60 * 1000) },
    { label: "8 hours", getDate: () => new Date(Date.now() + 8 * 60 * 60 * 1000) },
    { label: "24 hours", getDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
    {
        label: "Midnight",
        getDate: () => {
            const d = new Date();
            d.setHours(24, 0, 0, 0);
            if (d.getTime() - Date.now() < 5 * 60 * 1000) {
                d.setDate(d.getDate() + 1);
            }
            return d;
        }
    }
];

function formatCountdown(date, now = Date.now()) {
    if (!date) return "";
    const ms = new Date(date).getTime() - now;
    if (ms <= 0) return "now";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 0) return `in ${h}h ${m}m`;
    return `in ${m}m`;
}

export default function ConfessionComposerModal({
    room,
    draft,
    posting,
    onDraftChange,
    onClose,
    onSubmit,
    onShuffle,
    shufflingAlias,
    selectedScheduledAt,
    onScheduleSelect,
    confessionMode = "text",
    onConfessionModeChange,
    audioToken,
    audioTokenLoading,
    onFetchAudioToken,
    onAudioReady,
    audioReady
}) {
    const [now, setNow] = useState(() => Date.now());
    const isScheduled = !!selectedScheduledAt;

    useEffect(() => {
        if (!isScheduled) return undefined;
        const timer = window.setInterval(() => setNow(Date.now()), 30000);
        return () => window.clearInterval(timer);
    }, [isScheduled]);

    if (!room) return null;

    const alias = String(room.alias || "").trim();
    const isAudioMode = confessionMode === "audio";
    const hasDraft = !!String(draft || "").trim();
    const canSubmit = isAudioMode ? audioReady && hasDraft : hasDraft;

    return (
        <div className="room-post-modal" role="dialog" aria-modal="true" aria-labelledby="room-post-title">
            <form className="room-post-modal__sheet" onSubmit={onSubmit}>
                <header className="room-post-modal__header">
                    <button type="button" onClick={onClose}>
                        <ArrowLeftIcon />
                        <span>Cancel</span>
                    </button>
                    <button
                        type="submit"
                        className="room-post-modal__submit"
                        disabled={posting || !canSubmit}
                    >
                        {posting ? (
                            <>
                                <InlineSpinner size="sm" tone="light" label="Posting confession" />
                                <span>{isScheduled ? "Scheduling..." : "Posting..."}</span>
                            </>
                        ) : isScheduled ? `Schedule ${formatCountdown(selectedScheduledAt, now)}` : "Post"}
                    </button>
                </header>

                <div className="room-post-modal__body">
                    <section className="room-post-modal__privacy">
                        <ShieldIcon />
                        <div>
                            <strong>Share freely. Your identity stays anonymous.</strong>
                            <span>No one can trace this confession back to you</span>
                        </div>
                    </section>

                    {alias && (
                        <section className="room-post-modal__identity" aria-label="Your anonymous identity">
                            <div className="room-post-modal__identity-info">
                                <span className="room-post-modal__identity-label">Posting as</span>
                                <strong className="room-post-modal__identity-alias">{alias}</strong>
                            </div>
                            {typeof onShuffle === "function" && (
                                <button
                                    type="button"
                                    className="room-post-modal__shuffle-btn"
                                    onClick={onShuffle}
                                    disabled={shufflingAlias}
                                    aria-label="Shuffle identity"
                                >
                                    <RefreshCw
                                        size={13}
                                        strokeWidth={2.2}
                                        style={shufflingAlias ? { animation: "room-shuffle-spin 0.7s linear infinite" } : undefined}
                                        aria-hidden="true"
                                    />
                                    <span>{shufflingAlias ? "Shuffling..." : "Shuffle"}</span>
                                </button>
                            )}
                        </section>
                    )}

                    <section className="room-post-modal__section">
                        <h2 id="room-post-title">Post in room</h2>
                        <article className="room-post-modal__room-card">
                            <div className={`room-post-modal__room-icon room-post-modal__room-icon--${getRoomTone(room)}`}>
                                <RoomGlyphIcon tone={getRoomTone(room)} />
                            </div>
                            <div className="room-post-modal__room-copy">
                                <strong>{room.title}</strong>
                                <span>{formatCompactMemberCount(room.currentUserCount)}</span>
                            </div>
                        </article>
                    </section>

                    <section className="room-post-modal__section">
                        <h2>Your confession</h2>
                        <div className="room-post-modal__mode-toggle" role="tablist" aria-label="Confession type">
                            <button
                                type="button"
                                className={confessionMode === "text" ? "is-active" : ""}
                                onClick={() => onConfessionModeChange?.("text")}
                            >
                                <Type size={14} />
                                <span>Text</span>
                            </button>
                            <button
                                type="button"
                                className={isAudioMode ? "is-active" : ""}
                                onClick={() => onConfessionModeChange?.("audio")}
                            >
                                <Mic size={14} />
                                <span>Audio</span>
                            </button>
                        </div>

                        {isAudioMode ? (
                            <>
                                <label className="room-post-modal__audio-title" htmlFor="audio-confession-title">
                                    <span>Audio title</span>
                                    <input
                                        id="audio-confession-title"
                                        type="text"
                                        value={draft}
                                        onChange={(event) => onDraftChange(event.target.value)}
                                        placeholder="Give your audio confession a title..."
                                        maxLength={80}
                                    />
                                </label>
                                <AudioConfessionRecorder
                                    token={audioToken}
                                    tokenLoading={audioTokenLoading}
                                    onFetchToken={onFetchAudioToken}
                                    onAudioReady={onAudioReady}
                                    ready={audioReady}
                                />
                                <div className="room-post-modal__footer">
                                    <span>Title helps others understand the audio</span>
                                    <strong>{String(draft || "").length}/80</strong>
                                </div>
                            </>
                        ) : (
                            <>
                                <label className="room-post-modal__editor" htmlFor="confession-compose">
                                    <textarea
                                        id="confession-compose"
                                        value={draft}
                                        onChange={(event) => onDraftChange(event.target.value)}
                                        placeholder="Share what's on your mind... This is a safe space to express yourself anonymously."
                                        maxLength={200}
                                    />
                                </label>
                                <div className="room-post-modal__footer">
                                    <span>Be honest and respectful</span>
                                    <strong>{String(draft || "").length}/200</strong>
                                </div>
                            </>
                        )}
                    </section>

                    {typeof onScheduleSelect === "function" && (
                        <section className="room-post-modal__schedule">
                            <div className="room-post-modal__schedule-header">
                                <Clock size={13} strokeWidth={2.2} aria-hidden="true" />
                                <span>Time-lock this confession</span>
                            </div>
                            <div className="room-post-modal__schedule-pills">
                                {SCHEDULE_OPTIONS.map((opt) => {
                                    const targetDate = opt.getDate();
                                    const isActive = isScheduled &&
                                        Math.abs(new Date(selectedScheduledAt).getTime() - targetDate.getTime()) < 60000;
                                    return (
                                        <button
                                            key={opt.label}
                                            type="button"
                                            className={`room-post-modal__schedule-pill${isActive ? " room-post-modal__schedule-pill--active" : ""}`}
                                            onClick={() => onScheduleSelect(isActive ? null : targetDate)}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                                {isScheduled && (
                                    <button
                                        type="button"
                                        className="room-post-modal__schedule-clear"
                                        onClick={() => onScheduleSelect(null)}
                                        aria-label="Clear schedule"
                                    >
                                        <X size={12} strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>
                            {isScheduled && (
                                <p className="room-post-modal__schedule-hint">
                                    Posts {formatCountdown(selectedScheduledAt, now)} — you can cancel before it goes live
                                </p>
                            )}
                        </section>
                    )}
                </div>
            </form>
        </div>
    );
}
