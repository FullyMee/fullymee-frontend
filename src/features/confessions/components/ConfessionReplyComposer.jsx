import React from "react";
import { InlineSpinner } from "../../../components/common/LoadingStates.jsx";
import { getAliasTone, getInitial } from "../../../utils/presentation.js";
import { Send } from "lucide-react";

const QUICK_EMOJIS = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"];

export default function ConfessionReplyComposer({
    isDesktop = false,
    userLabel = "you",
    value,
    posting = false,
    disabled = false,
    onChange,
    onSubmit
}) {
    const handleQuickEmojiSelect = (emoji) => {
        const nextValue = value ? `${value} ${emoji}` : emoji;
        onChange(nextValue);
    };

    if (isDesktop) {
        return (
            <div className="desktop-reply-composer-wrap">
                {/* Quick Emoji Reaction Row */}
                <div className="confession-quick-emojis-bar">
                    {QUICK_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            className="confession-quick-emoji-btn"
                            onClick={() => handleQuickEmojiSelect(emoji)}
                            aria-label={`Add ${emoji}`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>

                <div className="desktop-reply-composer" role="group" aria-label="Write a comment">
                    <div className={`confession-reply-bar__avatar confession-detail-card__avatar--${getAliasTone(userLabel)}`}>
                        {getInitial(userLabel)}
                    </div>

                    <div className="desktop-reply-input-box">
                        <input
                            type="text"
                            value={value}
                            onChange={(event) => onChange(event.target.value)}
                            placeholder="Join the conversation..."
                            maxLength={1500}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey && !disabled) {
                                    e.preventDefault();
                                    onSubmit();
                                }
                            }}
                        />

                        <button
                            type="button"
                            className="composer-send-btn"
                            disabled={disabled}
                            onClick={onSubmit}
                            aria-label="Send comment"
                        >
                            {posting ? (
                                <InlineSpinner size="sm" tone="light" label="Posting" />
                            ) : (
                                <Send size={16} strokeWidth={2.2} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="confession-reply-bottom-container">
            {/* Quick Emoji Reaction Row */}
            <div className="confession-quick-emojis-bar" aria-label="Quick emoji reactions">
                {QUICK_EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        className="confession-quick-emoji-btn"
                        onClick={() => handleQuickEmojiSelect(emoji)}
                        aria-label={`Add ${emoji}`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            {/* Clean Input Bar */}
            <div className="confession-reply-bar">
                <div className={`confession-reply-bar__avatar confession-detail-card__avatar--${getAliasTone(userLabel)}`}>
                    {getInitial(userLabel)}
                </div>

                <div className="confession-reply-input-wrapper">
                    <input
                        type="text"
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        placeholder="Join the conversation..."
                        maxLength={1500}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && !disabled) {
                                e.preventDefault();
                                onSubmit();
                            }
                        }}
                    />

                    <button
                        type="button"
                        className="composer-send-btn"
                        disabled={disabled}
                        onClick={onSubmit}
                        aria-label="Post comment"
                    >
                        {posting ? (
                            <InlineSpinner size="sm" tone="light" label="Posting" />
                        ) : (
                            <Send size={16} strokeWidth={2.2} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
