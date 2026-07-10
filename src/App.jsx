import React, { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import Router from "./app/router.jsx";
import { InlineSpinner } from "./components/common/LoadingStates.jsx";

function GlobalAppLoader() {
    const isFetching = useIsFetching();
    const isMutating = useIsMutating();
    const [visible, setVisible] = useState(false);
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

    useEffect(() => {
        if (isOffline) {
            const timerId = window.setTimeout(() => setVisible(true), 120);
            return () => window.clearTimeout(timerId);
        }

        const pendingRequests = isFetching + isMutating;

        if (!pendingRequests) {
            setVisible(false);
            return undefined;
        }

        const timerId = window.setTimeout(() => setVisible(true), 120);
        return () => window.clearTimeout(timerId);
    }, [isFetching, isMutating, isOffline]);

    useEffect(() => {
        if (!isOffline) {
            setVisible(false);
        }
    }, [isOffline]);

    if (!visible) {
        return null;
    }

    return (
        <div className="app-global-loader" role="status" aria-live="polite" aria-label="Loading content">
            <div className="app-global-loader__bar" />
            <div className="app-global-loader__content">
                <InlineSpinner size="sm" tone="dark" label="Loading content" />
                <span className="app-global-loader__hint">{isOffline ? "Reconnecting…" : "Loading…"}</span>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <>
            <GlobalAppLoader />
            <Router />
        </>
    );
}