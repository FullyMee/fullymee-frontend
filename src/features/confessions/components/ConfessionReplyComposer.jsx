import React from "react";
import { InlineSpinner } from "../../../components/loaders";
import { getAliasTone, getInitial } from "../../../utils/presentation.js";
import UserAvatar from "../../../components/common/UserAvatar.jsx";
import { Send, X, CornerDownRight } from "lucide-react";

export default function ConfessionReplyComposer({
    isDesktop = false,
    userLabel = "you",
    avatar,
    value,
    posting = false,
    disabled = false,
    onChange,
    onSubmit,
    inputRef,
    replyingToAlias,
    onCancelReplyTo,
    onFocus,
    onBlur
}) {
    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!disabled && String(value || "").trim()) {
            onSubmit();
        }
    };

    const replyingBanner = replyingToAlias ? (
        <div className="confession-replying-to-banner">
            <div className="confession-replying-to-banner__info">
                <CornerDownRight size={14} className="confession-replying-to-banner__icon" />
                <span>Replying to <strong>@{replyingToAlias}</strong></span>
            </div>
            <button
                type="button"
                className="confession-replying-to-cancel"
                onClick={onCancelReplyTo}
                aria-label="Cancel reply"
            >
                <X size={14} />
            </button>
        </div>
    ) : null;

    if (isDesktop) {
        return (
            <div className="desktop-reply-composer-wrap">
                {replyingBanner}

                <form className="desktop-reply-composer" autoComplete="off" onSubmit={handleFormSubmit} role="group" aria-label="Write a comment">
                    <UserAvatar avatarId={avatar} className="confession-reply-bar__avatar" />

                    <div className="desktop-reply-input-box">
                        <input
                            ref={inputRef}
                            type="search"
                            name="comment_message_desktop"
                            value={value}
                            onChange={(event) => onChange(event.target.value)}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            placeholder={replyingToAlias ? `Reply to @${replyingToAlias}...` : "Join the conversation..."}
                            maxLength={1500}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="sentences"
                            spellCheck={true}
                            enterKeyHint="send"
                            inputMode="text"
                            data-lpignore="true"
                            data-form-type="other"
                            data-1p-ignore="true"
                        />

                        <button
                            type="submit"
                            className="composer-send-btn"
                            disabled={disabled}
                            aria-label="Send comment"
                        >
                            {posting ? (
                                <InlineSpinner size="sm" tone="light" label="Posting" />
                            ) : (
                                <Send size={16} strokeWidth={2.2} />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="confession-reply-bottom-container">
            {replyingBanner}

            {/* Clean Input Bar */}
            <form className="confession-reply-bar" autoComplete="off" onSubmit={handleFormSubmit}>
                <UserAvatar avatarId={avatar} className="confession-reply-bar__avatar" />

                <div className="confession-reply-input-wrapper">
                    <input
                        ref={inputRef}
                        type="search"
                        name="comment_message"
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        placeholder={replyingToAlias ? `Reply to @${replyingToAlias}...` : "Join the conversation..."}
                        maxLength={1500}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="sentences"
                        spellCheck={true}
                        enterKeyHint="send"
                        inputMode="text"
                        data-lpignore="true"
                        data-form-type="other"
                        data-1p-ignore="true"
                    />

                    <button
                        type="submit"
                        className="composer-send-btn"
                        disabled={disabled}
                        aria-label="Post comment"
                    >
                        {posting ? (
                            <InlineSpinner size="sm" tone="light" label="Posting" />
                        ) : (
                            <Send size={16} strokeWidth={2.2} />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
