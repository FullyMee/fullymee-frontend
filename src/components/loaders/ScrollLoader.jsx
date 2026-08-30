import React from "react";
import InlineSpinner from "./InlineSpinner.jsx";

/**
 * Small bottom loader for infinite scroll.
 * @param {string} [props.label]
 */
export default function ScrollLoader({ label = "Loading more" }) {
    return (
        <div className="fm-scroll-loader" role="status" aria-live="polite">
            <InlineSpinner size="sm" tone="muted" label={label} />
            <span>{label}</span>
        </div>
    );
}
