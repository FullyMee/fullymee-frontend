import React from "react";
import Skeleton from "./Skeleton.jsx";

/**
 * Feed skeleton — reproduces the confession/post feed card structure.
 * Supports desktop-social-post dimensions for desktop/laptop view as well as responsive mobile cards.
 *
 * @param {Object} props
 * @param {number} [props.count=3] - Number of skeleton cards to render
 * @param {boolean} [props.isDesktop=false] - Whether to render in desktop social post layout
 * @param {string} [props.className=""] - Extra CSS class
 */
export default function FeedSkeleton({ count = 3, isDesktop = false, className = "" }) {
    const cardCount = Math.max(1, Number(count) || 3);

    if (isDesktop) {
        return (
            <div className={`desktop-social-feed fm-feed-skeleton--desktop ${className}`.trim()} aria-hidden="true">
                {Array.from({ length: cardCount }, (_, i) => (
                    <article key={i} className="desktop-social-post fm-feed-skeleton__card--desktop">
                        <header className="desktop-social-post__header" style={{ display: "flex", alignItems: "center", gap: "0.7rem", width: "100%" }}>
                            <Skeleton variant="circle" width="2.6rem" height="2.6rem" />
                            <div className="desktop-social-post__meta" style={{ flex: 1, display: "grid", gap: "0.35rem" }}>
                                <Skeleton width="38%" height="0.95rem" />
                                <Skeleton width="18%" height="0.75rem" />
                            </div>
                        </header>
                        <div className="desktop-social-post__content" style={{ cursor: "default" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", width: "100%" }}>
                                <Skeleton width="96%" height="1.1rem" />
                                <Skeleton width="88%" height="1.1rem" />
                                <Skeleton width="58%" height="1.1rem" />
                            </div>
                        </div>
                        <div className="desktop-social-post__actions" style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
                            <Skeleton width="2.8rem" height="1.3rem" borderRadius="6px" />
                            <Skeleton width="2.8rem" height="1.3rem" borderRadius="6px" />
                            <Skeleton width="1.8rem" height="1.3rem" borderRadius="6px" />
                        </div>
                    </article>
                ))}
            </div>
        );
    }

    return (
        <div className={`fm-feed-skeleton ${className}`.trim()} aria-hidden="true">
            {Array.from({ length: cardCount }, (_, i) => (
                <article key={i} className="fm-feed-skeleton__card">
                    <div className="fm-feed-skeleton__header">
                        <Skeleton variant="circle" width="2.2rem" height="2.2rem" />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                            <Skeleton width="38%" height="0.85rem" />
                            <Skeleton width="20%" height="0.7rem" />
                        </div>
                    </div>
                    <div className="fm-feed-skeleton__body">
                        <Skeleton width="98%" height="0.85rem" />
                        <Skeleton width="90%" height="0.85rem" />
                        <Skeleton width="55%" height="0.85rem" />
                    </div>
                    <div className="fm-feed-skeleton__actions">
                        <Skeleton width="2.6rem" height="1.3rem" borderRadius="6px" />
                        <Skeleton width="2.6rem" height="1.3rem" borderRadius="6px" />
                        <Skeleton width="1.8rem" height="1.3rem" borderRadius="6px" />
                    </div>
                </article>
            ))}
        </div>
    );
}
