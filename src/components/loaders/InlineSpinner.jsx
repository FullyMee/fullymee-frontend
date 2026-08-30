import React from "react";

/**
 * Three-dot inline spinner.
 * Drop-in replacement for the old InlineSpinner.
 *
 * @param {'sm'|'md'|'lg'} [props.size]  - Dot size
 * @param {'light'|'dark'|'brand'|'muted'} [props.tone] - Color tone
 * @param {string} [props.label]  - Accessible label
 * @param {string} [props.className]
 */
export default function InlineSpinner({
    size = "md",
    tone = "brand",
    label = "Loading",
    className = "",
}) {
    return (
        <span
            className={`fm-spinner fm-spinner--${size} fm-spinner--${tone} ${className}`.trim()}
            role="status"
            aria-live="polite"
            aria-label={label}
        >
            <span className="fm-spinner__dot" aria-hidden="true" />
            <span className="fm-spinner__dot" aria-hidden="true" />
            <span className="fm-spinner__dot" aria-hidden="true" />
        </span>
    );
}
