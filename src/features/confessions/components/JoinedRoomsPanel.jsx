import { useNavigate } from "react-router-dom";
import { RoomCardSkeletonList } from "../../../components/common/LoadingStates.jsx";
import {
    formatCompactMemberCount,
    getRoomBadgeLabel,
    getRoomTone,
    RoomGlyphIcon
} from "../../../components/common/MobileRoomVisuals.jsx";
import { ChevronRight, Compass, Sparkles } from "lucide-react";

function formatRoomAccess(room) {
    return room && room.roomType === "private" ? "Private" : "Public";
}

/* ── Desktop no-rooms empty state ── */
function DesktopNoRooms() {
    const navigate = useNavigate();
    return (
        <div className="joined-rooms-empty">
            {/* Decorative glyph cluster */}
            <div className="joined-rooms-empty__glyphs" aria-hidden="true">
                <span className="joined-rooms-empty__glyph joined-rooms-empty__glyph--a">🌊</span>
                <span className="joined-rooms-empty__glyph joined-rooms-empty__glyph--b">🌙</span>
                <span className="joined-rooms-empty__glyph joined-rooms-empty__glyph--c">🔮</span>
            </div>

            <div className="joined-rooms-empty__body">
                <Compass size={32} strokeWidth={1.4} className="joined-rooms-empty__icon" />
                <h2 className="joined-rooms-empty__title">No rooms joined yet</h2>
                <p className="joined-rooms-empty__sub">
                    Find a space that resonates with you — explore public and late-night rooms
                    and start sharing your thoughts anonymously.
                </p>
                <button
                    type="button"
                    className="joined-rooms-empty__cta"
                    onClick={() => navigate("/search?tab=rooms")}
                >
                    <Sparkles size={15} strokeWidth={2} />
                    Discover Rooms
                </button>
            </div>
        </div>
    );
}

/* ── Mobile no-rooms empty state ── */
function MobileNoRooms() {
    const navigate = useNavigate();
    return (
        <section className="my-confessions-empty-card my-confessions-empty-card--rooms">
            <Compass size={28} strokeWidth={1.4} className="my-confessions-empty-card__icon" />
            <h2>No joined rooms yet</h2>
            <p>Discover and join rooms to start posting and replying anonymously.</p>
            <button
                type="button"
                className="my-confessions-primary-link"
                onClick={() => navigate("/search?tab=rooms")}
            >
                Discover Rooms
            </button>
        </section>
    );
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

                {emptyJoinedRooms && <DesktopNoRooms />}

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

            {emptyJoinedRooms && <MobileNoRooms />}

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
                                        <ChevronRight size={18} />
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
