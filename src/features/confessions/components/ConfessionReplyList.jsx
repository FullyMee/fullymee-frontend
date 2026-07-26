import React from "react";
import { getAliasTone, getInitial } from "../../../utils/presentation.js";
import { formatRelativeTime } from "../../../utils/time.js";
import { Heart } from "lucide-react";

export default function ConfessionReplyList({
    replies,
    likedReplyIds,
    reactingReplyIds,
    onReactReply,
    firstBadgeLabel,
    onReplyToUser
}) {
    if (!Array.isArray(replies) || replies.length === 0) return null;

    return (
        <div className="confession-reply-list">
            {replies.map((reply, index) => {
                const replyIdNum = Number(reply.replyId);
                const isLiked = likedReplyIds ? likedReplyIds.has(replyIdNum) : false;
                const isReacting = reactingReplyIds ? reactingReplyIds.has(replyIdNum) : false;
                const reactionCount = Number(reply.reactionCount || 0);

                return (
                    <article key={reply.replyId || index} className="confession-reply-card">
                        {index === 0 && firstBadgeLabel ? (
                            <div className="confession-reply-card__badge">{firstBadgeLabel}</div>
                        ) : null}

                        <div className="confession-reply-card__row">
                            {/* Left Avatar */}
                            <div className={`confession-reply-card__avatar confession-detail-card__avatar--${getAliasTone(reply.alias)}`}>
                                {getInitial(reply.alias)}
                            </div>

                            {/* Center Content */}
                            <div className="confession-reply-card__main">
                                <div className="confession-reply-card__author-line">
                                    <strong className="confession-reply-card__username">{reply.alias || "Anonymous"}</strong>
                                    <span className="confession-reply-card__time">{formatRelativeTime(reply.createdAt)}</span>
                                    {reply.isEdited && <span className="confession-reply-card__edited">• Edited</span>}
                                </div>

                                <p className="confession-reply-card__text">{reply.content}</p>

                                <div className="confession-reply-card__actions">
                                    <button
                                        type="button"
                                        className="confession-reply-action-btn"
                                        onClick={() => onReplyToUser && onReplyToUser(reply.alias)}
                                    >
                                        Reply
                                    </button>
                                    {reply.hasTranslation && (
                                        <button type="button" className="confession-reply-action-btn">
                                            See translation
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Right Like Heart Button */}
                            <div className="confession-reply-card__like-col">
                                <button
                                    type="button"
                                    className={`confession-reply-like-btn${isLiked ? " is-liked" : ""}`}
                                    onClick={() => onReactReply(reply.replyId)}
                                    disabled={isReacting}
                                    aria-label={isLiked ? "Unlike reply" : "Like reply"}
                                >
                                    <Heart
                                        size={18}
                                        fill={isLiked ? "#FF3040" : "none"}
                                        color={isLiked ? "#FF3040" : "#8E8E8E"}
                                        strokeWidth={isLiked ? 0 : 1.8}
                                    />
                                </button>
                                <span className="confession-reply-like-count">
                                    {reactionCount > 0 ? reactionCount : ""}
                                </span>
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
