import React, { useState, useEffect } from "react";
import { getRoomImageUrl, getRoomTone, RoomGlyphIcon } from "./MobileRoomVisuals.jsx";
import "./RoomAvatar.css";

/**
 * RoomAvatar component renders a room/circle image in a circular avatar format
 * with an automatic fallback to the room's glyph/tone on loading failure.
 *
 * @param {Object} props
 * @param {Object|string} props.room The room object or image url
 * @param {string} [props.alt] Alt text for the image
 * @param {string} [props.className] Additional CSS class names
 * @param {string} [props.tone] Optional custom tone ('daily' | 'advice' | 'chill' | 'general')
 * @param {string} [props.size] Optional CSS size (e.g. '1.95rem', '1.7rem')
 * @param {Object} [props.style] Optional inline style
 */
export default function RoomAvatar({
    room,
    alt = "",
    className = "",
    tone: customTone,
    size,
    style,
    "aria-hidden": ariaHidden,
    ...props
}) {
    const tone = customTone || getRoomTone(room);
    const imageUrl = getRoomImageUrl(room);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [imageUrl]);

    const inlineStyle = {
        ...(size ? { width: size, height: size } : {}),
        ...style
    };

    if (hasError || !imageUrl) {
        return (
            <span
                className={`room-avatar room-avatar--fallback room-avatar--${tone} ${className}`.trim()}
                style={inlineStyle}
                data-testid="room-avatar-fallback"
                {...(ariaHidden !== undefined ? { "aria-hidden": ariaHidden } : {})}
                {...props}
            >
                <RoomGlyphIcon tone={tone} />
            </span>
        );
    }

    return (
        <span
            className={`room-avatar ${className}`.trim()}
            style={inlineStyle}
            data-testid="room-avatar"
            {...(ariaHidden !== undefined ? { "aria-hidden": ariaHidden } : {})}
            {...props}
        >
            <img
                src={imageUrl}
                alt={alt}
                className="room-avatar__img"
                loading="lazy"
                draggable="false"
                onError={() => setHasError(true)}
            />
        </span>
    );
}
