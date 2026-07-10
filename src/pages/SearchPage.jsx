import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import DesktopAppShell from "../components/layout/DesktopAppShell.jsx";
import UnifiedTopBar from "../components/layout/UnifiedTopBar.jsx";
import { useGlobalError } from "../context/ErrorContext.jsx";
import { ChatListSkeleton, RoomCardSkeletonList } from "../components/common/LoadingStates.jsx";
import { joinConfessionRoom, joinConfessionRoomByCode } from "../services/confession.service";
import { sendUserChatRequest } from "../services/chat.service";
import useIsDesktop from "../hooks/useIsDesktop";

// Modular feature imports
import { useSearchData } from "../features/search/hooks/useSearchData.js";
import SearchInput from "../features/search/components/SearchInput.jsx";
import SearchTabs, { ROOMS_TAB, PEOPLE_TAB } from "../features/search/components/SearchTabs.jsx";
import SearchRoomCard from "../features/search/components/SearchRoomCard.jsx";
import SearchUserCard from "../features/search/components/SearchUserCard.jsx";
import Button from "../components/common/Button.jsx";
import Input from "../components/common/Input.jsx";
import Modal from "../components/common/Modal.jsx";
import useBodyClass from "../hooks/useBodyClass.js";
import useTimedNotice from "../hooks/useTimedNotice.js";
import usePrimaryTabSwipeNavigation from "../hooks/usePrimaryTabSwipeNavigation.js";

