import { Pause, HeartCrack, Archive, Flag, Settings, ChevronRight, X } from "lucide-react";

const ACTIONS = [
    {
        id: "pause",
        title: "Pause conversation",
        description: "Take a break without ending anything",
        Icon: Pause,
        tone: "neutral"
    },
    {
        id: "end",
        title: "End connection",
        description: "Close this conversation quietly and respectfully",
        Icon: HeartCrack,
        tone: "accent"
    },
    {
        id: "archive",
        title: "Archive",
        description: "Only affects your inbox",
        Icon: Archive,
        tone: "neutral"
    },
    {
        id: "report",
        title: "Report",
        description: "Closes the conversation and alerts moderators",
        Icon: Flag,
        tone: "neutral"
    },
    {
        id: "settings",
        title: "Conversation settings",
        description: "Notifications, nickname, appearance",
        Icon: Settings,
        tone: "neutral"
    }
];

export default function ManageConnectionSheet({
    open,
    onClose,
    onSelect,
    busyAction = null,
    isPaused = false,
    isPausedByMe = true,
    isArchived = false,
    isEnded = false
}) {
    if (!open) return null;

    const actions = ACTIONS.map((action) => {
        if (isEnded) {
            if (action.id === "archive" && isArchived) {
                return {
                    ...action,
                    id: "unarchive",
                    title: "Unarchive",
                    description: "Move back to your active inbox"
                };
            }
            if (action.id === "archive") {
                return action;
            }
            return {
                ...action,
                disabled: true,
                description: "This conversation has ended"
            };
        }
        if (action.id === "pause" && isPaused) {
            if (isPausedByMe) {
                return {
                    ...action,
                    title: "Resume conversation",
                    description: "Re-enable messaging for both users"
                };
            }
            return {
                ...action,
                title: "Conversation paused",
                description: "Only the person who paused can resume",
                disabled: true
            };
        }
        if (action.id === "archive" && isArchived) {
            return {
                ...action,
                id: "unarchive",
                title: "Unarchive",
                description: "Move back to your active inbox"
            };
        }
        return action;
    });

    return (
        <div
            className="connection-sheet-backdrop"
            role="presentation"
            onClick={onClose}
        >
            <div
                className="connection-sheet connection-sheet--manage"
                role="dialog"
                aria-modal="true"
                aria-labelledby="manage-connection-title"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="connection-sheet__handle-wrap" aria-hidden="true">
                    <span className="connection-sheet__handle" />
                </div>

                <header className="connection-sheet__header">
                    <div className="connection-sheet__title-row">
                        <h2 id="manage-connection-title" className="connection-sheet__title">
                            Manage connection
                        </h2>
                        <button
                            type="button"
                            className="connection-sheet__close-btn"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <X size={18} strokeWidth={2} />
                        </button>
                    </div>
                    <p className="connection-sheet__subtitle">
                        {isEnded ? "This conversation has come to an end." : "Nothing here reveals who you are."}
                    </p>
                </header>

                {isEnded && (
                    <div style={{
                        margin: "0.5rem 1.25rem 0.25rem",
                        padding: "0.85rem 1rem",
                        borderRadius: "14px",
                        background: "rgba(224, 76, 92, 0.12)",
                        border: "1px solid rgba(224, 76, 92, 0.3)",
                        color: "#991b1b",
                        fontSize: "0.88rem",
                        lineHeight: "1.4",
                        textAlign: "center"
                    }}>
                        <strong style={{ display: "block", fontSize: "0.92rem", fontWeight: 700, color: "#991b1b" }}>
                            This conversation has ended.
                        </strong>
                        <p style={{ margin: "4px 0 0", color: "#991b1b", opacity: 0.9, fontSize: "0.82rem" }}>
                            No further actions can be taken for this connection.
                        </p>
                    </div>
                )}

                <div className="connection-sheet__actions">
                    {actions.map(({ id, title, description, Icon, tone, disabled }) => {
                        const isBusy = busyAction === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                className={`connection-sheet__action connection-sheet__action--${tone}${disabled ? " is-disabled" : ""}`}
                                onClick={() => !disabled && onSelect && onSelect(id)}
                                disabled={Boolean(busyAction) || Boolean(disabled)}
                                style={disabled ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
                            >
                                <span className={`connection-sheet__action-icon connection-sheet__action-icon--${tone}`}>
                                    <Icon size={18} strokeWidth={1.85} />
                                </span>
                                <span className="connection-sheet__action-copy">
                                    <strong>{title}</strong>
                                    <small>{description}</small>
                                </span>
                                <ChevronRight
                                    className="connection-sheet__action-chevron"
                                    size={18}
                                    strokeWidth={1.8}
                                    aria-hidden="true"
                                />
                                {isBusy && <span className="connection-sheet__action-busy" aria-hidden="true" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
