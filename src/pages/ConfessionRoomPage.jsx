import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bell, Menu, MessageSquareQuote, Search, Shield, Sparkles } from "lucide-react";
import DesktopAppShell from "../components/layout/DesktopAppShell.jsx";
import UnifiedTopBar from "../components/layout/UnifiedTopBar.jsx";
import CommunityHubRail from "../components/common/CommunityHubRail.jsx";
import useIsDesktop from "../hooks/useIsDesktop";
import ActiveRoomFeed from "../features/confessions/components/ActiveRoomFeed.jsx";
import ChatRequestDialogs from "../features/confessions/components/ChatRequestDialogs.jsx";
import ConfessionComposerModal from "../features/confessions/components/ConfessionComposerModal.jsx";
import ConfessionScheduleConfirmModal from "../features/confessions/components/ConfessionScheduleConfirmModal.jsx";
import ConfessionDetailView from "../features/confessions/components/ConfessionDetailView.jsx";
import JoinedRoomsPanel from "../features/confessions/components/JoinedRoomsPanel.jsx";
import ConfessionLobbyDesktop from "../features/confessions/components/ConfessionLobbyDesktop.jsx";
import ConfessionActiveRoomDesktop from "../features/confessions/components/ConfessionActiveRoomDesktop.jsx";
import useConfessionRoom from "../features/confessions/hooks/useConfessionRoom.js";
import usePrimaryTabSwipeNavigation from "../hooks/usePrimaryTabSwipeNavigation.js";
import { getAliasTone, getInitial } from "../utils/presentation.js";
import { formatRelativeTime } from "../utils/time.js";
import {
    getRoomTone,
    RoomGlyphIcon
} from "../components/common/MobileRoomVisuals.jsx";
import { getAudioUploadToken } from "../services/confession.service.js";

const MOBILE_ROOM_FILTERS = ["All", "Joined", "Public", "Private", "Late Night"];

function MobileConfideIcon() { return <MessageSquareQuote size={18} strokeWidth={2} />; }
function MobileBellIcon() { return <Bell size={18} strokeWidth={2} />; }
function MobileMenuIcon() { return <Menu size={18} strokeWidth={2} />; }
function MobileSearchIcon() { return <Search size={18} strokeWidth={2} />; }
function MobileShieldIcon() { return <Shield size={18} strokeWidth={2} />; }
function MobileSparkIcon() { return <Sparkles size={18} strokeWidth={2} />; }
function MobileArrowRightIcon() { return <ArrowRight size={18} strokeWidth={2} />; }

function matchesJoinedRoomSearch(room, term) {
    const value = String(term || "").trim().toLowerCase();
    if (!value) return true;

    const haystack = `${room && room.title ? room.title : ""} ${room && room.description ? room.description : ""} ${room && room.category ? room.category : ""} ${room && room.roomType ? room.roomType : ""}`.toLowerCase();
    return haystack.includes(value);
}

function matchesJoinedRoomFilter(room, filter) {
    const value = String(filter || "All").trim().toLowerCase();
    if (value === "all" || value === "joined" || !value) return true;
    if (value === "public") return String(room && room.roomType || "").toLowerCase() === "public";
    if (value === "private") return String(room && room.roomType || "").toLowerCase() === "private";

    const category = String(room && room.category ? room.category : "").toLowerCase();
    const title = String(room && room.title ? room.title : "").toLowerCase();
    const description = String(room && room.description ? room.description : "").toLowerCase();
    if (value === "late night") return category.includes("late") || title.includes("late") || description.includes("late night");
    if (value === "heartbreak") return category.includes("heartbreak") || title.includes("heartbreak") || description.includes("heartbreak");
    return true;
}

