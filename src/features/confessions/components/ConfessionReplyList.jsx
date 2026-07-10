import { getAliasTone, getInitial } from "../../../utils/presentation.js";
import { formatRelativeTime } from "../../../utils/time.js";
import { HeartIcon } from "./ConfessionIcons.jsx";

export default function ConfessionReplyList({
    replies,
    likedReplyIds,
    reactingReplyIds,
    onReactReply,
    firstBadgeLabel
}) {
    return (
        <div className="confession-reply-list">
            {replies.map((reply, index) => (
                <article key={reply.replyId} className="confession-reply-card">
                    {index === 0 && firstBadgeLabel ? (
                        <div className="confession-reply-card__badge">{firstBadgeLabel}</div>
                    ) : null}
                    <div className="confession-reply-card__author">
                        <div className={`confession-detail-card__avatar confession-detail-card__avatar--small confession-detail-card__avatar--${getAliasTone(reply.alias)}`}>
                            {getInitial(reply.alias)}
                        </div>
                        <div className="confession-detail-card__author-copy">
                            <strong>{reply.alias}</strong>
                            <span>{formatRelativeTime(reply.createdAt)}</span>
                        </div>
                    </div>
                    <p>{reply.content}</p>
                    <button
                        type="button"
                        className={`room-confession-card__stat${likedReplyIds.has(Number(reply.replyId)) ? " is-liked" : ""}`}
                        onClick={() => onReactReply(reply.replyId)}
                    >
                        <HeartIcon filled={likedReplyIds.has(Number(reply.replyId))} />
                        <span>{reply.reactionCount || 0}</span>
                    </button>
                </article>
            ))}
        </div>
    );
}

