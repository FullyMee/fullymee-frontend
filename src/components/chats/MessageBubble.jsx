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

function MessageStatusIcon({ status }) {
    if (status === "read") {
        return (
            <span title="Read" style={{ display: "inline-flex", alignItems: "center", marginLeft: "4px", verticalAlign: "middle", color: "#38bdf8" }}>
                <svg width="15" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 5.5L4.5 9L11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 5.5L8.5 9L15 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </span>
        );
    }
    if (status === "delivered") {
        return (
            <span title="Delivered" style={{ display: "inline-flex", alignItems: "center", marginLeft: "4px", verticalAlign: "middle", opacity: 0.7 }}>
                <svg width="15" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 5.5L4.5 9L11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 5.5L8.5 9L15 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </span>
        );
    }
    if (status === "sent") {
        return (
            <span title="Sent" style={{ display: "inline-flex", alignItems: "center", marginLeft: "4px", verticalAlign: "middle", opacity: 0.7 }}>
                <svg width="11" height="11" viewBox="0 0 12 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 5.5L4.5 9L11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </span>
        );
    }
    return (
        <span title="Sending..." style={{ display: "inline-flex", alignItems: "center", marginLeft: "4px", verticalAlign: "middle", opacity: 0.5 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>
        </span>
    );
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
                    <small>
                        {formatDesktopDateLabel(message.createdAt) || formatMessageTime(message.createdAt)}
                        {isMine && <MessageStatusIcon status={message.status} />}
                    </small>
                </div>
            </article>
        );
    }
    
    return (
        <article
            className={`chat-thread-bubble${isMine ? " is-mine" : ""}`}
            style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
        >
            {!isMine && (
                <UserAvatar avatarId={avatar} className="chat-thread-bubble__author-avatar" style={{width: "24px", height: "24px", borderRadius: "50%", marginRight: "8px"}} />
            )}
            <p style={{ wordBreak: "break-word", overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{message.content}</p>
            <small>
                {formatMessageTime(message.createdAt)}
                {isMine && <MessageStatusIcon status={message.status} />}
            </small>
        </article>
    );
});

MemoizedMessageBubble.displayName = "MemoizedMessageBubble";

export default MemoizedMessageBubble;
