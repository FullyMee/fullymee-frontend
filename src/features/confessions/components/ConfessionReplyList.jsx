import React, { useState, useCallback } from "react";
import { getAliasTone, getInitial } from "../../../utils/presentation.js";
import { formatRelativeTime } from "../../../utils/time.js";
import { Heart, ChevronDown, ChevronUp } from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Renders content with @mention tags highlighted */
function ReplyText({ content }) {
    if (!content) return null;
    const parts = content.split(/(@[A-Za-z0-9_.-]+)/g);
    return (
        <p className="confession-reply-card__text">
            {parts.map((part, i) =>
                part.startsWith("@")
                    ? <span key={i} className="reply-mention">{part}</span>
                    : part
            )}
        </p>
    );
}

// ─── Single Reply Card ───────────────────────────────────────────────────────

function ReplyCard({
    reply,
    isLiked,
    isReacting,
    isChild = false,
    onReactReply,
    onReplyToUser
}) {
    const reactionCount = Number(reply.reactionCount || 0);

    return (
        <article className={`confession-reply-card${isChild ? " confession-reply-card--child" : ""}`}>
            <div className="confession-reply-card__row">
                {/* Avatar */}
                <div className={`confession-reply-card__avatar confession-detail-card__avatar--${getAliasTone(reply.alias)}`}>
                    {getInitial(reply.alias)}
                </div>

                {/* Center Content */}
                <div className="confession-reply-card__main">
                    <div className="confession-reply-card__author-line">
                        <strong className="confession-reply-card__username">{reply.alias || "Anonymous"}</strong>
                        <span className="confession-reply-card__time">{formatRelativeTime(reply.createdAt)}</span>
                    </div>

                    <ReplyText content={reply.content} />

                    <div className="confession-reply-card__actions">
                        <button
                            type="button"
                            className="confession-reply-action-btn"
                            onClick={() => onReplyToUser && onReplyToUser(reply.alias, reply.replyId)}
                        >
                            Reply
                        </button>
                    </div>
                </div>

                {/* Heart Like Button */}
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
}

// ─── Thread Group (top-level reply + its nested children) ───────────────────

function ReplyThread({
    topReply,
    childReplies,
    likedReplyIds,
    reactingReplyIds,
    onReactReply,
    onReplyToUser
}) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = childReplies.length > 0;

    const toggleExpand = useCallback(() => setExpanded((prev) => !prev), []);

    const topLiked = likedReplyIds ? likedReplyIds.has(Number(topReply.replyId)) : false;
    const topReacting = reactingReplyIds ? reactingReplyIds.has(Number(topReply.replyId)) : false;

    return (
        <div className="confession-reply-thread">
            {/* Top-level comment */}
            <ReplyCard
                reply={topReply}
                isLiked={topLiked}
                isReacting={topReacting}
                onReactReply={onReactReply}
                onReplyToUser={onReplyToUser}
            />

            {/* "View X more replies" toggle button — Instagram style */}
            {hasChildren && (
                <button
                    type="button"
                    className="confession-reply-toggle-btn"
                    onClick={toggleExpand}
                    aria-expanded={expanded}
                    aria-label={expanded ? "Hide replies" : `View ${childReplies.length} ${childReplies.length === 1 ? "reply" : "more replies"}`}
                >
                    <span className="confession-reply-toggle-line" aria-hidden="true" />
                    <span className="confession-reply-toggle-label">
                        {expanded
                            ? "Hide replies"
                            : `View ${childReplies.length} ${childReplies.length === 1 ? "reply" : "more replies"}`}
                    </span>
                    {expanded
                        ? <ChevronUp size={13} strokeWidth={2.2} />
                        : <ChevronDown size={13} strokeWidth={2.2} />}
                </button>
            )}

            {/* Nested children — revealed on toggle */}
            {hasChildren && expanded && (
                <div className="confession-reply-card__children" role="list" aria-label="Nested replies">
                    {childReplies.map((child) => {
                        const childLiked = likedReplyIds ? likedReplyIds.has(Number(child.replyId)) : false;
                        const childReacting = reactingReplyIds ? reactingReplyIds.has(Number(child.replyId)) : false;
                        return (
                            <ReplyCard
                                key={child.replyId}
                                reply={child}
                                isLiked={childLiked}
                                isReacting={childReacting}
                                isChild
                                onReactReply={onReactReply}
                                onReplyToUser={onReplyToUser}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function ConfessionReplyList({
    replies,
    likedReplyIds,
    reactingReplyIds,
    onReactReply,
    firstBadgeLabel,
    onReplyToUser
}) {
    if (!Array.isArray(replies) || replies.length === 0) return null;

    // Split into top-level replies (no parentReplyId) and children (have parentReplyId)
    const topLevelReplies = replies.filter((r) => !r.parentReplyId);
    const childReplies = replies.filter((r) => !!r.parentReplyId);

    // Build a map: parentReplyId → [child replies]
    const childrenByParentId = new Map();
    childReplies.forEach((child) => {
        const pid = Number(child.parentReplyId);
        if (!childrenByParentId.has(pid)) childrenByParentId.set(pid, []);
        childrenByParentId.get(pid).push(child);
    });

    // Sort children by createdAt ascending (oldest first in each thread)
    childrenByParentId.forEach((arr) => arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));

    return (
        <div className="confession-reply-list">
            {topLevelReplies.map((reply, index) => {
                const replyIdNum = Number(reply.replyId);
                const children = childrenByParentId.get(replyIdNum) || [];

                return (
                    <div key={reply.replyId || index} className="confession-reply-thread-wrapper">
                        {index === 0 && firstBadgeLabel ? (
                            <div className="confession-reply-card__badge">{firstBadgeLabel}</div>
                        ) : null}
                        <ReplyThread
                            topReply={reply}
                            childReplies={children}
                            likedReplyIds={likedReplyIds}
                            reactingReplyIds={reactingReplyIds}
                            onReactReply={onReactReply}
                            onReplyToUser={onReplyToUser}
                        />
                    </div>
                );
            })}
        </div>
    );
}
