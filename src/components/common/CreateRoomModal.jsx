import { useEffect } from "react";
import { createPortal } from "react-dom";
import InlineError from "./InlineError.jsx";
import { InlineSpinner } from "./LoadingStates.jsx";
import { ArrowLeft, Check, Globe, Lock, RefreshCcw } from "lucide-react";

export default function CreateRoomModal({
    open,
    roomType,
    roomTitle,
    roomDescription,
    joinCode,
    createErrors,
    submitting,
    createDisabled,
    roomTitleLimit = 50,
    roomDescriptionLimit = 50,
    onClose,
    onSubmit,
    onRoomTitleChange,
    onRoomDescriptionChange,
    onRoomTypeChange,
    onJoinCodeChange,
    onGenerateJoinCode
}) {
    useEffect(() => {
        if (!open || typeof document === "undefined") return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div className="discover-create-screen" role="dialog" aria-modal="true" aria-labelledby="create-room-title">
            <form className="discover-create-screen__shell" onSubmit={onSubmit}>
                <header className="discover-create-screen__header">
                    <button type="button" className="discover-create-screen__back" onClick={onClose}>
                        <ArrowLeft size={20} strokeWidth={2} />
                    </button>
                    <h2 id="create-room-title">Create Room</h2>
                    <button
                        type="submit"
                        className="discover-create-screen__submit"
                        disabled={createDisabled}
                    >
                        {submitting ? (
                            <>
                                <InlineSpinner size="sm" tone="light" label="Creating room" />
                                <span>Creating...</span>
                            </>
                        ) : "Create"}
                    </button>
                </header>

                <div className="discover-create-screen__content">
                    <section className="discover-create-screen__intro">
                        <span className="discover-create-screen__eyebrow">Create room</span>
                        <h3>
                            Start a new <em>anonymous</em> space
                        </h3>
                    </section>

                    <label className="discover-create-screen__field">
                        <div className="discover-create-screen__field-head">
                            <span>Room title</span>
                            <small>Name</small>
                        </div>
                        <input
                            type="text"
                            value={roomTitle}
                            onChange={(event) => onRoomTitleChange(event.target.value)}
                            placeholder="Late Night Musings"
                            maxLength={roomTitleLimit}
                            aria-invalid={createErrors.roomTitle ? "true" : "false"}
                        />
                        <InlineError error={createErrors.roomTitle} className="discover-create-screen__error" />
                        <div className="discover-create-screen__field-meta">
                            <small>Keep it short and clear.</small>
                            <small>{String(roomTitle || "").length}/{roomTitleLimit}</small>
                        </div>
                    </label>

                    <label className="discover-create-screen__field">
                        <div className="discover-create-screen__field-head">
                            <span>Description</span>
                            <small>Optional</small>
                        </div>
                        <textarea
                            value={roomDescription}
                            onChange={(event) => onRoomDescriptionChange(event.target.value)}
                            placeholder="What is this room about?"
                            maxLength={roomDescriptionLimit}
                        />
                        <div className="discover-create-screen__field-meta">
                            <small>Add a short context line.</small>
                            <small>{String(roomDescription || "").length}/{roomDescriptionLimit}</small>
                        </div>
                    </label>

                    <section className="discover-create-screen__section">
                        <div className="discover-create-screen__section-head">
                            <h3>Privacy</h3>
                            <p>Choose who can join.</p>
                        </div>
                        <div className="discover-create-screen__privacy-list">
                            <button
                                type="button"
                                className={`discover-create-screen__option${roomType === "public" ? " is-selected" : ""}`}
                                onClick={() => onRoomTypeChange("public")}
                            >
                                <span className="discover-create-screen__option-icon">
                                    <Globe size={20} strokeWidth={2} />
                                </span>
                                <span className="discover-create-screen__option-copy">
                                    <strong>Public Room</strong>
                                    <small>Anyone can join.</small>
                                </span>
                                {roomType === "public" && (
                                    <span className="discover-create-screen__option-check">
                                        <Check size={18} strokeWidth={2.5} />
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                className={`discover-create-screen__option${roomType === "private" ? " is-selected" : ""}`}
                                onClick={() => onRoomTypeChange("private")}
                            >
                                <span className="discover-create-screen__option-icon">
                                    <Lock size={20} strokeWidth={2} />
                                </span>
                                <span className="discover-create-screen__option-copy">
                                    <strong>Private Room</strong>
                                    <small>Join with a code.</small>
                                </span>
                                {roomType === "private" && (
                                    <span className="discover-create-screen__option-check">
                                        <Check size={18} strokeWidth={2.5} />
                                    </span>
                                )}
                            </button>
                        </div>
                    </section>

                    {roomType === "private" && (
                        <label className="discover-create-screen__field">
                            <div className="discover-create-screen__field-head">
                                <span>Join code</span>
                                <small>6 digits</small>
                            </div>
                            <div className="discover-create-screen__code-row">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={joinCode}
                                    onChange={(event) => onJoinCodeChange(event.target.value)}
                                    placeholder="Enter a 6 digit code"
                                    maxLength={6}
                                    aria-invalid={createErrors.joinCode ? "true" : "false"}
                                />
                                <button
                                    type="button"
                                    className="discover-create-screen__code-generate"
                                    onClick={onGenerateJoinCode}
                                    aria-label="Generate join code"
                                >
                                    <RefreshCcw size={18} strokeWidth={2} />
                                    <span>Generate</span>
                                </button>
                            </div>
                            <InlineError error={createErrors.joinCode} className="discover-create-screen__error" />
                            <div className="discover-create-screen__field-meta">
                                <small>Enter or generate a code.</small>
                                <small>{String(joinCode || "").length}/6</small>
                            </div>
                        </label>
                    )}

                    <div className="discover-create-screen__footer">
                        <p className="discover-create-screen__footer-note">
                            {roomType === "private"
                                ? "Only invited people can join."
                                : "This room will appear in Discover."}
                        </p>
                        <button
                            type="submit"
                            className="discover-create-screen__submit discover-create-screen__submit--primary"
                            disabled={createDisabled}
                        >
                            {submitting ? (
                                <>
                                    <InlineSpinner size="sm" tone="light" label="Creating room" />
                                    <span>Creating room...</span>
                                </>
                            ) : "Create room"}
                        </button>
                    </div>
                </div>
            </form>
        </div>,
        document.body
    );
}
