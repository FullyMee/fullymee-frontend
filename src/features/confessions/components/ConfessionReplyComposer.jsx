import { InlineSpinner } from "../../../components/common/LoadingStates.jsx";
import { getAliasTone, getInitial } from "../../../utils/presentation.js";
import { Send } from "lucide-react";

export default function ConfessionReplyComposer({
    isDesktop = false,
    userLabel = "you",
    value,
    posting = false,
    disabled = false,
    onChange,
    onSubmit
}) {
    if (isDesktop) {
        return (
            <div className="desktop-reply-composer" role="group" aria-label="Write a comment">
                <input
                    type="text"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Share your Thoughts..."
                    maxLength={1500}
                />
                <button type="button" disabled={disabled} onClick={onSubmit} aria-label="Send comment">
                    {posting
                        ? <InlineSpinner size="sm" tone="light" label="Posting reply" />
                        : <Send size={18} strokeWidth={2} />}
                </button>
            </div>
        );
    }

    return (
        <div className="confession-reply-bar">
            <div className={`confession-reply-bar__avatar confession-detail-card__avatar--${getAliasTone(userLabel)}`}>
                {getInitial(userLabel)}
            </div>
            <input
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Write with care..."
                maxLength={1500}
            />
            <button type="button" disabled={disabled} onClick={onSubmit} aria-label="Send reply">
                {posting
                    ? <InlineSpinner size="sm" tone="light" label="Posting reply" />
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>}
            </button>
        </div>
    );
}
