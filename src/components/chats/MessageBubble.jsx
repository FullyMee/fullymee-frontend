import React, { memo } from 'react';
import { getInitial } from '../../utils/presentation.js';

function formatMessageTime(value) {
    if (!value) return "now";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "now";
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit"
    }).format(date);
}

function formatDesktopDateLabel(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

const MemoizedMessageBubble = memo(({ message, isMine, title, avatar, avatarTone, isDesktop }) => {
    if (isDesktop) {
        return (
            <article className={`desktop-chat-message${isMine ? " is-mine" : ""}`}>
                {!isMine && (
                    <div className={`desktop-chat-avatar desktop-chat-avatar--${avatarTone}`}>
                        <span>{avatar ? avatar : getInitial(title)}</span>
                    </div>
                )}
                <div className="desktop-chat-message__stack">
                    <div className={`desktop-chat-message__bubble${isMine ? " is-mine" : ""}`}>
                        <p>{message.content}</p>
                    </div>
                    <small>{formatDesktopDateLabel(message.createdAt) || formatMessageTime(message.createdAt)}</small>
                </div>
            </article>
        );
    }
    
    return (
        <article
            className={`chat-thread-bubble${isMine ? " is-mine" : ""}`}
        >
            {!isMine && (
                <span className="chat-thread-bubble__author">
                    {avatar ? avatar : getInitial(title)}
                </span>
            )}
            <p>{message.content}</p>
            <small>{formatMessageTime(message.createdAt)}</small>
        </article>
    );
});

MemoizedMessageBubble.displayName = "MemoizedMessageBubble";

export default MemoizedMessageBubble;
