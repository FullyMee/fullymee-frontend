import DesktopAppShell from "../../../components/layout/DesktopAppShell.jsx";
import CommunityHubRail from "../../../components/common/CommunityHubRail.jsx";
import DesktopEmptyState from "../../../components/common/DesktopEmptyState.jsx";
import JoinedRoomsPanel from "./JoinedRoomsPanel.jsx";

export default function ConfessionLobbyDesktop({
    notice,
    topBar,
    sidebarRooms,
    selectedSidebarRoomId,
    onSelectSidebarRoom,
    roomFilter,
    onRoomFilterChange,
    loadingRooms,
    joinedRooms,
    filteredJoinedRooms,
    onOpenRoom,
    activeRooms,
    activeRoomsLabel,
    suggestionsLabel,
    confessionsToday,
    supportGiven,
    rooms,
    onJoinRoom,
    emptyMessage,
    showFooter
}) {
    return (
        <div className="my-confessions-page my-confessions-page--desktop">
            {notice && <p className="my-confessions-alert my-confessions-alert--notice">{notice}</p>}
            <DesktopAppShell
                sidebarRooms={sidebarRooms}
                selectedSidebarRoomId={selectedSidebarRoomId}
                onSelectSidebarRoom={onSelectSidebarRoom}
                topBar={topBar}
                hideStageHeader
                contentClassName="my-confessions-page__lobby-stage"
            >
                <div className="home-content-grid my-confessions-lobby-grid">
                    <section className="home-feed-column my-confessions-lobby-grid__main">
                        <div className="desktop-confessions-hub">
                            <section className="desktop-confessions-hub__hero">
                                <h1>Your Confession Rooms</h1>
                                <p>Rooms you have joined and communities where you can post.</p>
                            </section>

                            <section className="desktop-pill-tabs desktop-confessions-hub__filters" aria-label="Room filters">
                                {["All", "Joined", "Public", "Private", "Late Night", "Heartbreak"].map((label) => (
                                    <button
                                        key={label}
                                        type="button"
                                        className={`desktop-pill-tabs__item${roomFilter === label ? " is-active" : ""}`}
                                        onClick={() => onRoomFilterChange(label)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </section>

                            {loadingRooms && <JoinedRoomsPanel isDesktop loadingRooms={loadingRooms} joinedRooms={[]} onOpenRoom={onOpenRoom} />}

                            {!loadingRooms && filteredJoinedRooms.length === 0 && joinedRooms.length === 0 && (
                                <JoinedRoomsPanel isDesktop loadingRooms={loadingRooms} joinedRooms={[]} onOpenRoom={onOpenRoom} />
                            )}

                            {!loadingRooms && filteredJoinedRooms.length === 0 && joinedRooms.length > 0 && (
                                <DesktopEmptyState
                                    title="No rooms match this filter"
                                    description="Try another filter or clear the search bar to see your joined rooms."
                                    action={null}
                                />
                            )}

                            {!loadingRooms && filteredJoinedRooms.length > 0 && (
                                <JoinedRoomsPanel
                                    isDesktop
                                    loadingRooms={loadingRooms}
                                    joinedRooms={filteredJoinedRooms}
                                    onOpenRoom={onOpenRoom}
                                />
                            )}
                        </div>
                    </section>

                    <CommunityHubRail
                        activeRooms={activeRooms}
                        activeRoomsLabel={activeRoomsLabel}
                        suggestionsLabel={suggestionsLabel}
                        confessionsToday={confessionsToday}
                        supportGiven={supportGiven}
                        rooms={rooms}
                        onJoinRoom={onJoinRoom}
                        emptyMessage={emptyMessage}
                        showFooter={showFooter}
                    />
                </div>
            </DesktopAppShell>
        </div>
    );
}
