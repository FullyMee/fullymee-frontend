import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import RoomMembersRail from "../features/confessions/components/RoomMembersRail.jsx";
import useConfessionRoom from "../features/confessions/hooks/useConfessionRoom.js";
import usePrimaryTabSwipeNavigation from "../hooks/usePrimaryTabSwipeNavigation.js";
import { getAliasTone, getInitial } from "../utils/presentation.js";
import { formatRelativeTime } from "../utils/time.js";
import {
    getRoomTone,
    RoomGlyphIcon
} from "../components/common/MobileRoomVisuals.jsx";
import { getAudioUploadToken } from "../services/confession.service.js";
import {
    MobileConfideIcon,
    MobileBellIcon,
    MobileMenuIcon,
    MobileSearchIcon,
    MobileShieldIcon,
    MobileSparkIcon,
    MobileArrowRightIcon
} from "../components/common/Icons.jsx";
import {
    matchesJoinedRoomSearch,
    matchesJoinedRoomFilter
} from "../features/confessions/utils/roomFilters.js";

const MOBILE_ROOM_FILTERS = ["All", "Joined", "Public", "Private", "Late Night"];


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
                        <main className="confide-confessions-mobile__content">
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

                            <section className="confide-confessions-mobile__hero">
                                <span className="confide-confessions-mobile__hero-label">✨ YOUR SAFE SPACE</span>
                                <h1>Your confession rooms</h1>
                                <p>The communities where your thoughts can arrive exactly as they are.</p>
                            </section>

                            <div className="confide-cta-banner">
                                <div className="confide-cta-banner__icon" aria-hidden="true">
                                    <MobileConfideIcon />
                                </div>
                                <div className="confide-cta-banner__copy">
                                    <strong>Say it anonymously</strong>
                                    <span>No name, no pressure — just your truth.</span>
                                </div>
                                <button
                                    type="button"
                                    className="confide-cta-banner__add"
                                    onClick={() => navigate("/create-room", { state: { openCreateRoom: true } })}
                                    aria-label="Create a new room"
                                >
                                    +
                                </button>
                            </div>

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

                            <section className="confide-confessions-mobile__rooms">
                                <div className="confide-rooms-section-head">
                                    <h2>Spaces for you</h2>
                                    {mobileFilteredRooms.length > 0 && (
                                        <span>{mobileFilteredRooms.length} room{mobileFilteredRooms.length !== 1 ? "s" : ""}</span>
                                    )}
                                </div>

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
                                    const roomAccess = room.roomType === "private" ? "PRIVATE" : "PUBLIC";

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
                                                    <span className="confide-room-card__tag">{roomAccess}</span>
                                                </div>
                                                <span className="confide-room-card__joined-badge">JOINED</span>
                                            </div>

                                            <div className="confide-room-card__body">
                                                <h3>{room.title}</h3>
                                                <p>{description}</p>
                                            </div>

                                            <div className="confide-room-card__footer">
                                                <span className="confide-room-card__dot" aria-hidden="true" />
                                                <span className="confide-room-card__chatting">{memberCount} chatting now</span>
                                                <span className="confide-room-card__sep" aria-hidden="true">·</span>
                                                <svg className="confide-room-card__members-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                                <span className="confide-room-card__members">{memberCount}</span>
                                                <span className="confide-room-card__open">
                                                    <span>Open room</span>
                                                    <MobileArrowRightIcon />
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </section>

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
