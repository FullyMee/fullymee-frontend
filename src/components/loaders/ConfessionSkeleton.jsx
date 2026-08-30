import React from "react";
import Skeleton from "./Skeleton.jsx";

/**
 * Confession detail skeleton — card with reply placeholders.
 * @param {number} [props.count] - Number of confession skeleton cards
 * @param {boolean} [props.showReplies] - Show reply skeletons
 */
export default function ConfessionSkeleton({ count = 2, showReplies = true }) {
    return (
        <div className="fm-confession-skeleton" aria-hidden="true">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="fm-confession-skeleton__card">
                    <div className="fm-feed-skeleton__header">
                        <Skeleton variant="circle" width="32px" height="32px" />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                            <Skeleton width="35%" height="0.8rem" />
                            <Skeleton width="20%" height="0.65rem" />
                        </div>
                    </div>
                    <div className="fm-feed-skeleton__body" style={{ marginTop: "0.6rem" }}>
                        <Skeleton width="100%" height="0.8rem" />
                        <Skeleton width="85%" height="0.8rem" />
                        <Skeleton width="40%" height="0.8rem" />
                    </div>
                    <div className="fm-feed-skeleton__actions" style={{ marginTop: "0.5rem" }}>
                        <Skeleton width="2.5rem" height="1.2rem" borderRadius="8px" />
                        <Skeleton width="2.5rem" height="1.2rem" borderRadius="8px" />
                    </div>
                    {showReplies && i === 0 && (
                        <div className="fm-confession-skeleton__replies">
                            {Array.from({ length: 2 }, (_, j) => (
                                <div key={j} className="fm-confession-skeleton__reply">
                                    <Skeleton variant="circle" width="24px" height="24px" />
                                    <div className="fm-confession-skeleton__reply-body">
                                        <Skeleton width="30%" height="0.7rem" />
                                        <Skeleton width="70%" height="0.7rem" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
