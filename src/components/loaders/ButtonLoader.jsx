import React from "react";

/**
 * Compact spinning circle for button loading states.
 * @param {'sm'|'md'} [props.size]
 * @param {string} [props.className]
 */
export default function ButtonLoader({ size = "md", className = "" }) {
    const sizeClass = size === "sm" ? " fm-btn-loader--sm" : "";
    return (
        <span
            className={`fm-btn-loader${sizeClass} ${className}`.trim()}
            aria-hidden="true"
        />
    );
}
