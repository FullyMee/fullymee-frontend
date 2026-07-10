import React, { memo } from 'react';
import { InlineSpinner } from './LoadingStates.jsx';
import { getAliasTone, getInitial } from '../../utils/presentation.js';
import { formatRelativeTime } from '../../utils/time.js';
import { Heart, MessageSquare, Send } from "lucide-react";

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
    const rootClass = isDesktop ? "desktop-confession-card" : "room-confession-card";
    const contentClass = isDesktop ? "desktop-confession-card__content" : "room-confession-card__content";
    
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
                <p>{confession.content}</p>
            </button>

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
