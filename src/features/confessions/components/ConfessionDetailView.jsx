import DesktopEmptyState from "../../../components/common/DesktopEmptyState.jsx";
import { CommentSkeletonList, InfiniteScrollLoader } from "../../../components/common/LoadingStates.jsx";
import { getAliasTone, getInitial } from "../../../utils/presentation.js";
import { formatRelativeTime } from "../../../utils/time.js";
import { getConfessionParts } from "../utils/confessionView.js";
import ConfessionReplyComposer from "./ConfessionReplyComposer.jsx";
import ConfessionReplyList from "./ConfessionReplyList.jsx";
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
                    {activeRoom.title}
                </div>
            </div>

            <div className="confession-detail-card__body">
                <h1>{getConfessionParts(selectedConfession.content).title}</h1>
                {getConfessionParts(selectedConfession.content).body && (
                    <p>{getConfessionParts(selectedConfession.content).body}</p>
                )}
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
                    <p>Remember: You're not alone. This community is here to support you.</p>
                </section>

                <section className="confession-replies-section">
                    <div className="confession-replies-section__head">
                        <h2>Advice & Responses ({selectedConfession.replyCount || selectedReplies.length})</h2>
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
