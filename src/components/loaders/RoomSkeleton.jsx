import React from "react";
import Skeleton from "./Skeleton.jsx";

/**
 * Room card skeleton — matches the vertical AmbienceRoomCard grid UI layout.
 * @param {number} [props.count] - Number of room skeleton cards
 * @param {'grid'|'list'} [props.variant] - Layout variant ('grid' for desktop/mobile grid, 'list' for compact rows)
 */
export default function RoomSkeleton({ count = 4, variant = "grid" }) {
    return (
        <div className={`fm-room-skeleton-grid${variant === "list" ? " fm-room-skeleton-grid--list" : ""}`} aria-hidden="true">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="fm-room-card-skeleton">
                    <div className="fm-room-card-skeleton__top">
                        <Skeleton width="60px" height="22px" borderRadius="12px" />
                        <Skeleton width="22px" height="22px" borderRadius="50%" />
                    </div>
                    <div className="fm-room-card-skeleton__bottom">
                        <Skeleton width="82%" height="1.3rem" borderRadius="6px" />
                        <Skeleton width="55%" height="0.9rem" borderRadius="4px" style={{ marginTop: '0.35rem' }} />
                        <div className="fm-room-card-skeleton__footer">
                            <Skeleton width="75px" height="0.75rem" borderRadius="4px" />
                            <Skeleton width="65px" height="26px" borderRadius="999px" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