function RoomMembersRail({ activeRoom, roomMembers }) {
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
                                {isSelf && <span className="confession-room-rail__badge">You</span>}
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

export default function ConfessionRoomPage({ user }) {
    const isDesktop = useIsDesktop();
    const navigate = useNavigate();
    const [desktopSearch, setDesktopSearch] = useState("");
    const [desktopRoomFilter, setDesktopRoomFilter] = useState("All");
    const [mobileSearch, setMobileSearch] = useState("");
    const [mobileRoomFilter, setMobileRoomFilter] = useState("All");
    const [confessionMode, setConfessionMode] = useState("text");
    const [audioToken, setAudioToken] = useState(null);
    const [audioTokenLoading, setAudioTokenLoading] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    const [audioReadyData, setAudioReadyData] = useState(null);
    const {
        joinedRooms,
        confessions,
        selectedReplies,
        activeRoomId,
        activeRoom,
        selectedConfession,
        loadingRooms,
        loadingConfessions,
        loadingMoreConfessions,
        loadingReplies,
        loadingMoreReplies,
        notice,
        leavingRoomId,
        copiedRoomId,
        showComposer,
        likedConfessionIds,
        likedReplyIds,
        roomMembers,
        chatRequestTarget,
        sendingChatRequest,
        chatRequestSuccess,
        sentChatRequestIds,
        hasMoreConfessions,
        hasMoreReplies,
        postingConfession,
        postingReplyId,
        reactingConfessionIds,
        reactingReplyIds,
        repliesLoadMoreRef,
        confessionDraft,
        detailReplyDraft,
        setShowComposer,
        setConfessionDraft,
        setChatRequestTarget,
        setChatRequestSuccess,
        openRoomsView,
        openRoomView,
        openConfessionView,
        closeConfessionView,
        loadMoreConfessions,
        updateReplyDraft,
        handleCopyRoomCode,
        handleLeaveRoom,
        handlePostConfession,
        handlePostReply,
        handleReact,
        openChatRequest,
        handleSendChatRequest,
        handleShuffleAlias,
        shufflingAlias,
        scheduledConfessions,
        pendingConfirmation,
        selectedScheduledAt,
        setSelectedScheduledAt,
        handleConfirmPublish,
        handleCancelScheduled,
        handleShare
    } = useConfessionRoom();

    const swipeNavigationHandlers = usePrimaryTabSwipeNavigation({
        enabled: !isDesktop && !activeRoom && !selectedConfession && !showComposer && !chatRequestTarget
    });

    const desktopSearchTerm = String(desktopSearch || "").trim();

    const desktopTopBar = (
        <UnifiedTopBar
            className="desktop-page-topbar"
            value={desktopSearch}
            onChange={(event) => setDesktopSearch(event.target.value)}
            onSubmit={(event) => event.preventDefault()}
            onNotificationsClick={() => navigate("/chats?requests=1")}
            onPrimaryClick={() => navigate("/create-room", { state: { openCreateRoom: true } })}
        />
    );

    const filteredJoinedRooms = useMemo(
        () => joinedRooms.filter((room) => matchesJoinedRoomSearch(room, desktopSearchTerm) && matchesJoinedRoomFilter(room, desktopRoomFilter)),
        [desktopRoomFilter, desktopSearchTerm, joinedRooms]
    );

    const sidebarRoomsForSearch = useMemo(() => {
        if (!desktopSearchTerm) return joinedRooms;
        return joinedRooms.filter((room) => matchesJoinedRoomSearch(room, desktopSearchTerm) || Number(room.roomId) === Number(activeRoomId));
    }, [activeRoomId, desktopSearchTerm, joinedRooms]);

    const desktopStats = useMemo(() => {
        const activeRooms = Array.isArray(joinedRooms) ? joinedRooms.length : 0;
        const confessionsToday = Array.isArray(confessions) ? confessions.length : 0;
        const supportGiven = Array.isArray(joinedRooms)
            ? joinedRooms.reduce((sum, room) => sum + (Number(room?.currentUserCount) || 0), 0)
            : 0;

        return {
            activeRooms,
            confessionsToday,
            supportGiven
        };
    }, [confessions, joinedRooms]);

    const homeSuggestionRooms = useMemo(() => {
        return Array.isArray(joinedRooms) ? joinedRooms.slice(0, 4) : [];
    }, [joinedRooms]);

    const mobileSearchTerm = String(mobileSearch || "").trim();

    const mobileFilteredRooms = useMemo(
        () => joinedRooms.filter((room) => matchesJoinedRoomSearch(room, mobileSearchTerm) && matchesJoinedRoomFilter(room, mobileRoomFilter)),
        [mobileRoomFilter, mobileSearchTerm, joinedRooms]
    );

    const mobileActiveJoinedRooms = useMemo(() => {
        return Array.isArray(joinedRooms) ? joinedRooms.slice(0, 4) : [];
    }, [joinedRooms]);

    const resetComposerState = useCallback(() => {
        setShowComposer(false);
        setSelectedScheduledAt(null);
        setConfessionMode("text");
        setAudioToken(null);
        setAudioReady(false);
        setAudioReadyData(null);
    }, [setSelectedScheduledAt, setShowComposer]);

    const handleFetchAudioToken = useCallback(async () => {
        if (!activeRoomId || audioToken || audioTokenLoading) return audioToken;
        try {
            setAudioTokenLoading(true);
            const token = await getAudioUploadToken(activeRoomId);
            setAudioToken(token);
            return token;
        } finally {
            setAudioTokenLoading(false);
        }
    }, [activeRoomId, audioToken, audioTokenLoading]);

    const handleAudioReady = useCallback((data) => {
        setAudioReady(true);
        setAudioReadyData(data || null);
    }, []);

    const resetAudioComposerState = useCallback(() => {
        setConfessionMode("text");
        setAudioToken(null);
        setAudioReady(false);
        setAudioReadyData(null);
    }, []);

    const handleComposerSubmit = useCallback(async (event) => {
        const posted = await handlePostConfession(event, confessionMode === "audio" ? {
            audioPublicId: audioReadyData && audioReadyData.audioPublicId,
            audioDuration: audioReadyData && audioReadyData.audioDuration
        } : {});
        if (posted) {
            resetAudioComposerState();
        }
    }, [audioReadyData, confessionMode, handlePostConfession, resetAudioComposerState]);

    const composerModal = showComposer && activeRoom ? (
        <ConfessionComposerModal
            isDesktop={isDesktop}
            room={activeRoom}
            draft={confessionDraft}
            posting={postingConfession}
            onDraftChange={setConfessionDraft}
            onClose={resetComposerState}
            onSubmit={handleComposerSubmit}
            onShuffle={handleShuffleAlias}
            shufflingAlias={shufflingAlias}
            selectedScheduledAt={selectedScheduledAt}
            onScheduleSelect={setSelectedScheduledAt}
            confessionMode={confessionMode}
            onConfessionModeChange={setConfessionMode}
            audioToken={audioToken}
            audioTokenLoading={audioTokenLoading}
            onFetchAudioToken={handleFetchAudioToken}
            onAudioReady={handleAudioReady}
            audioReady={audioReady}
        />
    ) : null;

    const scheduleConfirmModal = pendingConfirmation ? (
        <ConfessionScheduleConfirmModal
            confession={pendingConfirmation}
            onConfirm={handleConfirmPublish}
            onCancel={handleCancelScheduled}
        />
    ) : null;

    const chatRequestDialogs = (
        <ChatRequestDialogs
            chatRequestTarget={chatRequestTarget}
            sendingChatRequest={sendingChatRequest}
            chatRequestSuccess={chatRequestSuccess}
            onCancelRequest={() => setChatRequestTarget(null)}
            onSendRequest={handleSendChatRequest}
            onCloseSuccess={() => setChatRequestSuccess(null)}
        />
    );

    if (isDesktop && !activeRoom && !selectedConfession) {
        return (
            <>
                <ConfessionLobbyDesktop
                    notice={notice}
                    topBar={desktopTopBar}
                    roomFilter={desktopRoomFilter}
                    onRoomFilterChange={setDesktopRoomFilter}
                    sidebarRooms={sidebarRoomsForSearch}
                    selectedSidebarRoomId={activeRoomId}
                    onSelectSidebarRoom={(room) => openRoomView(room.roomId)}
                    loadingRooms={loadingRooms}
                    joinedRooms={joinedRooms}
                    filteredJoinedRooms={filteredJoinedRooms}
                    onOpenRoom={openRoomView}
                    activeRooms={desktopStats.activeRooms}
                    activeRoomsLabel="Joined Rooms"
                    suggestionsLabel="Active Joined Rooms"
                    confessionsToday={desktopStats.confessionsToday}
                    supportGiven={desktopStats.supportGiven}
                    rooms={homeSuggestionRooms}
                    onJoinRoom={(room) => openRoomView(room.roomId)}
                    emptyMessage="Join more rooms to unlock better suggestions."
                    showFooter
                />

                {composerModal}
                {scheduleConfirmModal}
                {chatRequestDialogs}
            </>
        );
    }

    if (isDesktop) {
        return (
            <>
                <ConfessionActiveRoomDesktop
                    notice={notice}
                    topBar={desktopTopBar}
                    roomFilter={desktopRoomFilter}
                    onRoomFilterChange={setDesktopRoomFilter}
                    sidebarRooms={joinedRooms}
                    selectedSidebarRoomId={activeRoomId}
                    onSelectSidebarRoom={(room) => openRoomView(room.roomId)}
                    activeRoom={activeRoom}
                    selectedConfession={selectedConfession}
                    roomMembers={roomMembers}
                    user={user}
                    joinedRooms={joinedRooms}
                    loadingRooms={loadingRooms}
                    loadingConfessions={loadingConfessions}
                    loadingMoreConfessions={loadingMoreConfessions}
                    hasMoreConfessions={hasMoreConfessions}
                    leavingRoomId={leavingRoomId}
                    copiedRoomId={copiedRoomId}
                    likedConfessionIds={likedConfessionIds}
                    reactingConfessionIds={reactingConfessionIds}
                    sentChatRequestIds={sentChatRequestIds}
                    selectedReplies={selectedReplies}
                    loadingReplies={loadingReplies}
                    loadingMoreReplies={loadingMoreReplies}
                    hasMoreReplies={hasMoreReplies}
                    repliesLoadMoreRef={repliesLoadMoreRef}
                    likedReplyIds={likedReplyIds}
                    reactingReplyIds={reactingReplyIds}
                    detailReplyDraft={detailReplyDraft}
                    postingReplyId={postingReplyId}
                    confessions={confessions}
                    onBackToRooms={openRoomsView}
                    onCloseConfession={closeConfessionView}
                    onLeaveRoom={handleLeaveRoom}
                    onCopyRoomCode={handleCopyRoomCode}
                    onOpenConfession={openConfessionView}
                    onOpenComposer={() => setShowComposer(true)}
                    onLoadMoreConfessions={loadMoreConfessions}
                    onReact={handleReact}
                    onChatRequest={openChatRequest}
                    onReplyDraftChange={(value) => updateReplyDraft(selectedConfession?.confessionId, value)}
                    onPostReply={handlePostReply}
                    onShare={handleShare}
                    onShuffleAlias={handleShuffleAlias}
                    shufflingAlias={shufflingAlias}
                    scheduledConfessions={scheduledConfessions}
                    onCancelScheduled={handleCancelScheduled}
                />

                {composerModal}
                {scheduleConfirmModal}
                {chatRequestDialogs}
            </>
        );
    }

    if (isDesktop && !activeRoom && !selectedConfession) {
        return (
            <div className="my-confessions-page my-confessions-page--desktop">
                {notice && <p className="my-confessions-alert my-confessions-alert--notice">{notice}</p>}
                <DesktopAppShell
                    sidebarRooms={sidebarRoomsForSearch}
                    selectedSidebarRoomId={activeRoomId}
                    onSelectSidebarRoom={(room) => openRoomView(room.roomId)}
                    topBar={desktopTopBar}
                    hideStageHeader
                    contentClassName="my-confessions-page__lobby-stage"
                >
                    <div className="home-content-grid my-confessions-lobby-grid">
                        <section className="home-feed-column my-confessions-lobby-grid__main">
                            <div className="desktop-confessions-hub">
                                <section className="desktop-confessions-hub__hero">
                                    <h1>Your Confession Rooms</h1>
                                    <p>Rooms you have joined and communities where you can post anonymously.</p>
                                </section>

                                <section className="desktop-pill-tabs desktop-confessions-hub__filters" aria-label="Room filters">
                                    {["All", "Joined", "Public", "Private", "Late Night", "Heartbreak"].map((label) => (
                                        <button
                                            key={label}
                                            type="button"
                                            className={`desktop-pill-tabs__item${desktopRoomFilter === label ? " is-active" : ""}`}
                                            onClick={() => setDesktopRoomFilter(label)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </section>

                                <JoinedRoomsPanel
                                    isDesktop
                                    loadingRooms={loadingRooms}
                                    joinedRooms={filteredJoinedRooms}
                                    onOpenRoom={openRoomView}
                                />
                            </div>
                        </section>

                        <CommunityHubRail
                            activeRooms={desktopStats.activeRooms}
                            activeRoomsLabel="Joined Rooms"
                            confessionsToday={desktopStats.confessionsToday}
                            supportGiven={desktopStats.supportGiven}
                            rooms={homeSuggestionRooms}
                            onJoinRoom={(room) => openRoomView(room.roomId)}
                            emptyMessage="Join more rooms to unlock better suggestions."
                            showFooter
                        />
                    </div>
                </DesktopAppShell>

                {composerModal}
                {chatRequestDialogs}
            </div>
        );
    }

    if (isDesktop) {
        const roomRail = activeRoom ? (
            <RoomMembersRail activeRoom={activeRoom} roomMembers={roomMembers} />
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
                    selectedSidebarRoomId={activeRoomId}
                    onSelectSidebarRoom={(room) => openRoomView(room.roomId)}
                    rightRail={roomRail}
                    topBar={desktopTopBar}
                    hideStageHeader
                >
                    <div className="desktop-confessions-hub">
                        {activeRoom && (
                            <section className="desktop-confessions-hub__hero desktop-confessions-hub__hero--room">
                                <h1>{activeRoom.title}</h1>
                                <p>{desktopSubtitle}</p>
                            </section>
                        )}

                        {!activeRoom && <JoinedRoomsPanel isDesktop loadingRooms={loadingRooms} joinedRooms={filteredJoinedRooms} onOpenRoom={openRoomView} />}

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
                                onBack={openRoomsView}
                                onLeaveRoom={handleLeaveRoom}
                                onCopyRoomCode={handleCopyRoomCode}
                                onOpenConfession={openConfessionView}
                                onOpenComposer={() => setShowComposer(true)}
                                onLoadMoreConfessions={loadMoreConfessions}
                                onReact={handleReact}
                                onChatRequest={openChatRequest}
                                scheduledConfessions={scheduledConfessions}
                                onCancelScheduled={handleCancelScheduled}
                            />
                        )}

                        {activeRoom && selectedConfession && (
                            <div className="desktop-comment-modal" role="dialog" aria-modal="true" aria-label="Confession comments">
                                <button
                                    type="button"
                                    className="desktop-comment-modal__backdrop"
                                    onClick={closeConfessionView}
                                    aria-label="Close comments"
                                />
                                <div className="desktop-comment-modal__panel">
                                    <button
                                        type="button"
                                        className="desktop-comment-modal__close"
                                        onClick={closeConfessionView}
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
                                        onBack={closeConfessionView}
                                        onShare={handleShare}
                                        onReact={handleReact}
                                        onChatRequest={openChatRequest}
                                        onReplyDraftChange={(value) => updateReplyDraft(selectedConfession.confessionId, value)}
                                        onPostReply={handlePostReply}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </DesktopAppShell>

                {composerModal}
                {chatRequestDialogs}
            </div>
        );
    }

    return (
        <div className="confide-confessions-mobile" {...swipeNavigationHandlers}>
            {notice && <p className="my-confessions-alert my-confessions-alert--notice">{notice}</p>}

            <div className="confide-confessions-mobile__shell">
                {!activeRoom && !selectedConfession && (
                    <>
                        {/* ── Main scrollable content ── */}
                        <main className="confide-confessions-mobile__content">
                            {/* Search bar */}
                            <form className="confide-confessions-mobile__search" onSubmit={(event) => event.preventDefault()}>
                                <span className="confide-confessions-mobile__search-icon" aria-hidden="true">
                                    <MobileSearchIcon />
                                </span>
                                <input
                                    type="search"
                                    value={mobileSearch}
                                    onChange={(event) => setMobileSearch(event.target.value)}
                                    placeholder="Search rooms, people, or feelings..."
                                />
                            </form>

                            {/* Title section */}
                            <section className="confide-confessions-mobile__hero">
                                <h1>Your Confession Rooms</h1>
                                <p>Rooms you have joined and communities where you can post anonymously.</p>
                            </section>

                            {/* Filter tabs */}
                            <section className="confide-confessions-mobile__filters" aria-label="Room filters">
                                {MOBILE_ROOM_FILTERS.map((label) => (
                                    <button
                                        key={label}
                                        type="button"
                                        className={`confide-confessions-mobile__filter${mobileRoomFilter === label ? " is-active" : ""}`}
                                        onClick={() => setMobileRoomFilter(label)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </section>

                            {/* Room cards */}
                            <section className="confide-confessions-mobile__rooms">
                                {loadingRooms && (
                                    <div className="confide-confessions-mobile__loading">
                                        <div className="confide-confessions-mobile__skeleton" />
                                        <div className="confide-confessions-mobile__skeleton" />
                                    </div>
                                )}

                                {!loadingRooms && mobileFilteredRooms.length === 0 && (
                                    <div className="confide-confessions-mobile__empty">
                                        <h3>{mobileSearchTerm ? "No rooms match your search" : "No joined rooms yet"}</h3>
                                        <p>{mobileSearchTerm ? "Try a different keyword." : "Discover and join rooms from the home screen to start posting."}</p>
                                    </div>
                                )}

                                {!loadingRooms && mobileFilteredRooms.length > 0 && mobileFilteredRooms.map((room) => {
                                    const tone = getRoomTone(room);
                                    const memberCount = Number(room.currentUserCount) || 0;
                                    const description = room.description || "A quiet space for honest conversations.";
                                    const roomAccess = room.roomType === "private" ? "Private" : "Public";

                                    return (
                                        <button
                                            key={room.roomId}
                                            type="button"
                                            className="confide-room-card"
                                            onClick={() => openRoomView(room.roomId)}
                                        >
                                            <div className="confide-room-card__hero">
                                                <div className={`confide-room-card__icon confide-room-card__icon--${tone}`} aria-hidden="true">
                                                    <RoomGlyphIcon tone={tone} />
                                                </div>
                                                <div className="confide-room-card__tags">
                                                    <span className="confide-room-card__tag">ROOM</span>
                                                    <span className="confide-room-card__tag">{roomAccess.toUpperCase()}</span>
                                                </div>
                                                <span className="confide-room-card__joined-badge">JOINED</span>
                                            </div>

                                            <div className="confide-room-card__body">
                                                <h3>{room.title}</h3>
                                                <p>{description}</p>
                                            </div>

                                            <div className="confide-room-card__footer">
                                                <span className="confide-room-card__dot" aria-hidden="true" />
                                                <span className="confide-room-card__members">{`${memberCount} members`}</span>
                                                <span className="confide-room-card__open">
                                                    <span>Open room</span>
                                                    <MobileArrowRightIcon />
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </section>

                            {/* Active Joined Rooms */}
                            {mobileActiveJoinedRooms.length > 0 && (
                                <section className="confide-confessions-mobile__active-section">
                                    <div className="confide-active-rooms-card">
                                        <h2>Active Joined Rooms</h2>
                                        <div className="confide-active-rooms-card__list">
                                            {mobileActiveJoinedRooms.map((room) => {
                                                const tone = getRoomTone(room);
                                                const memberCount = Number(room.currentUserCount) || 0;
                                                return (
                                                    <div key={room.roomId} className="confide-active-room-item">
                                                        <div className={`confide-active-room-item__icon confide-active-room-item__icon--${tone}`} aria-hidden="true">
                                                            <MobileSparkIcon />
                                                        </div>
                                                        <div className="confide-active-room-item__copy">
                                                            <strong>{room.title}</strong>
                                                            <span>{`${memberCount} members`}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="confide-active-room-item__join"
                                                            onClick={() => openRoomView(room.roomId)}
                                                        >
                                                            Join
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Safety First banner */}
                            <section className="confide-confessions-mobile__safety-section">
                                <div className="confide-safety-card">
                                    <div className="confide-safety-card__icon" aria-hidden="true">
                                        <MobileShieldIcon />
                                    </div>
                                    <h2>Safety First</h2>
                                    <p>Your identity stays yours. Always. We never share your data, and direct messages are opt-in only.</p>
                                </div>
                            </section>
                        </main>

                    </>
                )}

                {activeRoom && !selectedConfession && (
                    <>
                        <ActiveRoomFeed
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
                            onBack={openRoomsView}
                            onLeaveRoom={handleLeaveRoom}
                            onCopyRoomCode={handleCopyRoomCode}
                            onOpenConfession={openConfessionView}
                            onOpenComposer={() => setShowComposer(true)}
                            onLoadMoreConfessions={loadMoreConfessions}
                            onReact={handleReact}
                            onChatRequest={openChatRequest}
                            scheduledConfessions={scheduledConfessions}
                            onCancelScheduled={handleCancelScheduled}
                        />

                        {composerModal}
                    </>
                )}

                {activeRoom && selectedConfession && (
                    <ConfessionDetailView
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
                        onBack={closeConfessionView}
                        onShare={handleShare}
                        onReact={handleReact}
                        onChatRequest={openChatRequest}
                        onReplyDraftChange={(value) => updateReplyDraft(selectedConfession.confessionId, value)}
                        onPostReply={handlePostReply}
                    />
                )}

                {chatRequestDialogs}
            </div>
        </div>
    );
}
