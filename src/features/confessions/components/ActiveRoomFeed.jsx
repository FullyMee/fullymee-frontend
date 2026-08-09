import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DesktopEmptyState from "../../../components/common/DesktopEmptyState.jsx";
import { FeedSkeletonList, InfiniteScrollLoader } from "../../../components/common/LoadingStates.jsx";
import MemoizedConfessionCard from "../../../components/common/ConfessionCard.jsx";
import AudioPlayer from "./AudioPlayer.jsx";
import { getAliasTone, getInitial } from "../../../utils/presentation.js";
import UserAvatar from "../../../components/common/UserAvatar.jsx";
import { formatRelativeTime } from "../../../utils/time.js";
import {
    formatCompactMemberCount,
    getRoomTone,
    RoomGlyphIcon
} from "../../../components/common/MobileRoomVisuals.jsx";
import { Virtuoso } from "react-virtuoso";
import { getRoomHeroBadge } from "../utils/confessionView.js";
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
    const navigate = useNavigate();
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

                return (
                    <article key={confession.confessionId} className="desktop-social-post">
                        <header 
                            className="desktop-social-post__header"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/user/${confession.alias}`, { state: { profileUser: { username: confession.alias, isAlias: true } } });
                            }}
                        >
                            <UserAvatar avatarId={confession.avatar} className="desktop-social-post__avatar" />
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
                            <h3>{String(confession.content || "").trim() ? confession.content : "Audio confession"}</h3>
                        </button>

                        {confession.audio ? (
                            <AudioPlayer
                                roomId={confession.roomId}
                                confessionId={confession.confessionId}
                                audio={confession.audio}
                            />
                        ) : null}

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
                                        <p>{String(item.content || "").trim() ? String(item.content || "").slice(0, 90) : "Audio confession"}</p>
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
            <header className="room-mobile-redesign-header">
                <button type="button" className="room-mobile-redesign-header__back" onClick={onBack}>
                    <ArrowLeftIcon />
                    <span>Rooms</span>
                </button>

                <div className="room-mobile-redesign-header__actions">
                    <button
                        type="button"
                        className="room-mobile-redesign-header__leave"
                        disabled={leavingRoomId === Number(activeRoom.roomId)}
                        onClick={() => onLeaveRoom(activeRoom)}
                        aria-label="Leave room"
                    >
                        <LeaveIcon />
                    </button>
                    <button
                        type="button"
                        className="room-mobile-redesign-header__compose"
                        onClick={onOpenComposer}
                        aria-label="Create confession"
                    >
                        <PlusIcon />
                    </button>
                </div>
            </header>

            <main className="room-mobile-redesign-content">
                <section className="room-mobile-redesign-hero">
                    <div className="room-mobile-redesign-hero__tone">
                        {getRoomHeroBadge(activeRoom).toUpperCase()} &bull;
                    </div>
                    <h1 className="room-mobile-redesign-hero__title">{activeRoom.title}</h1>
                    <div className="room-mobile-redesign-hero__subtitle-row">
                        <p>{activeRoom.description || "Speak softly. We're listening."}</p>
                        <div className="room-mobile-redesign-hero__members">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            <span>{formatCompactMemberCount(activeRoom.currentUserCount)}</span>
                        </div>
                    </div>
                    {activeRoom.roomType === "private" && activeRoom.joinCode && (
                        <div className="room-mobile-redesign-hero__private">
                            <p>Share this code to join:</p>
                            <strong>{activeRoom.joinCode}</strong>
                            <button type="button" onClick={() => onCopyRoomCode(activeRoom)}>
                                {copiedRoomId === Number(activeRoom.roomId) ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    )}
                </section>
                <hr className="room-mobile-redesign-divider" />
                <section className="room-mobile-redesign-voices-head">
                    <h2>VOICES FROM THE ROOM</h2>
                    <p>Listen with kindness. Leave space for every story.</p>
                </section>
                <hr className="room-mobile-redesign-divider" />

                {scheduledConfessions.length > 0 && (
                    <>
                        <section className="room-scheduled-strip" aria-label="Scheduled confessions" style={{ marginTop: "1.25rem", padding: "0 1.25rem" }}>
                        <div className="room-scheduled-strip__head">
                            <strong>Time-locked</strong>
                            <span>{scheduledConfessions.length} pending</span>
                        </div>
                        <div className="room-scheduled-strip__list">
                            {scheduledConfessions.map((item) => (
                                <article key={item.confessionId} className="room-mobile-redesign-card">
                                    <div className="room-mobile-redesign-card__content-btn" style={{ cursor: "default", textAlign: "left", display: "block", width: "100%", background: "none", border: "none", padding: 0 }}>
                                        <div className="room-mobile-redesign-card__author-row">
                                            <div className="room-mobile-redesign-card__author-info">
                                                <UserAvatar avatarId={item.avatar} className="rm-avatar" />
                                                <strong className="room-mobile-redesign-card__alias">{item.alias || "Anonymous"}</strong>
                                                <svg className="room-mobile-redesign-card__sparkle" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2L14.09 8.26L20 9.27L15 14.14L16.18 21.02L12 17.77L7.82 21.02L9 14.14L4 9.27L9.91 8.26L12 2Z"/></svg>
                                                <span className="room-mobile-redesign-card__meta">
                                                    Posts in {formatScheduleCountdown(item.scheduledAt, scheduleNow)} {item.audio ? "" : "· written"}
                                                </span>
                                            </div>
                                            <div className="room-mobile-redesign-card__more">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                                            </div>
                                        </div>

                                        {item.content ? (
                                            <div className={`room-mobile-redesign-card__body ${item.audio ? "is-quoted" : "is-written"}`}>
                                                {item.audio ? `“${item.content}”` : item.content}
                                            </div>
                                        ) : null}
                                    </div>
                                    
                                    {item.audio ? (
                                        <div className="room-mobile-redesign-card__audio-wrapper">
                                            <AudioPlayer
                                                roomId={activeRoom.roomId}
                                                confessionId={item.confessionId}
                                                audio={item.audio}
                                                variant="mobile"
                                            />
                                        </div>
                                    ) : null}

                                    {typeof onCancelScheduled === "function" && (
                                        <div className="room-mobile-redesign-card__actions" style={{ justifyContent: "flex-end" }}>
                                            <button 
                                                type="button" 
                                                onClick={() => onCancelScheduled(item.confessionId)}
                                                style={{ padding: "0.5rem 1.25rem", borderRadius: "999px", border: "none", background: "#fdf2ed", color: "#e17b53", fontWeight: "600", fontSize: "0.9rem" }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    </section>
                    <hr className="room-mobile-redesign-divider" />
                </>
                )}

                <section className="room-mobile-redesign-feed">
                    {loadingConfessions && confessions.length === 0 && <FeedSkeletonList count={3} />}

                    {!loadingConfessions && confessions.length === 0 && (
                        <DesktopEmptyState
                            compact
                            title="No confessions yet"
                            description="Be the first to post in this room."
                        />
                    )}

                    {confessionList}
                </section>
            </main>
        </>
    );
}
