import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import DesktopAppShell from "../components/layout/DesktopAppShell.jsx";
import UnifiedTopBar from "../components/layout/UnifiedTopBar.jsx";
import SearchRoomsSheet from "../components/common/SearchRoomsSheet.jsx";
import { useGlobalError } from "../context/ErrorContext.jsx";
import { ConnectionSkeleton, RoomSkeleton } from "../components/loaders";
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
        joinedRoomIds,
        removePerson,
        addPersonToHistory
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
                if (joinedRooms.length >= 5) {
                    showError("You can join max 5 circles at a time.");
                    return;
                }
                await joinConfessionRoom({ roomId, joinSource: "search_page" });
                setJoinedRooms((prev) => {
                    if (prev.some((item) => Number(item && item.roomId) === roomId)) return prev;
                    return [...prev, room];
                });
                setNotice(`Joined ${room.title}`);
            }

            navigate(`/confessions?roomId=${roomId}`);
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to open this circle.");
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
            setJoinCodeError("Enter the 6 digit join code.");
            return;
        }

        if (joinedRooms.length >= 5) {
            setJoinCodeError("You can join max 5 circles at a time.");
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
               {loading && tab === ROOMS_TAB && <RoomSkeleton count={roomResults.length > 0 ? roomResults.length : 4} />}
               {loading && tab === PEOPLE_TAB && <ConnectionSkeleton count={peopleResults.length > 0 ? peopleResults.length : 4} />}

               {!loading && tab === ROOMS_TAB && roomResults.length === 0 && (
                   <div
                       className="search-empty-state-card"
                       style={{
                           gridColumn: "1 / -1",
                           display: "flex",
                           flexDirection: "column",
                           alignItems: "center",
                           justifyContent: "center",
                           textAlign: "center",
                           padding: "3.5rem 1.5rem",
                           margin: "1rem auto 3rem",
                           maxWidth: "560px",
                           width: "100%",
                           background: "rgba(255, 255, 255, 0.7)",
                           backdropFilter: "blur(8px)",
                           borderRadius: "24px",
                           border: "1px solid rgba(80, 45, 65, 0.08)",
                           boxShadow: "0 10px 30px rgba(60, 30, 50, 0.04)"
                       }}
                   >
                       <div
                           style={{
                               width: "3.6rem",
                               height: "3.6rem",
                               borderRadius: "50%",
                               background: "rgba(80, 45, 65, 0.06)",
                               display: "grid",
                               placeItems: "center",
                               color: "#6e5264",
                               marginBottom: "1.2rem"
                           }}
                       >
                           <Search size={24} strokeWidth={2.2} />
                       </div>
                       <h3
                           style={{
                               fontFamily: "var(--font-sans, system-ui, sans-serif)",
                               fontSize: "1.25rem",
                               fontWeight: 700,
                               color: "#3b1b36",
                               margin: "0 0 0.5rem"
                           }}
                       >
                           No circles found
                       </h3>
                       <p
                           style={{
                               fontSize: "0.95rem",
                               color: "#7a6b72",
                               margin: 0,
                               lineHeight: 1.55,
                               wordBreak: "break-word",
                               overflowWrap: "anywhere",
                               maxWidth: "460px"
                           }}
                       >
                           {query
                               ? `No circles match "${query}". Try searching for another topic or feeling.`
                               : "No circles available right now. Check back soon or create one."}
                       </p>
                   </div>
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
                       {loadingMoreRooms ? "Loading..." : "Show more circles"}
                   </button>
               )}

               {!loading && tab === PEOPLE_TAB && peopleResults.length === 0 && (
                   <div
                       className="search-empty-state-card"
                       style={{
                           gridColumn: "1 / -1",
                           display: "flex",
                           flexDirection: "column",
                           alignItems: "center",
                           justifyContent: "center",
                           textAlign: "center",
                           padding: "3.5rem 1.5rem",
                           margin: "1rem auto 3rem",
                           maxWidth: "560px",
                           width: "100%",
                           background: "rgba(255, 255, 255, 0.7)",
                           backdropFilter: "blur(8px)",
                           borderRadius: "24px",
                           border: "1px solid rgba(80, 45, 65, 0.08)",
                           boxShadow: "0 10px 30px rgba(60, 30, 50, 0.04)"
                       }}
                   >
                       <div
                           style={{
                               width: "3.6rem",
                               height: "3.6rem",
                               borderRadius: "50%",
                               background: "rgba(80, 45, 65, 0.06)",
                               display: "grid",
                               placeItems: "center",
                               color: "#6e5264",
                               marginBottom: "1.2rem"
                           }}
                       >
                           <Search size={24} strokeWidth={2.2} />
                       </div>
                       <h3
                           style={{
                               fontFamily: "var(--font-sans, system-ui, sans-serif)",
                               fontSize: "1.25rem",
                               fontWeight: 700,
                               color: "#3b1b36",
                               margin: "0 0 0.5rem"
                           }}
                       >
                           No people found
                       </h3>
                       <p
                           style={{
                               fontSize: "0.95rem",
                               color: "#7a6b72",
                               margin: 0,
                               lineHeight: 1.55,
                               wordBreak: "break-word",
                               overflowWrap: "anywhere",
                               maxWidth: "460px"
                           }}
                       >
                           {query
                               ? `No people match "${query}". Try searching by a different username.`
                               : "No recent people searched yet. Search for someone above to connect."}
                       </p>
                   </div>
               )}
               {!loading && tab === PEOPLE_TAB && peopleResults.map((person) => (
                   <SearchUserCard
                       key={person.id || person.userId}
                       person={person}
                       isBusy={busyKey === `person-${person.id || person.userId}`}
                       onRemove={() => removePerson(person.id || person.userId)}
                       onClickCard={addPersonToHistory}
                   />
               ))}
            </div>
        </div>
    );

    const joinCodeModal = (
        <Modal
            isOpen={showCodeJoin}
            onClose={resetModalState}
            title="Join Inner Circle"
            description="Enter the 6-digit join code to access this inner circle."
            className="search-code-modal"
        >
            <form className="search-code-modal__form" onSubmit={handleJoinByCode}>
                <Input
                    id="search-join-code"
                    label="Join code"
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
                        Join Circle
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

    const location = useLocation();

    return (
        <div className="search-mobile-page" {...swipeNavigationHandlers}>
            {notice && <p className="search-alert search-alert--notice">{notice}</p>}

            <SearchTabs
                tab={tab}
                setTab={setTab}
                roomCount={roomResults.length}
                peopleCount={peopleResults.length}
                onJoinByCode={() => setShowCodeJoin(true)}
            />

            <div className="search-content">
                <div className={`search-results-list${tab === PEOPLE_TAB ? " search-results-list--people" : ""}`}>
                    {loading && tab === ROOMS_TAB && <RoomSkeleton count={roomResults.length > 0 ? roomResults.length : 4} />}
                    {loading && tab === PEOPLE_TAB && <ConnectionSkeleton count={peopleResults.length > 0 ? peopleResults.length : 4} />}

                    {!loading && tab === ROOMS_TAB && roomResults.length === 0 && (
                        <p style={{ color: "#718096", textAlign: "center", padding: "2rem 0", wordBreak: "break-word", overflowWrap: "anywhere", maxWidth: "100%" }}>
                            No circles found{query ? ` matching "${query}"` : "."}
                        </p>
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
                        <p style={{ color: "#718096", textAlign: "center", padding: "2rem 0" }}>
                            No recent searches found{query ? ` matching "${query}"` : "."}
                        </p>
                    )}
                    {!loading && tab === PEOPLE_TAB && peopleResults.map((person) => (
                        <SearchUserCard
                            key={person.id || person.userId}
                            person={person}
                            isBusy={busyKey === `person-${person.id || person.userId}`}
                            onRemove={() => removePerson(person.id || person.userId)}
                            onClickCard={addPersonToHistory}
                        />
                    ))}
                </div>
            </div>

            {joinCodeModal}

            <SearchRoomsSheet
                isOpen={new URLSearchParams(location.search).get("search") === "1"}
                onClose={() => navigate("/search", { replace: true })}
                rooms={roomResults}
                people={peopleResults}
                initialTab={tab}
                scope="global"
                onSelectRoom={handleOpenRoom}
                onSelectPerson={(person) => {
                    addPersonToHistory(person);
                    navigate(`/user/${person.username || person.userId || person.id}`, { state: { profileUser: person } });
                }}
                onRemovePerson={(person) => removePerson(person.id || person.userId)}
                busyKey={busyKey}
            />
        </div>
    );
}
