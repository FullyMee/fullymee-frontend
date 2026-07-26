import React, { useEffect, useRef, useState, useCallback } from "react";
import DesktopEmptyState from "../../../components/common/DesktopEmptyState.jsx";
import { CommentSkeletonList, InfiniteScrollLoader } from "../../../components/common/LoadingStates.jsx";
import { getAliasTone, getInitial } from "../../../utils/presentation.js";
import { formatRelativeTime } from "../../../utils/time.js";

import ConfessionReplyComposer from "./ConfessionReplyComposer.jsx";
import ConfessionReplyList from "./ConfessionReplyList.jsx";
import AudioPlayer from "./AudioPlayer.jsx";
import { ArrowLeftIcon, CommentIcon, ShareIcon, UpvoteIcon, SendIcon } from "./ConfessionIcons.jsx";
import { X } from "lucide-react";

export default function ConfessionDetailView({
    isDesktop = false,
    user,
    activeRoom,
    selectedConfession,
    selectedReplies,
    loadingReplies,
    loadingMoreReplies,
    hasMoreReplies,
    repliesLoadMoreRef,
    likedConfessionIds,
    likedReplyIds,
    reactingReplyIds,
    sentChatRequestIds,
    replyDraft,
    postingReplyId,
    onBack,
    onShare,
    onReact,
    onChatRequest,
    onReplyDraftChange,
    onPostReply
}) {
    if (!activeRoom || !selectedConfession) return null;

    const isPostingReply = postingReplyId === Number(selectedConfession.confessionId);
    const replyDisabled = isPostingReply || !String(replyDraft || "").trim();

    // Touch gesture state for drag-to-dismiss on mobile
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartY = useRef(0);
    const sheetRef = useRef(null);

    // Keydown ESC listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onBack();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onBack]);

    // Touch handlers for sheet drag handle
    const handleTouchStart = useCallback((e) => {
        if (e.touches && e.touches.length > 0) {
            touchStartY.current = e.touches[0].clientY;
            setIsDragging(true);
        }
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging || !e.touches || e.touches.length === 0) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY.current;
        if (deltaY > 0) {
            setDragY(deltaY);
        }
    }, [isDragging]);

    const handleTouchEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        if (dragY > 120) {
            onBack();
        }
        setDragY(0);
    }, [dragY, isDragging, onBack]);

    const detailCard = (
        <article className="confession-detail-card">
            <div className="confession-detail-card__author">
                <div className={`confession-detail-card__avatar confession-detail-card__avatar--${getAliasTone(selectedConfession.alias)}`}>
                    {getInitial(selectedConfession.alias)}
                </div>
                <div className="confession-detail-card__author-copy">
                    <strong>{selectedConfession.alias}</strong>
                    <span>{formatRelativeTime(selectedConfession.createdAt)}</span>
                </div>
                <div className="confession-detail-card__tag">
                    {activeRoom.title}
                </div>
            </div>

            <div className="confession-detail-card__body">
                {selectedConfession.content ? <h1>{selectedConfession.content}</h1> : null}
                {selectedConfession.audio ? (
                    <AudioPlayer
                        roomId={selectedConfession.roomId}
                        confessionId={selectedConfession.confessionId}
                        audio={selectedConfession.audio}
                    />
                ) : null}
            </div>

            <div className="confession-detail-card__actions">
                <button
                    type="button"
                    className={`room-confession-card__stat${likedConfessionIds.has(Number(selectedConfession.confessionId)) ? " is-liked" : ""}`}
                    onClick={() => onReact("confession", selectedConfession.confessionId)}
                >
                    <UpvoteIcon active={likedConfessionIds.has(Number(selectedConfession.confessionId))} />
                    <span>{selectedConfession.reactionCount || 0}</span>
                </button>
                <div className="room-confession-card__stat">
                    <CommentIcon />
                    <span>{selectedConfession.replyCount || 0}</span>
                </div>
                <button
                    type="button"
                    className={`room-confession-card__request${sentChatRequestIds.has(Number(selectedConfession.confessionId)) ? " is-sent" : ""}`}
                    onClick={() => onChatRequest(selectedConfession)}
                    aria-label={sentChatRequestIds.has(Number(selectedConfession.confessionId)) ? "Request sent" : `Send chat request to ${selectedConfession.alias}`}
                >
                    <SendIcon filled={sentChatRequestIds.has(Number(selectedConfession.confessionId))} />
                </button>
            </div>
        </article>
    );

    const repliesSection = (
        <>
            {loadingReplies && selectedReplies.length === 0 && <CommentSkeletonList count={3} />}

            {!loadingReplies && selectedReplies.length === 0 && (
                <div className="room-feed-empty">No replies yet. Start the conversation with a thoughtful response.</div>
            )}

            <ConfessionReplyList
                replies={selectedReplies}
                likedReplyIds={likedReplyIds}
                reactingReplyIds={reactingReplyIds}
                onReactReply={(replyId) => onReact("reply", replyId)}
                onReplyToUser={(alias) => {
                    const current = replyDraft || "";
                    if (!current.includes(`@${alias}`)) {
                        onReplyDraftChange(`@${alias} ${current}`);
                    }
                }}
            />

            {!isDesktop && loadingMoreReplies && <InfiniteScrollLoader label="Loading more responses" />}
            {!isDesktop && !loadingReplies && !loadingMoreReplies && hasMoreReplies && (
                <div ref={repliesLoadMoreRef} className="infinite-scroll-loader" aria-hidden="true" />
            )}
        </>
    );

    if (isDesktop) {
        return (
            <div className="desktop-comment-sheet">
                <section className="desktop-comment-sheet__post">
                    <div className="desktop-comment-sheet__post-head">
                        <button type="button" className="desktop-link-button" onClick={onBack}>Back to feed</button>
                        <button
                            type="button"
                            className="desktop-link-button"
                            onClick={() => onShare("confession", selectedConfession)}
                        >
                            <ShareIcon />
                            <span>Share</span>
                        </button>
                    </div>

                    {detailCard}
                </section>

                <aside className="desktop-comment-sheet__panel">
                    <div className="desktop-comment-sheet__panel-head">
                        <h2>Comments</h2>
                        <span>{selectedConfession.replyCount || selectedReplies.length}</span>
                    </div>

                    <div className="desktop-comment-sheet__replies">
                        {repliesSection}
                    </div>

                    <ConfessionReplyComposer
                        isDesktop
                        userLabel={user && user.username ? user.username : "you"}
                        value={replyDraft}
                        posting={isPostingReply}
                        disabled={replyDisabled}
                        onChange={onReplyDraftChange}
                        onSubmit={() => onPostReply(selectedConfession.confessionId)}
                    />
                </aside>
            </div>
        );
    }

    // Mobile View: Production-Grade Bottom Sheet Drawer Modal
    return (
        <div className="confession-comment-sheet-backdrop" onClick={onBack}>
            <div
                ref={sheetRef}
                className="confession-comment-sheet"
                onClick={(e) => e.stopPropagation()}
                style={{
                    transform: dragY > 0 ? `translateY(${dragY}px)` : "none",
                    transition: isDragging ? "none" : "transform 0.25s ease-out"
                }}
                role="dialog"
                aria-modal="true"
                aria-label="Comments"
            >
                {/* Drag Handle Top Bar */}
                <div
                    className="confession-comment-sheet__handle-bar"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="confession-comment-sheet__handle" />
                    <h2 className="confession-comment-sheet__title">Comments</h2>
                </div>

                {/* Main Scrollable Comments Area */}
                <div className="confession-comment-sheet__scroll-content">
                    {/* Embedded Confession Post Brief Summary Card */}
                    <div className="confession-comment-sheet__post-summary">
                        <div className={`confession-detail-card__avatar confession-detail-card__avatar--small confession-detail-card__avatar--${getAliasTone(selectedConfession.alias)}`}>
                            {getInitial(selectedConfession.alias)}
                        </div>
                        <div className="confession-comment-sheet__post-summary-copy">
                            <strong>{selectedConfession.alias}</strong>
                            <p>{selectedConfession.content || "Confession post"}</p>
                        </div>
                    </div>

                    <div className="confession-comment-sheet__divider" />

                    {/* Replies List */}
                    <div className="confession-comment-sheet__replies-wrap">
                        {repliesSection}
                    </div>
                </div>

                {/* Fixed Bottom Reaction & Reply Bar */}
                <ConfessionReplyComposer
                    userLabel={user && user.username ? user.username : "you"}
                    value={replyDraft}
                    posting={isPostingReply}
                    disabled={replyDisabled}
                    onChange={onReplyDraftChange}
                    onSubmit={() => onPostReply(selectedConfession.confessionId)}
                />
            </div>
        </div>
    );
}
