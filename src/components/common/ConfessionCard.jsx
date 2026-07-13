import React, { memo } from 'react';
import { InlineSpinner } from './LoadingStates.jsx';
import { getAliasTone, getInitial } from '../../utils/presentation.js';
import { formatRelativeTime } from '../../utils/time.js';
import { Heart, MessageSquare, Send } from "lucide-react";
import AudioPlayer from "../../features/confessions/components/AudioPlayer.jsx";

const MemoizedConfessionCard = memo(({ 
    confession, 
    isDesktop,
    isLiked,
    isReacting,
    isSentRequest,
    onOpenView,
    onReact,
    onChatRequest
}) => {
    if (!isDesktop) {
        return (
            <article className="room-mobile-redesign-card">
                <button
                    type="button"
                    className="room-mobile-redesign-card__content-btn"
                    onClick={() => onOpenView(confession.confessionId)}
                >
                    <div className="room-mobile-redesign-card__author-row">
                        <div className="room-mobile-redesign-card__author-info">
                            <div className={`room-mobile-redesign-card__avatar room-mobile-redesign-card__avatar--${getAliasTone(confession.alias)}`}>
                                {getInitial(confession.alias)}
                            </div>
                            <strong className="room-mobile-redesign-card__alias">{confession.alias}</strong>
                            <svg className="room-mobile-redesign-card__sparkle" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2L14.09 8.26L20 9.27L15 14.14L16.18 21.02L12 17.77L7.82 21.02L9 14.14L4 9.27L9.91 8.26L12 2Z"/></svg>
                            <span className="room-mobile-redesign-card__meta">
                                {formatRelativeTime(confession.createdAt, { short: true, nowLabel: "now" })} &bull; anonymous {confession.audio ? "" : "· written"}
                            </span>
                        </div>
                        <div className="room-mobile-redesign-card__more">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                        </div>
                    </div>

                    {confession.content ? (
                        <div className={`room-mobile-redesign-card__body ${confession.audio ? "is-quoted" : "is-written"}`}>
                            {confession.audio ? `“${confession.content}”` : confession.content}
                        </div>
                    ) : null}
                </button>

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
                            aria-label={isLiked ? "Unlike confession" : "Like confession"}
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
            <button
                type="button"
                className={contentClass}
                onClick={() => onOpenView(confession.confessionId)}
            >
                <div className="room-confession-card__author">
                    <div className={`room-confession-card__avatar room-confession-card__avatar--${getAliasTone(confession.alias)}`}>
                        {getInitial(confession.alias)}
                    </div>
                    <div>
                        <strong>{confession.alias}</strong>
                        <span>{formatRelativeTime(confession.createdAt, { short: true, nowLabel: "now" })}</span>
                    </div>
                </div>
                {confession.content ? <p>{confession.content}</p> : null}
            </button>

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
