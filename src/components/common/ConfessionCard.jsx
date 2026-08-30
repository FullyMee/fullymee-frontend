import React, { memo } from 'react';
import { useNavigate } from "react-router-dom";
import { InlineSpinner } from '../loaders';
import { getAliasTone, getInitial } from '../../utils/presentation.js';
import UserAvatar from './UserAvatar.jsx';
import { formatRelativeTime } from '../../utils/time.js';
import { Heart, MessageSquare, Send } from "lucide-react";
import AudioPlayer from "../../features/confessions/components/AudioPlayer.jsx";
import ConfessionMoreMenu from "../../features/confessions/components/ConfessionMoreMenu.jsx";

const MemoizedConfessionCard = memo(({ 
    confession, 
    isDesktop,
    isLiked,
    isReacting,
    isSentRequest,
    onOpenView,
    onReact,
    onChatRequest,
    onDeleteConfession,
    currentAlias,
    user
}) => {
    const navigate = useNavigate();
    const isAuthor = (currentAlias && confession.alias === currentAlias) || (user && Number(confession.author) === Number(user.id || user.userId));

    if (!isDesktop) {
        return (
            <article className="room-mobile-redesign-card">
                <div
                    className="room-mobile-redesign-card__content-btn"
                    onClick={() => onOpenView(confession.confessionId)}
                    role="button"
                    tabIndex={0}
                    style={{ textAlign: "left", cursor: "pointer", display: "block", width: "100%", background: "none", border: "none", padding: 0 }}
                >
                    <div className="room-mobile-redesign-card__author-row">
                        <div
                            className="room-mobile-redesign-card__author-info"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/user/${confession.alias}`, { state: { profileUser: { username: confession.alias, isAlias: true } } });
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            <UserAvatar avatarId={confession.avatar} className="room-mobile-redesign-card__avatar" />
                            <strong className="room-mobile-redesign-card__alias">{confession.alias}</strong>
                            <svg className="room-mobile-redesign-card__sparkle" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2L14.09 8.26L20 9.27L15 14.14L16.18 21.02L12 17.77L7.82 21.02L9 14.14L4 9.27L9.91 8.26L12 2Z"/></svg>
                            <span className="room-mobile-redesign-card__meta">
                                {formatRelativeTime(confession.createdAt, { short: true, nowLabel: "now" })} {confession.audio ? "" : "· written"}
                            </span>
                        </div>
                        {isAuthor ? (
                            <ConfessionMoreMenu onDelete={() => onDeleteConfession?.(confession.confessionId)} />
                        ) : null}
                    </div>

                    {confession.content ? (
                        <div className={`room-mobile-redesign-card__body ${confession.audio ? "is-quoted" : "is-written"}`}>
                            {confession.audio ? `“${confession.content}”` : confession.content}
                        </div>
                    ) : null}
                </div>

                {confession.audio ? (
                    <div className="room-mobile-redesign-card__audio-wrapper">
                        <AudioPlayer
                            roomId={confession.roomId}
                            confessionId={confession.confessionId}
                            audio={confession.audio}
                            variant="mobile"
                        />
                    </div>
                ) : null}

                <div className="room-mobile-redesign-card__actions">
                    <div className="room-mobile-redesign-card__actions-left">
                        <button
                            type="button"
                            className={`room-mobile-redesign-card__stat${isLiked ? " is-liked" : ""}`}
                            onClick={(e) => { e.stopPropagation(); onReact("confession", confession.confessionId); }}
                            disabled={isReacting}
                            aria-label={isLiked ? "Unfelt fume" : "Felt fume"}
                        >
                            <Heart size={18} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 0 : 2} />
                            <span>{confession.reactionCount || 0}</span>
                        </button>
                        <button
                            type="button"
                            className="room-mobile-redesign-card__stat"
                            onClick={(e) => { e.stopPropagation(); onOpenView(confession.confessionId); }}
                        >
                            <MessageSquare size={18} strokeWidth={2} />
                            <span>{confession.replyCount || 0}</span>
                        </button>
                    </div>
                    <button
                        type="button"
                        className={`room-mobile-redesign-card__request${isSentRequest ? " is-sent" : ""}`}
                        onClick={(e) => { e.stopPropagation(); onChatRequest(confession); }}
                        aria-label="Send chat request"
                    >
                        <Send size={18} fill={isSentRequest ? "currentColor" : "none"} strokeWidth={isSentRequest ? 0 : 2} />
                    </button>
                </div>
            </article>
        );
    }

    const rootClass = "desktop-confession-card";
    const contentClass = "desktop-confession-card__content";
    
    return (
        <article className={rootClass}>
            <div
                className={contentClass}
                onClick={() => onOpenView(confession.confessionId)}
                role="button"
                tabIndex={0}
                style={{ textAlign: "left", cursor: "pointer", display: "block", width: "100%", background: "none", border: "none", padding: 0 }}
            >
                <div
                    className="room-confession-card__author"
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
                >
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/user/${confession.alias}`, { state: { profileUser: { username: confession.alias, isAlias: true } } });
                        }}
                        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
                    >
                        <UserAvatar avatarId={confession.avatar} className="confession-card__avatar" />
                        <div>
                            <strong>{confession.alias}</strong>
                            <span>{formatRelativeTime(confession.createdAt, { short: true, nowLabel: "now" })}</span>
                        </div>
                    </div>
                    {isAuthor ? (
                        <ConfessionMoreMenu onDelete={() => onDeleteConfession?.(confession.confessionId)} />
                    ) : null}
                </div>
                {confession.content ? <p>{confession.content}</p> : null}
            </div>

            {confession.audio ? (
                <AudioPlayer
                    roomId={confession.roomId}
                    confessionId={confession.confessionId}
                    audio={confession.audio}
                />
            ) : null}

            <div className="room-confession-card__actions">
                <button
                    type="button"
                    className={`room-confession-card__stat${isLiked ? " is-liked" : ""}`}
                    onClick={() => onReact("confession", confession.confessionId)}
                    disabled={isReacting}
                    aria-label={isLiked ? "Unlike confession" : "Like confession"}
                >
                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 0 : 2} />
                    <span>{confession.reactionCount || 0}</span>
                </button>
                <button
                    type="button"
                    className="room-confession-card__stat"
                    onClick={() => onOpenView(confession.confessionId)}
                >
                    <MessageSquare size={18} strokeWidth={2} />
                    <span>{confession.replyCount || 0}</span>
                </button>
                <button
                    type="button"
                    className={`room-confession-card__request${isSentRequest ? " is-sent" : ""}`}
                    onClick={() => onChatRequest(confession)}
                    aria-label="Send chat request"
                >
                    <Send size={18} fill={isSentRequest ? "currentColor" : "none"} strokeWidth={isSentRequest ? 0 : 2} />
                </button>
            </div>
        </article>
    );
});

MemoizedConfessionCard.displayName = "MemoizedConfessionCard";

export default MemoizedConfessionCard;
