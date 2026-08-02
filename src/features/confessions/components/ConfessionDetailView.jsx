import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DesktopEmptyState from "../../../components/common/DesktopEmptyState.jsx";
import { CommentSkeletonList, InfiniteScrollLoader } from "../../../components/common/LoadingStates.jsx";
import { getAliasTone, getInitial } from "../../../utils/presentation.js";
import { formatRelativeTime } from "../../../utils/time.js";

import ConfessionReplyComposer from "./ConfessionReplyComposer.jsx";
import ConfessionReplyList from "./ConfessionReplyList.jsx";
import AudioPlayer from "./AudioPlayer.jsx";
import { ArrowLeftIcon, CommentIcon, ShareIcon, UpvoteIcon, SendIcon } from "./ConfessionIcons.jsx";

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
    const navigate = useNavigate();

    if (!activeRoom || !selectedConfession) return null;

    const isPostingReply = postingReplyId === Number(selectedConfession.confessionId);
    const replyDisabled = isPostingReply || !String(replyDraft || "").trim();

    // References
    const inputRef = useRef(null);
    const scrollContentRef = useRef(null);
    const sheetRef = useRef(null);

    // Touch gesture state for drag-to-dismiss on mobile
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartY = useRef(0);

    // Reply-to-reply target state: { alias, replyId }
    const [replyingTo, setReplyingTo] = useState(null);
    const [isInputFocused, setIsInputFocused] = useState(false);

    // Dynamic VisualViewport handling for smooth keyboard animation on mobile
    const [vvHeight, setVvHeight] = useState(null);
    const [vvBottom, setVvBottom] = useState(0);

    useEffect(() => {
        if (isDesktop || typeof window === "undefined" || !window.visualViewport) return;

        const handleVisualViewportChange = () => {
            const vv = window.visualViewport;
            const layoutH = window.innerHeight;
            const visibleH = Math.round(vv.height);
            const offsetTop = Math.round(vv.offsetTop);
            const bottomInset = Math.max(0, layoutH - visibleH - offsetTop);

            setVvHeight(visibleH);
            setVvBottom(bottomInset);
        };

        handleVisualViewportChange();
        window.visualViewport.addEventListener("resize", handleVisualViewportChange);
        window.visualViewport.addEventListener("scroll", handleVisualViewportChange);

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener("resize", handleVisualViewportChange);
                window.visualViewport.removeEventListener("scroll", handleVisualViewportChange);
            }
        };
    }, [isDesktop]);

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

    // Handle reply-to-user click (Instagram style) — receives { alias, replyId }
    const handleReplyToUser = useCallback((alias, replyId = null) => {
        setReplyingTo({ alias, replyId });
        const current = replyDraft || "";
        const mentionTag = `@${alias} `;
        if (!current.startsWith(mentionTag)) {
            const cleanDraft = current.replace(/^@[A-Za-z0-9_.-]+\s*/, "");
            onReplyDraftChange(`${mentionTag}${cleanDraft}`);
        }
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [onReplyDraftChange, replyDraft]);

    const handleCancelReplyTo = useCallback(() => {
        setReplyingTo(null);
        if (replyDraft && replyDraft.startsWith("@")) {
            const cleanDraft = replyDraft.replace(/^@[A-Za-z0-9_.-]+\s*/, "");
            onReplyDraftChange(cleanDraft);
        }
    }, [onReplyDraftChange, replyDraft]);

    // Post reply — forward parentReplyId & parentAlias from replyingTo state
    const handleSubmitReply = useCallback(() => {
        const parentReplyId = replyingTo ? replyingTo.replyId : null;
        const parentAlias = replyingTo ? replyingTo.alias : null;
        onPostReply(selectedConfession.confessionId, parentReplyId, parentAlias);
        setReplyingTo(null);
    }, [replyingTo, onPostReply, selectedConfession]);

    // Instagram feature: Auto-dismiss keyboard when scrolling comments list
    const handleCommentsScroll = useCallback(() => {
        if (inputRef.current && document.activeElement === inputRef.current) {
            inputRef.current.blur();
        }
    }, []);

    // Focus handler: smooth scroll into view on first click so input is never hidden
    const handleInputFocus = useCallback(() => {
        setIsInputFocused(true);
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }
        }, 100);
    }, []);

    const handleInputBlur = useCallback(() => {
        setIsInputFocused(false);
    }, []);

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
            <div
                className="confession-detail-card__author"
                onClick={() => navigate(`/user/${selectedConfession.alias}`, { state: { profileUser: { username: selectedConfession.alias, isAlias: true } } })}
                style={{ cursor: "pointer" }}
                role="button"
                tabIndex={0}
            >
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
                onReplyToUser={handleReplyToUser}
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
                        onSubmit={handleSubmitReply}
                        inputRef={inputRef}
                        replyingToAlias={replyingTo ? replyingTo.alias : null}
                        onCancelReplyTo={handleCancelReplyTo}
                    />
                </aside>
            </div>
        );
    }

    // Mobile View: Senior Production-Grade Bottom Sheet Modal with Smooth Keyboard Handling
    const mobileStyle = {
        transform: dragY > 0 ? `translateY(${dragY}px)` : "none",
        transition: isDragging ? "none" : "transform 0.25s ease-out"
    };

    if (vvBottom > 0) {
        mobileStyle.bottom = `${vvBottom}px`;
    }
    if (vvHeight) {
        mobileStyle.maxHeight = `${vvHeight}px`;
    }

    return (
        <div className="confession-comment-sheet-backdrop" onClick={onBack}>
            <div
                ref={sheetRef}
                className={`confession-comment-sheet${isInputFocused ? " is-keyboard-open" : ""}`}
                onClick={(e) => e.stopPropagation()}
                style={mobileStyle}
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

                {/* Main Scrollable Comments Area - Auto-dismisses keyboard on scroll (Instagram behavior) */}
                <div
                    ref={scrollContentRef}
                    className="confession-comment-sheet__scroll-content"
                    onScroll={handleCommentsScroll}
                    onTouchMove={handleCommentsScroll}
                >
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

                {/* Fixed Bottom Reply Bar */}
                <ConfessionReplyComposer
                    userLabel={user && user.username ? user.username : "you"}
                    value={replyDraft}
                    posting={isPostingReply}
                    disabled={replyDisabled}
                    onChange={onReplyDraftChange}
                    onSubmit={handleSubmitReply}
                    inputRef={inputRef}
                    replyingToAlias={replyingTo ? replyingTo.alias : null}
                    onCancelReplyTo={handleCancelReplyTo}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                />
            </div>
        </div>
    );
}
