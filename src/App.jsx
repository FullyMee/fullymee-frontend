import React, { useEffect, useState } from "react";
import Router from "./app/router.jsx";
import { InlineSpinner } from "./components/loaders";

function GlobalTopBarLoader() {
    const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);

    useEffect(() => {
        if (typeof window === "undefined") return undefined;

        const handleStatusChange = () => {
            setIsOffline(!navigator.onLine);
        };

        window.addEventListener("online", handleStatusChange);
        window.addEventListener("offline", handleStatusChange);

        return () => {
            window.removeEventListener("online", handleStatusChange);
            window.removeEventListener("offline", handleStatusChange);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fm-loader-bar-wrap" role="status" aria-live="polite" aria-label="Reconnecting">
            <div className="fm-loader-bar" />
            <div className="fm-loader-bar-hint">
                <InlineSpinner size="sm" tone="brand" label="Reconnecting" />
                <span>Reconnecting…</span>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <>
            <GlobalTopBarLoader />
            <Router />
        </>
    );
}