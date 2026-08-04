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

export default function ManageConnectionSheet({ open, onClose, onSelect, busyAction = null, isPaused = false }) {
    if (!open) return null;

    const actions = ACTIONS.map((action) => {
        if (action.id === "pause" && isPaused) {
            return {
                ...action,
                title: "Resume conversation",
                description: "Re-enable messaging for both users"
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
                        Nothing here reveals who you are.
                    </p>
                </header>

                <div className="connection-sheet__actions">
                    {actions.map(({ id, title, description, Icon, tone }) => {
                        const isBusy = busyAction === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                className={`connection-sheet__action connection-sheet__action--${tone}`}
                                onClick={() => onSelect && onSelect(id)}
                                disabled={Boolean(busyAction)}
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
