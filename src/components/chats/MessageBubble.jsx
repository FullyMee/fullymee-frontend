import React, { memo } from 'react';
import { getInitial } from '../../utils/presentation.js';
import UserAvatar from '../common/UserAvatar.jsx';

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

const MemoizedMessageBubble = memo(({ message, isMine, title, avatarTone, avatar, isDesktop }) => {
    if (isDesktop) {
        return (
            <article className={`desktop-chat-message${isMine ? " is-mine" : ""}`}>
                {!isMine && (
                    <UserAvatar avatarId={avatar} className="desktop-chat-avatar" />
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
                <UserAvatar avatarId={avatar} className="chat-thread-bubble__author-avatar" style={{width: "24px", height: "24px", borderRadius: "50%", marginRight: "8px"}} />
            )}
            <p>{message.content}</p>
            <small>{formatMessageTime(message.createdAt)}</small>
        </article>
    );
});

MemoizedMessageBubble.displayName = "MemoizedMessageBubble";

export default MemoizedMessageBubble;
