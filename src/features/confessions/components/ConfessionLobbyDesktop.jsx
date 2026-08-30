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
                                <h1>Your Circles</h1>
                                <p>Circles you have joined and communities where you can post.</p>
                            </section>

                            <section className="desktop-pill-tabs desktop-confessions-hub__filters" aria-label="Circle filters">
                                {[{ key: "All", label: "All" }, { key: "Public", label: "Fume Circles" }, { key: "Private", label: "Inner Circles" }].map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        className={`desktop-pill-tabs__item${roomFilter === item.key ? " is-active" : ""}`}
                                        onClick={() => onRoomFilterChange(item.key)}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </section>

                            {loadingRooms && <JoinedRoomsPanel isDesktop loadingRooms={loadingRooms} joinedRooms={filteredJoinedRooms.length > 0 ? filteredJoinedRooms : joinedRooms} onOpenRoom={onOpenRoom} />}

                            {!loadingRooms && filteredJoinedRooms.length === 0 && joinedRooms.length === 0 && (
                                <JoinedRoomsPanel isDesktop loadingRooms={loadingRooms} joinedRooms={[]} onOpenRoom={onOpenRoom} />
                            )}

                            {!loadingRooms && filteredJoinedRooms.length === 0 && joinedRooms.length > 0 && (
                                <DesktopEmptyState
                                    title="No circles match this filter"
                                    description="Try another filter or clear the search bar to see your joined circles."
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
