import { useNavigate } from "react-router-dom";
import { RoomCardSkeletonList } from "../../../components/common/LoadingStates.jsx";
import {
    AmbienceRoomCard,
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
                        {joinedRooms.map((room) => (
                            <AmbienceRoomCard
                                key={room.roomId}
                                room={room}
                                isJoined={true}
                                onAction={() => onOpenRoom(room.roomId)}
                            />
                        ))}
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
                    {joinedRooms.map((room) => (
                        <AmbienceRoomCard
                            key={room.roomId}
                            room={room}
                            isJoined={true}
                            onAction={() => onOpenRoom(room.roomId)}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
