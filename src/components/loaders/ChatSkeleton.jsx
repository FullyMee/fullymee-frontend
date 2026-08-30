import React from "react";
import Skeleton from "./Skeleton.jsx";

/**
 * Chat list skeleton — avatar + text lines per conversation.
 * @param {number} [props.count] - Number of skeleton items
 */
export function ChatListSkeleton({ count = 5 }) {
    return (
        <div className="fm-chat-list-skeleton" aria-hidden="true">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="fm-chat-list-skeleton__item">
                    <Skeleton variant="circle" width="2.8rem" height="2.8rem" />
                    <div className="fm-chat-list-skeleton__lines">
                        <Skeleton width="70%" height="0.7rem" />
                        <Skeleton width="45%" height="0.6rem" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Chat thread skeleton — alternating left/right message bubbles.
 * @param {number} [props.count] - Number of skeleton bubbles
 */
export function ChatThreadSkeleton({ count = 5 }) {
    return (
        <div className="fm-chat-thread-skeleton" aria-hidden="true">
            {Array.from({ length: count }, (_, i) => (
                <Skeleton
                    key={i}
                    variant="rect"
                    width={i % 2 === 0 ? "55%" : "40%"}
                    height="2.4rem"
                    className="fm-chat-thread-skeleton__bubble"
                />
            ))}
        </div>
    );
}
