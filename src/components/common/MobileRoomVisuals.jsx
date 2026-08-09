import { Circle, Lightbulb, Smile, Sparkles } from "lucide-react";
import { getImageForAmbienceId } from "../../config/ambienceLibrary.js";

function normalizeSource(roomLike) {
    return `${roomLike && roomLike.category ? roomLike.category : ""} ${roomLike && roomLike.roomCategory ? roomLike.roomCategory : ""} ${roomLike && roomLike.title ? roomLike.title : ""} ${roomLike && roomLike.roomTitle ? roomLike.roomTitle : ""} ${roomLike && roomLike.description ? roomLike.description : ""}`
        .trim()
        .toLowerCase();
}

export function getRoomTone(roomLike) {
    const source = normalizeSource(roomLike);

    if (source.includes("advice") || source.includes("career") || source.includes("placement") || source.includes("startup")) {
        return "advice";
    }

    if (source.includes("chill") || source.includes("funny") || source.includes("laugh")) {
        return "chill";
    }

    if (source.includes("daily") || source.includes("late night") || source.includes("college") || source.includes("workplace") || source.includes("random")) {
        return "daily";
    }

    return "general";
}

export function getRoomBadgeLabel(roomLike) {
    const tone = getRoomTone(roomLike);
    if (tone === "advice") return "advice";
    if (tone === "chill") return "chill";
    if (tone === "daily") return "daily";
    return "room";
}

export function formatCompactMemberCount(value) {
    const count = Number(value && value.currentUserCount !== undefined ? value.currentUserCount : value);
    if (!Number.isFinite(count) || count <= 0) return "New room";
    return `${new Intl.NumberFormat("en-US").format(count)} members`;
}

export function getChatAvatarGlyph(seed) {
    const glyphs = ["🦊", "🌙", "🛠️", "🦉", "💙", "⭐", "🌿", "🎧"];
    const source = String(seed || "");
    let total = 0;

    for (let index = 0; index < source.length; index += 1) {
        total = (total + source.charCodeAt(index) * (index + 3)) % 10007;
    }

    return glyphs[total % glyphs.length];
}

export function RoomGlyphIcon({ tone }) {
    if (tone === "advice") {
        return <Lightbulb size={18} strokeWidth={2} />;
    }

    if (tone === "chill") {
        return <Smile size={18} strokeWidth={2} />;
    }

    if (tone === "general") {
        return <Sparkles size={18} strokeWidth={2} />;
    }

    return <Circle size={18} strokeWidth={2} />;
}


export function getRoomAmbienceUrl(room) {
    if (!room) return '/ambience/late_night/moonlit_window.png';
    return getImageForAmbienceId(room.ambienceId);
}

export function AmbienceRoomCard({
    room,
    isJoined = false,
    isBusy = false,
    onAction,
    className = ""
}) {
    const imageUrl = getRoomAmbienceUrl(room);
    const title = room?.title || room?.roomTitle || "Untitled Room";
    const isPrivate = room?.roomType === "private";
    const memberCount = Number(room?.currentUserCount) || 0;
    const tone = getRoomTone(room);

    const glyphsByTone = {
        advice: "☀️",
        chill: "🔮",
        daily: "🌙",
        general: "✨"
    };
    const cornerGlyph = glyphsByTone[tone] || "🌙";

    const memberLabel = memberCount > 0 
        ? `${memberCount.toLocaleString()} ${memberCount === 1 ? 'Person' : 'People'} Sharing`
        : 'Active space';

    return (
        <button
            type="button"
            className={`ambience-room-card ${className}`}
            onClick={() => onAction && onAction(room)}
            disabled={isBusy}
            aria-label={`${isJoined ? "Open" : "Join"} ${title}`}
        >
            <div 
                className="ambience-room-card__image" 
                style={{ backgroundImage: `url('${imageUrl}')` }} 
            />
            <div className="ambience-room-card__tint" />
            <div className="ambience-room-card__overlay" />
            <div className="ambience-room-card__content">
                <div className="ambience-room-card__top">
                    <span className="ambience-room-card__badge">
                        {isPrivate ? "🔒 Private" : "🌐 Public"}
                    </span>
                    <span className="ambience-room-card__glyph">{cornerGlyph}</span>
                </div>

                <div className="ambience-room-card__bottom">
                    <h3 className="ambience-room-card__title" title={title}>{title}</h3>
                    <div className="ambience-room-card__footer">
                        <span className="ambience-room-card__meta">{memberLabel}</span>
                        <span className="ambience-room-card__cta">
                            <span>{isJoined ? "Open" : "Join"}</span>
                            <span className="ambience-room-card__arrow">→</span>
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
}
