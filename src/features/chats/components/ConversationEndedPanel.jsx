import { Leaf, Archive, Trash2 } from "lucide-react";
import { DEFAULT_CLOSING_NOTE_TEXT } from "../constants/closingNotes.js";

export default function ConversationEndedPanel({
    closingNoteText = DEFAULT_CLOSING_NOTE_TEXT,
    onArchive,
    onDelete,
    archiving = false,
    deleting = false,
    showDelete = true,
    isInitiator = true
}) {
    return (
        <div className="conversation-ended" role="status" aria-live="polite">
            <div className="conversation-ended__divider" aria-hidden="true" />
            <div className="conversation-ended__card">
                <div className="conversation-ended__leaf-icon" aria-hidden="true">
                    <Leaf size={20} strokeWidth={1.8} />
                </div>

                <h3 className="conversation-ended__title">
                    {isInitiator ? "You closed this conversation" : "This conversation has ended"}
                </h3>
                <p className="conversation-ended__subtext">
                    It ended quietly. They were never told who closed it.
                </p>

                {closingNoteText && (
                    <div className="conversation-ended__note-pill">
                        <span>&ldquo;{closingNoteText}&rdquo;</span>
                    </div>
                )}

                <div className="conversation-ended__actions">
                    <button
                        type="button"
                        className="conversation-ended__btn conversation-ended__btn--primary"
                        onClick={onArchive}
                        disabled={archiving || deleting}
                    >
                        <Archive size={15} />
                        <span>{archiving ? "Archiving…" : "Archive"}</span>
                    </button>
                    {showDelete && (
                        <button
                            type="button"
                            className="conversation-ended__btn conversation-ended__btn--ghost"
                            onClick={onDelete}
                            disabled={archiving || deleting}
                        >
                            <Trash2 size={15} />
                            <span>{deleting ? "Removing…" : "Delete"}</span>
                        </button>
                    )}
                </div>

                <div className="conversation-ended__reconnect-info">
                    <p>A new connection can be requested in 30 days &middot; once only</p>
                    <button type="button" className="conversation-ended__skip-link">
                        Skip ahead 30 days
                    </button>
                </div>
            </div>
        </div>
    );
}
