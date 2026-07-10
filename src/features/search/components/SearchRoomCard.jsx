import React from "react";
import { RoomGlyphIcon, formatCompactMemberCount, getRoomTone, getRoomBadgeLabel } from "../../../components/common/MobileRoomVisuals.jsx";
import { ArrowUpRight } from "lucide-react";

export default function SearchRoomCard({ room, isJoined, isBusy, onAction }) {
    const tone = getRoomTone(room);
    const badgeLabel = getRoomBadgeLabel(room);
    const isPrivate = room.roomType === "private";

    return (
        <article className="search-room-card">
            <div className={`search-room-card__avatar search-room-card__avatar--${tone}`} aria-hidden="true">
                <RoomGlyphIcon tone={tone} />
            </div>

            <div className="search-room-card__body">
                <div className="search-room-card__topline">
                    <h3>{room.title || "Untitled Room"}</h3>
                    <button
                        type="button"
                        className="search-room-card__icon-button"
                        onClick={() => onAction(room)}
                        disabled={isBusy}
                        aria-label={`${isJoined ? "Open" : "Join"} ${room.title || "room"}`}
                    >
                        {isBusy ? (
                            <span className="search-room-card__loader" aria-hidden="true" />
                        ) : (
                            <ArrowUpRight size={18} strokeWidth={2.25} />
                        )}
                    </button>
                </div>

                <div className="search-room-card__meta">
                    <span className={`search-room-card__badge search-room-card__badge--${tone}`}>
                        {badgeLabel}
                    </span>
                    <span className="search-room-card__meta-item">{isPrivate ? "Private" : "Public"}</span>
                    <span className="search-room-card__meta-item">{formatCompactMemberCount(room)}</span>
                    {isJoined && <span className="search-room-card__state">Joined</span>}
                </div>

                <p className="search-room-card__description">
                    {room.description || "Join this anonymous room and start talking."}
                </p>
            </div>
        </article>
    );
}
