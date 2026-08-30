import React from "react";
import Skeleton from "./Skeleton.jsx";

/**
 * Settings page skeleton — section headers + toggle rows.
 * @param {number} [props.sections] - Number of settings sections
 */
export default function SettingsSkeleton({ sections = 3 }) {
    return (
        <div className="fm-settings-skeleton" aria-hidden="true">
            {Array.from({ length: sections }, (_, i) => (
                <div key={i} className="fm-settings-skeleton__section">
                    <Skeleton width="35%" height="0.9rem" />
                    {Array.from({ length: 3 }, (_, j) => (
                        <div key={j} className="fm-settings-skeleton__row">
                            <div className="fm-settings-skeleton__row-left">
                                <Skeleton width="8rem" height="0.8rem" />
                                <Skeleton width="12rem" height="0.65rem" />
                            </div>
                            <Skeleton width="2.5rem" height="1.4rem" borderRadius="12px" />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
