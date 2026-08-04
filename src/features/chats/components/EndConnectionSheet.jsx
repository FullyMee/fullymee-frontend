import { useEffect, useState } from "react";
import { EyeOff, ShieldCheck, Leaf, X } from "lucide-react";
import { CLOSING_NOTES, DEFAULT_CLOSING_NOTE_TEXT } from "../constants/closingNotes.js";

const ASSURANCES = [
    {
        id: "anonymous-exit",
        Icon: EyeOff,
        text: "The other person won't know who ended it."
    },
    {
        id: "identity",
        Icon: ShieldCheck,
        text: "Your identities stay anonymous — always."
    },
    {
        id: "past",
        Icon: Leaf,
        text: "The chat moves to your past conversations."
    }
];

export default function EndConnectionSheet({
    open,
    onClose,
    onConfirm,
    submitting = false
}) {
    const [selectedNoteId, setSelectedNoteId] = useState(null);

    useEffect(() => {
        if (!open) {
            setSelectedNoteId(null);
        }
    }, [open]);

    if (!open) return null;

    function handleConfirm() {
        if (submitting) return;
        onConfirm && onConfirm({ closingNoteId: selectedNoteId });
    }

    return (
        <div
            className="connection-sheet-backdrop"
            role="presentation"
            onClick={onClose}
        >
            <div
                className="connection-sheet connection-sheet--end"
                role="dialog"
                aria-modal="true"
                aria-labelledby="end-connection-title"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="connection-sheet__handle-wrap" aria-hidden="true">
                    <span className="connection-sheet__handle" />
                </div>

                <div className="connection-sheet__scroll">
                    <header className="connection-sheet__header connection-sheet__header--end">
                        <div className="connection-sheet__title-row">
                            <h2 id="end-connection-title" className="connection-sheet__title">
                                End this conversation?
                            </h2>
                            <button
                                type="button"
                                className="connection-sheet__close-btn"
                                onClick={onClose}
                                aria-label="Close"
                                disabled={submitting}
                            >
                                <X size={18} strokeWidth={2} />
                            </button>
                        </div>
                        <p className="connection-sheet__lede">
                            Sometimes conversations naturally come to an end. You can quietly close this connection — no blocking, no confrontation.
                        </p>
                    </header>

                    <ul className="connection-sheet__assurances">
                        {ASSURANCES.map(({ id, Icon, text }) => (
                            <li key={id} className="connection-sheet__assurance">
                                <span className="connection-sheet__assurance-icon" aria-hidden="true">
                                    <Icon size={15} strokeWidth={1.9} />
                                </span>
                                <span>{text}</span>
                            </li>
                        ))}
                    </ul>

                    <section className="connection-sheet__notes">
                        <div className="connection-sheet__notes-head">
                            <h3>Leave a closing note</h3>
                            <span>Optional</span>
                        </div>
                        <p className="connection-sheet__notes-hint">
                            Choose one of these to soften the goodbye. Custom messages aren&apos;t allowed.
                        </p>

                        <div className="connection-sheet__note-list" role="radiogroup" aria-label="Closing note">
                            {CLOSING_NOTES.map((note) => {
                                const selected = selectedNoteId === note.id;
                                return (
                                    <button
                                        key={note.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        className={`connection-sheet__note${selected ? " is-selected" : ""}`}
                                        onClick={() => setSelectedNoteId(selected ? null : note.id)}
                                        disabled={submitting}
                                    >
                                        <span className="connection-sheet__note-emoji" aria-hidden="true">
                                            {note.emoji}
                                        </span>
                                        <span className="connection-sheet__note-text">{note.text}</span>
                                        <span className={`connection-sheet__note-radio${selected ? " is-on" : ""}`} aria-hidden="true">
                                            {selected ? <span /> : null}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <p className="connection-sheet__notes-fallback">
                            No note selected? They&apos;ll simply see &lsquo;{DEFAULT_CLOSING_NOTE_TEXT}&rsquo;
                        </p>
                    </section>
                </div>

                <footer className="connection-sheet__footer">
                    <button
                        type="button"
                        className="connection-sheet__btn connection-sheet__btn--ghost"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="connection-sheet__btn connection-sheet__btn--danger"
                        onClick={handleConfirm}
                        disabled={submitting}
                    >
                        {submitting ? "Ending…" : "End conversation"}
                    </button>
                </footer>
            </div>
        </div>
    );
}
