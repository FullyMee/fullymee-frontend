import DesktopEmptyState from "../../../components/common/DesktopEmptyState.jsx";
import { CommentSkeletonList, InfiniteScrollLoader } from "../../../components/common/LoadingStates.jsx";
import { getAliasTone, getInitial } from "../../../utils/presentation.js";
import { formatRelativeTime } from "../../../utils/time.js";

import ConfessionReplyComposer from "./ConfessionReplyComposer.jsx";
import ConfessionReplyList from "./ConfessionReplyList.jsx";
import AudioPlayer from "./AudioPlayer.jsx";
import { ArrowLeftIcon, CommentIcon, HeartIcon, ShareIcon, UpvoteIcon, SendIcon } from "./ConfessionIcons.jsx";

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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                        <path d="M12 2L14.09 8.26L20 9.27L15 14.14L16.18 21.02L12 17.77L7.82 21.02L9 14.14L4 9.27L9.91 8.26L12 2Z" />
                    </svg>
                    <span>ANONYMOUS</span>
                </div>
            </div>

            <div className="confession-detail-card__body">
                {selectedConfession.content ? <h1>{"\u201C"}{selectedConfession.content}{"\u201D"}</h1> : null}
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
                <span className="confession-detail-card__seen">Seen by {selectedConfession.viewCount || selectedConfession.reactionCount || 0}</span>
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
                isDesktop ? (
                    <DesktopEmptyState
                        compact
                        title="No replies yet"
                        description="Start the conversation with a thoughtful response."
                    />
                ) : (
                    <div className="room-feed-empty">No replies yet. Start the conversation with a thoughtful response.</div>
                )
            )}

            <ConfessionReplyList
                replies={selectedReplies}
                likedReplyIds={likedReplyIds}
                reactingReplyIds={reactingReplyIds}
                onReactReply={(replyId) => onReact("reply", replyId)}
                firstBadgeLabel={isDesktop ? "Trusted Community Reply" : "Trusted Career Mentor"}
                originalPosterAlias={selectedConfession.alias}
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

    return (
        <>
            <header className="confession-detail-header">
                <button type="button" className="confession-detail-header__back" onClick={onBack}>
                    <ArrowLeftIcon />
                    <span>Back</span>
                </button>
                <button
                    type="button"
                    className="confession-detail-header__share"
                    onClick={() => onShare("confession", selectedConfession)}
                >
                    <ShareIcon />
                </button>
            </header>

            <main className="confession-detail-content">
                {detailCard}

                <section className="confession-support-card">
                    <div className="confession-support-card__icon" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <p>Lead with care. You can offer support without trying to solve everything.</p>
                </section>

                <section className="confession-replies-section">
                    <span className="confession-replies-section__label">A CARING CIRCLE</span>
                    <div className="confession-replies-section__head">
                        <div>
                            <h2>Advice <em>&amp;</em> responses</h2>
                            <p className="confession-replies-section__subtitle">Every response is a chance to make someone feel seen.</p>
                        </div>
                        <span className="confession-replies-section__count">{selectedConfession.replyCount || selectedReplies.length}</span>
                    </div>

                    {repliesSection}
                </section>
            </main>

            <ConfessionReplyComposer
                userLabel={user && user.username ? user.username : "you"}
                value={replyDraft}
                posting={isPostingReply}
                disabled={replyDisabled}
                onChange={onReplyDraftChange}
                onSubmit={() => onPostReply(selectedConfession.confessionId)}
            />
        </>
    );
}