export default function SearchPage({ user }) {
    const isDesktop = useIsDesktop();
    const navigate = useNavigate();
    const { showError, dismissError } = useGlobalError();

    const [tab, setTab] = useState(ROOMS_TAB);
    const [query, setQuery] = useState("");
    const [notice, setNotice] = useTimedNotice("", 2200);
    const [busyKey, setBusyKey] = useState("");
    
    // Join code modal states
    const [showCodeJoin, setShowCodeJoin] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [joinCodeError, setJoinCodeError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Modular Hook Call
    const { 
        joinedRooms, 
        setJoinedRooms, 
        roomResults, 
        peopleResults, 
        loading, 
        loadingMoreRooms,
        loadingMorePeople,
        roomHasMore,
        peopleHasMore,
        loadMoreRooms,
        loadMorePeople,
        joinedRoomIds 
    } = useSearchData(user, query);

    const swipeNavigationHandlers = usePrimaryTabSwipeNavigation({
        enabled: !isDesktop && !showCodeJoin
    });

    useBodyClass("confessions-scroll-unlocked");

    async function handleOpenRoom(room) {
        if (room.roomType === "private" && !joinedRoomIds.has(Number(room.roomId))) {
            setShowCodeJoin(true);
            return;
        }

        const roomId = Number(room && room.roomId);
        if (!roomId) return;

        try {
            setBusyKey(`room-${roomId}`);

            if (!joinedRoomIds.has(roomId)) {
                await joinConfessionRoom({ roomId, joinSource: "search_page" });
                setJoinedRooms((prev) => {
                    if (prev.some((item) => Number(item && item.roomId) === roomId)) return prev;
                    return [...prev, room];
                });
                setNotice(`Joined ${room.title}`);
            }

            navigate(`/confessions?roomId=${roomId}`);
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to open this room.");
        } finally {
            setBusyKey("");
        }
    }

    async function handleOpenPerson(person) {
        const targetUserId = Number(person && person.id);
        if (!targetUserId) return;

        try {
            setBusyKey(`person-${targetUserId}`);
            const result = await sendUserChatRequest(targetUserId);
            const requestState = String((result && result.requestState) || "").trim();

            if ((requestState === "already_connected" || requestState === "accepted") && Number(result && result.conversationId)) {
                setNotice(`You are already connected with ${person.username}.`);
                navigate(`/chats?conversationId=${result.conversationId}`);
                return;
            }

            if (requestState === "already_pending") {
                setNotice(`Chat request already pending for ${person.username}.`);
                return;
            }

            if (requestState === "sent" || requestState === "pending") {
                setNotice(`Chat request sent to ${person.username}.`);
                return;
            }

            setNotice(`Chat request updated for ${person.username}.`);
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to send a chat request right now.");
        } finally {
            setBusyKey("");
        }
    }

    function resetModalState() {
        setJoinCode("");
        setJoinCodeError("");
        setSubmitting(false);
        setShowCodeJoin(false);
    }

    async function handleJoinByCode(event) {
        event.preventDefault();
        const code = String(joinCode || "").trim();
        if (!code) {
            setJoinCodeError("Enter the 6 digit room code.");
            return;
        }

        try {
            setSubmitting(true);
            setJoinCodeError("");
            dismissError();
            const room = await joinConfessionRoomByCode(code, "search_join_code");
            setJoinedRooms((prev) => {
                const roomId = Number(room && room.roomId);
                if (!roomId || prev.some((entry) => Number(entry && entry.roomId) === roomId)) return prev;
                return [room, ...prev];
            });
            setNotice(`Joined ${room.title}`);
            resetModalState();
            navigate(`/confessions?roomId=${room.roomId}`);
        } catch (err) {
            const message = err && err.message ? err.message : "Unable to join this private room.";
            if (err && [400, 404, 409].includes(Number(err.status))) {
                setJoinCodeError(message);
            } else {
                showError(message);
            }
            setSubmitting(false);
        }
    }

    const desktopTopBar = (
        <UnifiedTopBar
            className="desktop-page-topbar"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onSubmit={(event) => event.preventDefault()}
            onNotificationsClick={() => navigate("/chats?requests=1")}
            onPrimaryClick={() => navigate("/create-room", { state: { openCreateRoom: true } })}
        />
    );

    const renderContent = () => (
        <div className="search-page-container">
            <SearchTabs
                tab={tab}
                setTab={setTab}
                roomCount={roomResults.length}
                peopleCount={peopleResults.length}
                onJoinByCode={() => setShowCodeJoin(true)}
            />

            <div className={`search-results-list${tab === PEOPLE_TAB ? " search-results-list--people" : ""}`}>
               {loading && tab === ROOMS_TAB && <RoomCardSkeletonList count={4} />}
               {loading && tab === PEOPLE_TAB && <ChatListSkeleton count={4} />}

               {!loading && tab === ROOMS_TAB && roomResults.length === 0 && (
                   <p style={{ color: "#718096" }}>No rooms found matching "{query}"</p>
               )}
               {!loading && tab === ROOMS_TAB && roomResults.map((room) => (
                   <SearchRoomCard
                       key={room.roomId}
                       room={room}
                       isJoined={joinedRoomIds.has(Number(room.roomId))}
                       isBusy={busyKey === `room-${room.roomId}`}
                       onAction={handleOpenRoom}
                   />
               ))}
               {!loading && tab === ROOMS_TAB && roomHasMore && (
                   <button type="button" className="search-show-more" onClick={loadMoreRooms} disabled={loadingMoreRooms}>
                       {loadingMoreRooms ? "Loading..." : "Show more rooms"}
                   </button>
               )}

               {!loading && tab === PEOPLE_TAB && peopleResults.length === 0 && (
                   <p style={{ color: "#718096" }}>People search is private. Connect from a confession or room alias instead.</p>
               )}
               {!loading && tab === PEOPLE_TAB && peopleResults.map((person) => (
                   <SearchUserCard
                       key={person.id}
                       person={person}
                       isBusy={busyKey === `person-${person.id}`}
                       onAction={handleOpenPerson}
                   />
               ))}
               {!loading && tab === PEOPLE_TAB && peopleHasMore && (
                   <button type="button" className="search-show-more" onClick={loadMorePeople} disabled={loadingMorePeople}>
                       {loadingMorePeople ? "Loading..." : "Show more people"}
                   </button>
               )}
            </div>
        </div>
    );

    const joinCodeModal = (
        <Modal
            isOpen={showCodeJoin}
            onClose={resetModalState}
            title="Join Private Room"
            description="Enter the 6-digit room code to access this private room."
            className="search-code-modal"
        >
            <form className="search-code-modal__form" onSubmit={handleJoinByCode}>
                <Input
                    id="search-join-code"
                    label="Room code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    error={joinCodeError}
                    helperText="Only six numeric digits are accepted."
                />

                <div className="search-code-modal__actions">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={resetModalState}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isLoading={submitting}
                    >
                        Join Room
                    </Button>
                </div>
            </form>
        </Modal>
    );

    if (isDesktop) {
        return (
            <>
                {notice && <p className="search-alert search-alert--notice" style={{position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999, background: '#fff', padding: '1rem 1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}>{notice}</p>}
                
                <DesktopAppShell
                    sidebarRooms={joinedRooms}
                    onSelectSidebarRoom={(room) => navigate(`/confessions?roomId=${room.roomId}`)}
                    contentClassName="desktop-search-content"
                    topBar={desktopTopBar}
                    hideStageHeader
                >
                    {renderContent()}
                </DesktopAppShell>
                {joinCodeModal}
            </>
        );
    }

    return (
        <div className="search-mobile-page" {...swipeNavigationHandlers}>
            {notice && <p className="search-alert search-alert--notice">{notice}</p>}

            <header className="search-header">
                <h1>Search</h1>
                <p>Discover rooms and connect with others</p>
            </header>

            <div className="search-bar">
                <div className="search-bar__field">
                    <Search size={20} strokeWidth={2} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for rooms or users..."
                    />
                </div>
            </div>

            <SearchTabs
                tab={tab}
                setTab={setTab}
                roomCount={roomResults.length}
                peopleCount={peopleResults.length}
                onJoinByCode={() => setShowCodeJoin(true)}
            />

            <div className="search-content">
                <div className={`search-results-list${tab === PEOPLE_TAB ? " search-results-list--people" : ""}`}>
                    {tab === ROOMS_TAB && roomResults.length === 0 && !loading && (
                        <p style={{ color: "#718096", textAlign: "center", padding: "2rem 0" }}>
                            No rooms found{query ? ` matching "${query}"` : ". Try a search above."}
                        </p>
                    )}
                    {tab === ROOMS_TAB && roomResults.map((room) => (
                        <SearchRoomCard
                            key={room.roomId}
                            room={room}
                            isJoined={joinedRoomIds.has(Number(room.roomId))}
                            isBusy={busyKey === `room-${room.roomId}`}
                            onAction={handleOpenRoom}
                        />
                    ))}
                    {tab === ROOMS_TAB && roomHasMore && (
                        <button type="button" className="search-show-more" onClick={loadMoreRooms} disabled={loadingMoreRooms}>
                            {loadingMoreRooms ? "Loading..." : "Show more rooms"}
                        </button>
                    )}

                    {tab === PEOPLE_TAB && peopleResults.length === 0 && !loading && (
                        <p style={{ color: "#718096", textAlign: "center", padding: "2rem 0" }}>
                            People search is private. Connect from a confession or room alias instead.
                        </p>
                    )}
                    {tab === PEOPLE_TAB && peopleResults.map((person) => (
                        <SearchUserCard
                            key={person.id}
                            person={person}
                            isBusy={busyKey === `person-${person.id}`}
                            onAction={handleOpenPerson}
                        />
                    ))}
                    {tab === PEOPLE_TAB && peopleHasMore && (
                        <button type="button" className="search-show-more" onClick={loadMorePeople} disabled={loadingMorePeople}>
                            {loadingMorePeople ? "Loading..." : "Show more people"}
                        </button>
                    )}

                    {loading && (
                        <p style={{ color: "#718096", textAlign: "center", padding: "2rem 0" }}>Searching...</p>
                    )}
                </div>
            </div>

            {joinCodeModal}
        </div>
    );
}
