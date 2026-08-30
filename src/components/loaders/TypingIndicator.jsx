import React from "react";

/**
 * Typing indicator — three dots with sequential pulse.
 * @param {string} [props.className]
 */
export default function TypingIndicator({ className = "" }) {
    return (
        <span
            className={`fm-typing ${className}`.trim()}
            role="status"
            aria-label="Someone is typing"
        >
            <span className="fm-typing__dot" aria-hidden="true" />
            <span className="fm-typing__dot" aria-hidden="true" />
            <span className="fm-typing__dot" aria-hidden="true" />
        </span>
    );
}
