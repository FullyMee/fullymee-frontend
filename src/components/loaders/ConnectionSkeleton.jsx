import React from "react";
import Skeleton from "./Skeleton.jsx";

/**
 * Connection list skeleton — avatar + name + action button per item.
 * @param {number} [props.count] - Number of connection skeleton items
 */
export default function ConnectionSkeleton({ count = 4 }) {
    return (
        <div className="fm-connection-skeleton" aria-hidden="true">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="fm-connection-skeleton__item">
                    <Skeleton variant="circle" width="2.8rem" height="2.8rem" />
                    <div className="fm-connection-skeleton__info">
                        <Skeleton width="50%" height="0.85rem" />
                        <Skeleton width="30%" height="0.7rem" />
                    </div>
                    <Skeleton width="4.5rem" height="2rem" borderRadius="10px" />
                </div>
            ))}
        </div>
    );
}
