import React from "react";
import fullymeLogo from "../../assets/fullyme-logo.png";

/**
 * Full-screen branded application loader.
 * Used during auth bootstrap / session restoration.
 * No artificial delays — disappears as soon as loading completes.
 */
export default function AppLoader({ isExiting = false }) {
    return (
        <div
            className={`fm-app-loader${isExiting ? " is-exiting" : ""}`}
            role="status"
            aria-live="polite"
            aria-label="Loading FullyMee"
        >
            <img
                src={fullymeLogo}
                alt="FullyMee"
                className="fm-app-loader__logo"
                width={64}
                height={64}
            />
            <span className="fm-app-loader__text">Loading…</span>
        </div>
    );
}

/**
 * Lightweight page-level loader for React Suspense fallback.
 * Shows a small pulsing logo instead of a blank screen or large spinner.
 */
export function PageLoader() {
    return (
        <div
            className="fm-page-loader"
            role="status"
            aria-live="polite"
            aria-label="Loading page"
        >
            <img
                src={fullymeLogo}
                alt=""
                className="fm-page-loader__icon"
                width={36}
                height={36}
            />
        </div>
    );
}
