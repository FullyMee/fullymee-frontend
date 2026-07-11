import { useEffect, useState } from "react";
import DesktopEmptyState from "../../../components/common/DesktopEmptyState.jsx";
import { FeedSkeletonList, InfiniteScrollLoader } from "../../../components/common/LoadingStates.jsx";
import MemoizedConfessionCard from "../../../components/common/ConfessionCard.jsx";
import { getAliasTone, getInitial } from "../../../utils/presentation.js";
import { formatRelativeTime } from "../../../utils/time.js";
import {
    formatCompactMemberCount,
    getRoomTone,
    RoomGlyphIcon
} from "../../../components/common/MobileRoomVisuals.jsx";
import { Virtuoso } from "react-virtuoso";
import { getConfessionParts, getRoomHeroBadge } from "../utils/confessionView.js";
import { ArrowLeftIcon, CommentIcon, CopyIcon, HeartIcon, LeaveIcon, LockIcon, PlusIcon, UpvoteIcon, SendIcon } from "./ConfessionIcons.jsx";

function formatScheduleCountdown(date, now = Date.now()) {
    const target = new Date(date || 0).getTime();
    if (!target) return "";
    const ms = target - now;
    if (ms <= 0) return "ready soon";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${Math.max(1, minutes)}m`;
}

function ClockBadgeIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.75A9.25 9.25 0 1 0 21.25 12 9.26 9.26 0 0 0 12 2.75Zm.75 4.75h-1.5v5.05l4.1 2.45.75-1.28-3.35-1.99V7.5Z" fill="currentColor" />
        </svg>
    );
}

export default function ActiveRoomFeed({
    isDesktop = false,
    activeRoom,
    confessions,
    loadingConfessions,
    loadingMoreConfessions,
    hasMoreConfessions,
    leavingRoomId,
    copiedRoomId,
    likedConfessionIds,
    reactingConfessionIds,
    sentChatRequestIds,
    onBack,
    onLeaveRoom,
    onCopyRoomCode,
    onOpenConfession,
    onOpenComposer,
    onLoadMoreConfessions,
    onReact,
    onChatRequest,
    scheduledConfessions = [],
    onCancelScheduled
}) {
    const [scheduleNow, setScheduleNow] = useState(() => Date.now());

    useEffect(() => {
        if (!Array.isArray(scheduledConfessions) || scheduledConfessions.length === 0) return undefined;
        const timer = window.setInterval(() => setScheduleNow(Date.now()), 30000);
        return () => window.clearInterval(timer);
    }, [scheduledConfessions]);

    if (!activeRoom) return null;

    const confessionList = isDesktop ? (
        <div className="desktop-social-feed">
            {confessions.map((confession) => {
                const confessionId = Number(confession.confessionId);
                const isLiked = likedConfessionIds.has(confessionId);
                const isReacting = reactingConfessionIds.has(confessionId);
                const isSentRequest = sentChatRequestIds.has(confessionId);
                const parts = getConfessionParts(confession.content);

                return (
                    <article key={confession.confessionId} className="desktop-social-post">
                        <header className="desktop-social-post__header">
                            <div className={`desktop-social-post__avatar desktop-social-post__avatar--${getAliasTone(confession.alias)}`}>
                                {getInitial(confession.alias)}
                            </div>
                            <div className="desktop-social-post__meta">
                                <strong>{confession.alias}</strong>
                                <span>{formatRelativeTime(confession.createdAt, { short: true, nowLabel: "now" })}</span>
                            </div>
                        </header>

                        <button
                            type="button"
                            className="desktop-social-post__content"
                            onClick={() => onOpenConfession(confession.confessionId)}
                        >
                            <h3>{parts.title}</h3>
                            {parts.body ? <p>{parts.body}</p> : null}
                        </button>

                        <div className="desktop-social-post__actions">
                            <button
                                type="button"
                                className={`desktop-social-post__action${isLiked ? " is-liked" : ""}`}
                                onClick={() => onReact("confession", confession.confessionId)}
                                disabled={isReacting}
                            >
                                <UpvoteIcon active={isLiked} />
                                <span>{confession.reactionCount || 0}</span>
                            </button>
                            <button
                                type="button"
                                className="desktop-social-post__action"
                                onClick={() => onOpenConfession(confession.confessionId)}
                            >
                                <CommentIcon />
                                <span>{confession.replyCount || 0}</span>
                            </button>
                            <button
                                type="button"
                                className={`desktop-social-post__action${isSentRequest ? " is-sent" : ""}`}
                                onClick={() => onChatRequest(confession)}
                                aria-label="Send chat request"
                            >
                                <SendIcon filled={isSentRequest} />
                            </button>
                        </div>
                    </article>
                );
            })}
        </div>
    ) : (
        <Virtuoso
            useWindowScroll
            data={confessions}
            endReached={() => {
                if (!loadingConfessions && !loadingMoreConfessions && hasMoreConfessions) {
                    onLoadMoreConfessions();
                }
            }}
            components={{
                Footer: () => (
                    loadingMoreConfessions ? <InfiniteScrollLoader label="Loading more confessions" /> : null
                )
            }}
            itemContent={(index, confession) => (
                <div style={{ paddingBottom: "1rem" }}>
                    <MemoizedConfessionCard
                        key={confession.confessionId}
                        confession={confession}
                        isDesktop={false}
                        isLiked={likedConfessionIds.has(Number(confession.confessionId))}
                        isReacting={reactingConfessionIds.has(Number(confession.confessionId))}
                        isSentRequest={sentChatRequestIds.has(Number(confession.confessionId))}
                        onOpenView={onOpenConfession}
                        onReact={onReact}
                        onChatRequest={onChatRequest}
                    />
                </div>
            )}
        />
    );

    if (isDesktop) {
        return (
            <div className="desktop-confession-workspace">
                {scheduledConfessions.length > 0 && (
                    <section className="room-scheduled-strip" aria-label="Scheduled confessions">
                        <div className="room-scheduled-strip__head">
                            <strong>Time-locked</strong>
                            <span>{scheduledConfessions.length} pending</span>
                        </div>
                        <div className="room-scheduled-strip__list">
                            {scheduledConfessions.map((item) => (
                                <article key={item.confessionId} className="room-scheduled-card">
                                    <header className="room-scheduled-card__author">
                                        <div className="room-scheduled-card__avatar" aria-hidden="true">
                                            <ClockBadgeIcon />
                                        </div>
                                        <div>
                                            <strong>Time-locked confession</strong>
                                            <span>Posts in {formatScheduleCountdown(item.scheduledAt, scheduleNow)}</span>
                                        </div>
                                    </header>
                                    <div className="room-scheduled-card__copy">
                                        <p>{String(item.content || "").slice(0, 90)}</p>
                                    </div>
                                    {typeof onCancelScheduled === "function" && (
                                        <footer className="room-scheduled-card__actions">
                                            <button type="button" onClick={() => onCancelScheduled(item.confessionId)}>
                                                Cancel
                                            </button>
                                        </footer>
                                    )}
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                <section className="desktop-profile-section">
                    <div className="desktop-profile-section__head">
                        <h2>Confessions</h2>
                        <span>{loadingConfessions ? "Loading..." : `${confessions.length} posts`}</span>
                    </div>

                    {loadingConfessions && confessions.length === 0 && <FeedSkeletonList count={3} />}

                    {!loadingConfessions && confessions.length === 0 && (
                        <DesktopEmptyState
                            compact
                            title="No confessions yet"
                            description="Be the first to post in this room."
                        />
                    )}

                    {confessionList}
                    {!loadingConfessions && !loadingMoreConfessions && hasMoreConfessions && (
                        <div className="desktop-social-feed__loadmore-wrap">
                            <button type="button" className="desktop-secondary-button" onClick={onLoadMoreConfessions}>
                                Load more
                            </button>
                        </div>
                    )}
                    {loadingMoreConfessions && <InfiniteScrollLoader label="Loading more confessions" />}
                </section>
            </div>
        );
    }

    const roomSubtitle = activeRoom.roomType === "private"
        ? `Private Room${activeRoom.joinCode ? ` · ${activeRoom.joinCode}` : ""}`
        : `${getRoomHeroBadge(activeRoom)} · ${formatCompactMemberCount(activeRoom.currentUserCount)}`;

    return (
        <>
            <header className="room-feed-header room-feed-header--social">
                <div className="room-feed-header__room-row">
                    <button type="button" className="room-feed-header__title" onClick={onBack}>
                        <span className="room-feed-header__back-icon" aria-hidden="true">
                            <ArrowLeftIcon />
                        </span>
                        <span>
                            <strong>{activeRoom.title}</strong>
                            <small>{roomSubtitle}</small>
                        </span>
                    </button>

                    <div className="room-feed-header__actions">
                        <button
                            type="button"
                            className={`room-feed-header__leave${leavingRoomId === Number(activeRoom.roomId) ? " is-loading" : ""}`}
                            disabled={leavingRoomId === Number(activeRoom.roomId)}
                            onClick={() => onLeaveRoom(activeRoom)}
                        >
                            <LeaveIcon />
                            <span>{leavingRoomId === Number(activeRoom.roomId) ? "Leaving" : "Leave"}</span>
                        </button>
                        <button
                            type="button"
                            className="room-feed-header__compose"
                            onClick={onOpenComposer}
                            aria-label="Create confession"
                        >
                            <PlusIcon />
                        </button>
                    </div>
                </div>
            </header>

            <main className="room-feed-content">
                <section className={`room-hero-card room-hero-card--${getRoomTone(activeRoom)}`}>
                    <div className="room-hero-card__top">
                        <div className="room-hero-card__icon">
                            <RoomGlyphIcon tone={getRoomTone(activeRoom)} />
                        </div>
                        <div className="room-hero-card__copy">
                            <div className="room-hero-card__meta-row">
                                <span className="room-hero-card__badge">{getRoomHeroBadge(activeRoom)}</span>
                                {activeRoom.roomType === "private" && (
                                    <span className="room-hero-card__badge room-hero-card__badge--private">
                                        <LockIcon />
                                        <span>Private</span>
                                    </span>
                                )}
                            </div>
                            <p>{activeRoom.description || "Share what is on your mind and support others anonymously."}</p>
                            <small>{formatCompactMemberCount(activeRoom.currentUserCount)}</small>
                        </div>
                        <button
                            type="button"
                            className={`room-hero-card__joined is-leave${leavingRoomId === Number(activeRoom.roomId) ? " is-loading" : ""}`}
                            disabled={leavingRoomId === Number(activeRoom.roomId)}
                            onClick={() => onLeaveRoom(activeRoom)}
                        >
                            <LeaveIcon />
                            <span>{leavingRoomId === Number(activeRoom.roomId) ? "Leaving..." : "Leave"}</span>
                        </button>
                    </div>
                    {activeRoom.roomType === "private" && activeRoom.joinCode && (
                        <div className="room-hero-card__private-panel">
                            <div className="room-hero-card__divider" aria-hidden="true" />
                            <p className="room-hero-card__private-label">Share this code with others to join:</p>
                            <div className="room-hero-card__private-code-row">
                                <div className="room-hero-card__private-code-card">
                                    <strong>{activeRoom.joinCode}</strong>
                                </div>
                                <button
                                    type="button"
                                    className="room-hero-card__copy-button"
                                    onClick={() => onCopyRoomCode(activeRoom)}
                                >
                                    <CopyIcon />
                                    <span>{copiedRoomId === Number(activeRoom.roomId) ? "Copied!" : "Copy"}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {scheduledConfessions.length > 0 && (
                    <section className="room-scheduled-strip" aria-label="Scheduled confessions">
                        <div className="room-scheduled-strip__head">
                            <strong>Time-locked</strong>
                            <span>{scheduledConfessions.length} pending</span>
                        </div>
                        <div className="room-scheduled-strip__list">
                            {scheduledConfessions.map((item) => (
                                <article key={item.confessionId} className="room-scheduled-card">
                                    <header className="room-scheduled-card__author">
                                        <div className="room-scheduled-card__avatar" aria-hidden="true">
                                            <ClockBadgeIcon />
                                        </div>
                                        <div>
                                            <strong>Time-locked confession</strong>
                                            <span>Posts in {formatScheduleCountdown(item.scheduledAt, scheduleNow)}</span>
                                        </div>
                                    </header>
                                    <div className="room-scheduled-card__copy">
                                        <p>{String(item.content || "").slice(0, 90)}</p>
                                    </div>
                                    {typeof onCancelScheduled === "function" && (
                                        <footer className="room-scheduled-card__actions">
                                            <button type="button" onClick={() => onCancelScheduled(item.confessionId)}>
                                                Cancel
                                            </button>
                                        </footer>
                                    )}
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                <section className="room-feed-section">
                    <div className="room-feed-section__head">
                        <h2>Confessions</h2>
                        <span>{loadingConfessions ? "Loading..." : `${confessions.length} posts`}</span>
                    </div>

                    {loadingConfessions && confessions.length === 0 && <FeedSkeletonList count={3} />}

                    {!loadingConfessions && confessions.length === 0 && (
                        <div className="room-feed-empty">No confessions yet. Be the first to post in this room.</div>
                    )}

                    {confessionList}
                </section>
            </main>
        </>
    );
}
