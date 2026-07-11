import DesktopAppShell from "../../../components/layout/DesktopAppShell.jsx";
import { formatRelativeTime } from "../../../utils/time.js";
import { getAliasTone, getInitial } from "../../../utils/presentation.js";
import JoinedRoomsPanel from "./JoinedRoomsPanel.jsx";
import ActiveRoomFeed from "./ActiveRoomFeed.jsx";
import ConfessionDetailView from "./ConfessionDetailView.jsx";
import { LeaveIcon, PlusIcon } from "./ConfessionIcons.jsx";
import { RefreshCw } from "lucide-react";

function RoomMembersRail({ activeRoom, roomMembers, onShuffleAlias, shufflingAlias }) {
    if (!activeRoom) return null;

    const members = Array.isArray(roomMembers) ? roomMembers : [];

    return (
        <aside className="confession-room-rail" aria-label="Room details">
            <section className="confession-room-rail__section confession-room-rail__section--list">
                <div className="confession-room-rail__list-head">
                    <h3>People here</h3>
                    <span>{members.length} active</span>
                </div>

                <div className="confession-room-rail__list">
                    {members.length > 0 ? members.map((member) => {
                        const alias = String(member.alias || "").trim();
                        const isSelf = alias && String(activeRoom.alias || "").trim() === alias;
                        return (
                            <div key={`${member.userId || alias}-${member.joinedAt || ""}`} className="confession-room-rail__member">
                                <div className={`confession-room-rail__avatar confession-room-rail__avatar--${getAliasTone(alias)}`}>
                                    {getInitial(alias)}
                                </div>
                                <div className="confession-room-rail__member-copy">
                                    <strong>{alias || "Anonymous"}</strong>
                                    <span>{formatRelativeTime(member.joinedAt, { short: true, nowLabel: "now" })}</span>
                                </div>
                                {isSelf && (
                                    <>
                                        <span className="confession-room-rail__badge">You</span>
                                        {typeof onShuffleAlias === "function" && (
                                            <button
                                                type="button"
                                                className="confession-room-rail__shuffle-btn"
                                                onClick={onShuffleAlias}
                                                disabled={shufflingAlias}
                                                aria-label="Shuffle your alias"
                                                title="Shuffle identity"
                                            >
                                                <RefreshCw
                                                    size={11}
                                                    strokeWidth={2.3}
                                                    style={shufflingAlias ? { animation: "room-shuffle-spin 0.7s linear infinite" } : undefined}
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="confession-room-rail__empty">Loading active members...</div>
                    )}
                </div>
            </section>
        </aside>
    );
}

export default function ConfessionActiveRoomDesktop({
    notice,
    topBar,
    sidebarRooms,
    selectedSidebarRoomId,
    onSelectSidebarRoom,
    activeRoom,
    selectedConfession,
    roomMembers,
    user,
    joinedRooms,
    loadingRooms,
    loadingConfessions,
    loadingMoreConfessions,
    hasMoreConfessions,
    leavingRoomId,
    copiedRoomId,
    likedConfessionIds,
    reactingConfessionIds,
    sentChatRequestIds,
    selectedReplies,
    loadingReplies,
    loadingMoreReplies,
    hasMoreReplies,
    repliesLoadMoreRef,
    likedReplyIds,
    reactingReplyIds,
    detailReplyDraft,
    postingReplyId,
    confessions,
    onBackToRooms,
    onCloseConfession,
    onLeaveRoom,
    onCopyRoomCode,
    onOpenConfession,
    onOpenComposer,
    onLoadMoreConfessions,
    onReact,
    onChatRequest,
    onReplyDraftChange,
    onPostReply,
    onShare,
    onShuffleAlias,
    shufflingAlias,
    scheduledConfessions = [],
    onCancelScheduled
}) {
    const roomRail = activeRoom ? (
        <RoomMembersRail
            activeRoom={activeRoom}
            roomMembers={roomMembers}
            onShuffleAlias={onShuffleAlias}
            shufflingAlias={shufflingAlias}
        />
    ) : null;

    const desktopSubtitle = !activeRoom
        ? "Rooms you have joined and communities where you can post anonymously"
        : (selectedConfession
            ? "Read the confession and keep the conversation thoughtful"
            : (activeRoom.roomType === "private"
                ? `Private Room ${activeRoom.joinCode ? `· ${activeRoom.joinCode}` : ""}`
                : "Public Room"));

    return (
        <div className="my-confessions-page my-confessions-page--desktop">
            {notice && <p className="my-confessions-alert my-confessions-alert--notice">{notice}</p>}
            <DesktopAppShell
                sidebarRooms={joinedRooms}
                selectedSidebarRoomId={selectedSidebarRoomId}
                onSelectSidebarRoom={onSelectSidebarRoom}
                rightRail={roomRail}
                topBar={topBar}
                hideStageHeader
            >
                <div className="desktop-confessions-hub">
                    {activeRoom && (
                        <section className="desktop-confessions-hub__hero desktop-confessions-hub__hero--room">
                            <div className="desktop-confessions-hub__hero-copy">
                                <h1>{activeRoom.title}</h1>
                                <p>{desktopSubtitle}</p>
                            </div>
                            <div className="desktop-confessions-hub__hero-actions">
                                <button
                                    type="button"
                                    className="desktop-confessions-hub__leave-button"
                                    onClick={() => onLeaveRoom(activeRoom)}
                                    disabled={leavingRoomId === Number(activeRoom.roomId)}
                                    aria-label="Leave room"
                                >
                                    <LeaveIcon />
                                    <span>{leavingRoomId === Number(activeRoom.roomId) ? "Leaving..." : "Leave"}</span>
                                </button>
                                <button
                                    type="button"
                                    className="desktop-primary-button desktop-confessions-hub__compose-button"
                                    onClick={onOpenComposer}
                                    aria-label="Create confession"
                                >
                                    <PlusIcon />
                                </button>
                            </div>
                        </section>
                    )}

                    {!activeRoom && (
                        <div className="desktop-confessions-hub__rooms">
                            <JoinedRoomsPanel
                                isDesktop
                                loadingRooms={loadingRooms}
                                joinedRooms={joinedRooms}
                                onOpenRoom={onBackToRooms}
                            />
                        </div>
                    )}

                    {activeRoom && !selectedConfession && (
                        <ActiveRoomFeed
                            isDesktop
                            activeRoom={activeRoom}
                            confessions={confessions}
                            loadingConfessions={loadingConfessions}
                            loadingMoreConfessions={loadingMoreConfessions}
                            hasMoreConfessions={hasMoreConfessions}
                            leavingRoomId={leavingRoomId}
                            copiedRoomId={copiedRoomId}
                            likedConfessionIds={likedConfessionIds}
                            reactingConfessionIds={reactingConfessionIds}
                            sentChatRequestIds={sentChatRequestIds}
                            onBack={onBackToRooms}
                            onLeaveRoom={onLeaveRoom}
                            onCopyRoomCode={onCopyRoomCode}
                            onOpenConfession={onOpenConfession}
                            onOpenComposer={onOpenComposer}
                            onLoadMoreConfessions={onLoadMoreConfessions}
                            onReact={onReact}
                            onChatRequest={onChatRequest}
                            scheduledConfessions={scheduledConfessions}
                            onCancelScheduled={onCancelScheduled}
                        />
                    )}

                    {activeRoom && selectedConfession && (
                        <div className="desktop-comment-modal" role="dialog" aria-modal="true" aria-label="Confession comments">
                            <button
                                type="button"
                                className="desktop-comment-modal__backdrop"
                                onClick={onCloseConfession}
                                aria-label="Close comments"
                            />
                            <div className="desktop-comment-modal__panel">
                                <button
                                    type="button"
                                    className="desktop-comment-modal__close"
                                    onClick={onCloseConfession}
                                    aria-label="Close comments"
                                >
                                    ×
                                </button>
                                <ConfessionDetailView
                                    isDesktop
                                    user={user}
                                    activeRoom={activeRoom}
                                    selectedConfession={selectedConfession}
                                    selectedReplies={selectedReplies}
                                    loadingReplies={loadingReplies}
                                    loadingMoreReplies={loadingMoreReplies}
                                    hasMoreReplies={hasMoreReplies}
                                    repliesLoadMoreRef={repliesLoadMoreRef}
                                    likedConfessionIds={likedConfessionIds}
                                    likedReplyIds={likedReplyIds}
                                    reactingReplyIds={reactingReplyIds}
                                    sentChatRequestIds={sentChatRequestIds}
                                    replyDraft={detailReplyDraft}
                                    postingReplyId={postingReplyId}
                                    onBack={onCloseConfession}
                                    onShare={onShare}
                                    onReact={onReact}
                                    onChatRequest={onChatRequest}
                                    onReplyDraftChange={onReplyDraftChange}
                                    onPostReply={onPostReply}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </DesktopAppShell>
        </div>
    );
}
