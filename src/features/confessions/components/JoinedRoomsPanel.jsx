import { Link } from "react-router-dom";
import DesktopEmptyState from "../../../components/common/DesktopEmptyState.jsx";
import { RoomCardSkeletonList } from "../../../components/common/LoadingStates.jsx";
import {
    formatCompactMemberCount,
    getRoomBadgeLabel,
    getRoomTone,
    RoomGlyphIcon
} from "../../../components/common/MobileRoomVisuals.jsx";
import { ChevronRight } from "lucide-react";

function formatRoomAccess(room) {
    return room && room.roomType === "private" ? "Private" : "Public";
}

export default function JoinedRoomsPanel({
    isDesktop = false,
    loadingRooms,
    joinedRooms,
    onOpenRoom
}) {
    const emptyJoinedRooms = !loadingRooms && joinedRooms.length === 0;

    if (isDesktop) {
        return (
            <>
                {loadingRooms && <RoomCardSkeletonList count={4} />}

                {emptyJoinedRooms && (
                    <DesktopEmptyState
                        title="No joined rooms yet"
                        description="Discover and join rooms from Home to start posting and replying."
                        action={<Link to="/" className="chat-empty-card__link">Discover Rooms</Link>}
                    />
                )}

                {!loadingRooms && joinedRooms.length > 0 && (
                    <div className="desktop-room-grid">
                        {joinedRooms.map((room) => {
                            const tone = getRoomTone(room);
                            const description = room.description || "A quiet space for honest conversations.";
                            const quote = String(room.previewText || room.highlight || "").trim();
                            const shouldShowQuote = Boolean(quote) && quote.toLowerCase() !== description.toLowerCase();
                            const memberCount = formatCompactMemberCount(room.currentUserCount);
                            return (
                                <button
                                    key={room.roomId}
                                    type="button"
                                    className={`desktop-room-card desktop-room-card--${tone} is-joined`}
                                    onClick={() => onOpenRoom(room.roomId)}
                                >
                                    <div className="desktop-room-card__hero">
                                        <div className={`desktop-room-card__visual desktop-room-card__visual--${tone}`} aria-hidden="true">
                                            <RoomGlyphIcon tone={tone} />
                                        </div>
                                        <div className="desktop-room-card__chips">
                                            <span className="desktop-room-card__chip desktop-room-card__chip--muted">Room</span>
                                            <span className="desktop-room-card__chip desktop-room-card__chip--muted">{formatRoomAccess(room)}</span>
                                        </div>
                                        <span className="desktop-room-card__state">Joined</span>
                                    </div>

                                    <div className="desktop-room-card__main">
                                        <h2>{room.title}</h2>
                                        <p className="desktop-room-card__description">{description}</p>

                                        {shouldShowQuote && (
                                            <blockquote className="desktop-room-card__quote">
                                                <p>{`"${quote}"`}</p>
                                            </blockquote>
                                        )}
                                    </div>

                                    <div className="desktop-room-card__meta">
                                        <span className="desktop-room-card__members">{memberCount}</span>
                                            <span className="desktop-room-card__cta">
                                                <span>Open room</span>
                                                <ChevronRight size={18} strokeWidth={2} />
                                            </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </>
        );
    }

    return (
        <main className="my-confessions-content my-confessions-content--rooms">
            {loadingRooms && <RoomCardSkeletonList count={4} />}

            {emptyJoinedRooms && (
                <section className="my-confessions-empty-card">
                    <h2>No joined rooms yet</h2>
                    <p>Discover and join rooms from the home screen to start posting and replying.</p>
                    <Link to="/" className="my-confessions-primary-link">Discover Rooms</Link>
                </section>
            )}

            {!loadingRooms && joinedRooms.length > 0 && (
                <div className="my-confessions-room-list">
                    {joinedRooms.map((room) => {
                        const tone = getRoomTone(room);
                        return (
                            <button
                                key={room.roomId}
                                type="button"
                                className={`discover-room-card discover-room-card--${tone} is-joined`}
                                onClick={() => onOpenRoom(room.roomId)}
                            >
                                <div className="discover-room-card__hero">
                                    <div className={`discover-room-card__visual discover-room-card__visual--${tone}`} aria-hidden="true">
                                        <RoomGlyphIcon tone={tone} />
                                    </div>
                                    <div className="discover-room-card__chips">
                                        <span className={`discover-room-card__badge discover-room-card__badge--${tone}`}>
                                            {getRoomBadgeLabel(room)}
                                        </span>
                                        <span className="discover-room-card__access">
                                            {formatRoomAccess(room)}
                                        </span>
                                    </div>
                                    <div className="discover-room-card__jump" aria-hidden="true">
                                        <ArrowRightIcon />
                                    </div>
                                </div>

                                <div className="discover-room-card__main">
                                    <div className="discover-room-card__top">
                                        <h3>{room.title}</h3>
                                        <span className="discover-room-card__state">Joined</span>
                                    </div>
                                    <p>{room.description || "Open the room to read confessions and join the conversation."}</p>
                                </div>

                                <div className="discover-room-card__meta">
                                    <div className="discover-room-card__presence" aria-hidden="true">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                    <span className="discover-room-card__members">{formatCompactMemberCount(room.currentUserCount)}</span>
                                    <span className="discover-room-card__cta">
                                        <span>Open room</span>
                                        <ChevronRight size={18} strokeWidth={2} />
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
