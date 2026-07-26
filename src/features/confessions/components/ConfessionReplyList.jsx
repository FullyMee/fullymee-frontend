import { getAliasTone, getInitial } from "../../../utils/presentation.js";
import { formatRelativeTime } from "../../../utils/time.js";
import { HeartIcon, CommentIcon } from "./ConfessionIcons.jsx";

/**
 * Derive a role badge label based on reply position and alias.
 * Matches the design: "Kind listener", "Original poster", "Trusted Career Mentor", "Room regular".
 */
function getReplyBadge(reply, index, originalPosterAlias) {
    if (reply.alias === originalPosterAlias) return { label: "Original poster", className: "confession-reply-card__role--op" };
    if (reply.badge) return { label: reply.badge, className: "confession-reply-card__role--mentor" };
    if (index === 0) return { label: "Kind listener", className: "confession-reply-card__role--listener" };
    return null;
}

export default function ConfessionReplyList({
    replies,
    likedReplyIds,
    reactingReplyIds,
    onReactReply,
    firstBadgeLabel,
    originalPosterAlias
}) {
    return (
        <div className="confession-reply-list">
            {replies.map((reply, index) => {
                const roleBadge = getReplyBadge(reply, index, originalPosterAlias);
                return (
                    <article key={reply.replyId} className="confession-reply-card">
                        <div className="confession-reply-card__author">
                            <div className="confession-reply-card__avatar-wrap">
                                <div className={`confession-detail-card__avatar confession-detail-card__avatar--small confession-detail-card__avatar--${getAliasTone(reply.alias)}`}>
                                    {getInitial(reply.alias)}
                                </div>
                                {reply.isOnline && <span className="confession-reply-card__online" aria-label="Online" />}
                            </div>
                            <div className="confession-reply-card__author-info">
                                <div className="confession-reply-card__name-row">
                                    <strong>{reply.alias}</strong>
                                    {roleBadge && (
                                        <span className={`confession-reply-card__role ${roleBadge.className}`}>
                                            {roleBadge.label}
                                        </span>
                                    )}
                                </div>
                                <span>{formatRelativeTime(reply.createdAt)}</span>
                            </div>
                            <button type="button" className="confession-reply-card__more" aria-label="More options">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                    <circle cx="5" cy="12" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="19" cy="12" r="2" />
                                </svg>
                            </button>
                        </div>

                        <p>{reply.content}</p>

                        <div className="confession-reply-card__actions">
                            <button
                                type="button"
                                className={`confession-reply-card__action-btn${likedReplyIds.has(Number(reply.replyId)) ? " is-liked" : ""}`}
                                onClick={() => onReactReply(reply.replyId)}
                            >
                                <HeartIcon filled={likedReplyIds.has(Number(reply.replyId))} />
                                <span>{reply.reactionCount || 0}</span>
                            </button>
                            <button type="button" className="confession-reply-card__action-btn confession-reply-card__reply-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 14 4 9 9 4" />
                                    <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                                </svg>
                                <span>Reply</span>
                            </button>
                            {(reply.replyCount > 0) && (
                                <div className="confession-reply-card__action-btn confession-reply-card__comment-count">
                                    <CommentIcon />
                                    <span>{reply.replyCount}</span>
                                </div>
                            )}
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

