import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { listConversationUnreadCounts } from "../services/chat.service.js";
import { getSocket } from "../services/socket.js";

const UnreadContext = createContext({
    unreadByConversation: {},
    totalUnreadCount: 0,
    activeConversationId: 0,
    setActiveConversationId: () => {},
    markConversationReadLocally: () => {},
    fetchUnreadCounts: () => Promise.resolve()
});

function parseUnreadRows(rows) {
    const safeRows = Array.isArray(rows) ? rows : [];
    const map = {};
    for (const row of safeRows) {
        const cid = Number(row?.conversationId);
        const count = Number(row?.unreadCount) || 0;
        if (cid) map[cid] = count;
    }
    return map;
}

export function UnreadProvider({ children, isAuthenticated, userId }) {
    const [unreadByConversation, setUnreadByConversation] = useState({});
    const [activeConversationId, setActiveConversationIdState] = useState(0);
    const activeConversationIdRef = useRef(0);

    const setActiveConversationId = useCallback((id) => {
        const numId = Number(id) || 0;
        activeConversationIdRef.current = numId;
        setActiveConversationIdState(numId);
    }, []);

    const fetchUnreadCounts = useCallback(async () => {
        if (!isAuthenticated) {
            setUnreadByConversation({});
            return;
        }
        try {
            const rows = await listConversationUnreadCounts();
            setUnreadByConversation(parseUnreadRows(rows));
        } catch (err) {
            console.error("Failed to fetch unread counts:", err);
        }
    }, [isAuthenticated]);

    // Initial load when authentication state changes
    useEffect(() => {
        if (!isAuthenticated) {
            setUnreadByConversation({});
            return;
        }
        fetchUnreadCounts();
    }, [isAuthenticated, fetchUnreadCounts]);

    const markConversationReadLocally = useCallback((conversationId, lastMessageId = null) => {
        const cid = Number(conversationId);
        if (!cid) return;

        setUnreadByConversation((prev) => {
            if (!prev[cid]) return prev;
            const next = { ...prev };
            delete next[cid];
            return next;
        });

        const socket = getSocket();
        if (socket?.connected && lastMessageId) {
            socket.emit("mark_read", { conversationId: cid, messageId: Number(lastMessageId) });
        }
    }, []);

    // Socket real-time unread sync
    useEffect(() => {
        if (!isAuthenticated) return undefined;
        const socket = getSocket();
        if (!socket) return undefined;

        function handleUnreadUpdate(payload) {
            const cid = Number(payload?.conversationId);
            if (!cid || cid === activeConversationIdRef.current) return;
            setUnreadByConversation((prev) => ({
                ...prev,
                [cid]: (Number(prev[cid]) || 0) + 1
            }));
        }

        function handleUnreadReset(payload) {
            const cid = Number(payload?.conversationId);
            const targetUserId = Number(payload?.userId);
            if (targetUserId && userId && Number(targetUserId) !== Number(userId)) return;
            if (cid) {
                setUnreadByConversation((prev) => {
                    if (!prev[cid]) return prev;
                    const next = { ...prev };
                    delete next[cid];
                    return next;
                });
            }
        }

        function handleVisibilityChange() {
            if (document.visibilityState === "visible") fetchUnreadCounts();
        }

        socket.on("unread_update", handleUnreadUpdate);
        socket.on("unread_reset", handleUnreadReset);
        socket.on("connect", fetchUnreadCounts);
        window.addEventListener("online", fetchUnreadCounts);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            socket.off("unread_update", handleUnreadUpdate);
            socket.off("unread_reset", handleUnreadReset);
            socket.off("connect", fetchUnreadCounts);
            window.removeEventListener("online", fetchUnreadCounts);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [fetchUnreadCounts, isAuthenticated, userId]);

    const totalUnreadCount = useMemo(
        () => Object.values(unreadByConversation).reduce((acc, c) => acc + (Number(c) || 0), 0),
        [unreadByConversation]
    );

    const contextValue = useMemo(() => ({
        unreadByConversation,
        totalUnreadCount,
        activeConversationId,
        setActiveConversationId,
        markConversationReadLocally,
        fetchUnreadCounts
    }), [unreadByConversation, totalUnreadCount, activeConversationId, setActiveConversationId, markConversationReadLocally, fetchUnreadCounts]);

    return (
        <UnreadContext.Provider value={contextValue}>
            {children}
        </UnreadContext.Provider>
    );
}

export function useUnread() {
    return useContext(UnreadContext);
}
