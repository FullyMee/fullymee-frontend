import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DesktopAppShell from "../components/layout/DesktopAppShell.jsx";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DesktopEmptyState from "../components/common/DesktopEmptyState.jsx";
import { getChatAvatarGlyph } from "../components/common/MobileRoomVisuals.jsx";
import { ChatListSkeleton, ChatThreadSkeleton, ScrollLoader, InlineSpinner } from "../components/loaders";
import VirtualChatFeed from "../components/common/VirtualChatFeed.jsx";
import MemoizedMessageBubble from "../components/chats/MessageBubble.jsx";
import { useGlobalError } from "../context/ErrorContext.jsx";
import useIsDesktop from "../hooks/useIsDesktop";
import useSocket from "../hooks/useSocket";
import useBodyClass from "../hooks/useBodyClass.js";
import usePrimaryTabSwipeNavigation from "../hooks/usePrimaryTabSwipeNavigation.js";
import useTimedNotice from "../hooks/useTimedNotice.js";
import useMobileViewport from "../features/chats/hooks/useMobileViewport.js";
import ChatRequestsView from "../features/chats/components/ChatRequestsView.jsx";
import { PendingRequestCard, AcceptedRequestCard } from "../features/chats/components/ChatRequestCard.jsx";
import ManageConnectionSheet from "../features/chats/components/ManageConnectionSheet.jsx";
import EndConnectionSheet from "../features/chats/components/EndConnectionSheet.jsx";
import ConversationEndedPanel from "../features/chats/components/ConversationEndedPanel.jsx";
import { waitForSocketConnection } from "../services/socket.js";
import { getJoinedRooms } from "../services/confession.service";
import { getInitial } from "../utils/presentation.js";
import UserAvatar from "../components/common/UserAvatar.jsx";
import {
    listChatRequests,
    listConversationMessages,
    listConversationUnreadCounts,
    listConversations,
    listUsers,
    respondToChatRequest,
    endConnection,
    pauseConnection,
    resumeConnection,
    archiveConnection,
    unarchiveConnection,
    reportConnection,
    deleteConnection
} from "../services/chat.service";
import { isConversationEnded, getClosingNoteDisplay } from "../features/chats/constants/closingNotes.js";
import {
    ArrowLeftIcon,
    MoreIcon,
    SendIcon,
    SearchIcon,
    SmileIcon,
    RequestsIcon,
    MessageRequestIcon,
    CheckIcon,
    CloseIcon,
    ChatBubbleIcon
} from "../components/common/Icons.jsx";
import {
    getHashValue,
    getAvatarTone,
    formatListTime,
    formatMessageTime,
    formatDesktopDateLabel,
    truncateText,
    formatRequestSummary,
    getRequestSubtitle,
    getRequestInfoLine
} from "../features/chats/utils/chatHelpers.js";
import {
    normalizeDisplayNames,
    dedupeMessages,
    buildOptimisticMessage,
    replaceOptimisticMessage,
    createClientMessageId
} from "../features/chats/utils/messageHelpers.js";

import { Search, Sparkles, MessageSquare, Pause, Archive, Trash2, Star, ChevronRight, SlidersHorizontal, Leaf } from "lucide-react";

const MESSAGE_PAGE_SIZE = 30;

function ChatEmptyState() {
    const navigate = useNavigate();
    return (
        <div className="chat-empty-state">
            <div className="chat-empty-state__icon-wrapper">
                <Search size={22} strokeWidth={1.8} className="chat-empty-state__icon" />
            </div>
            <h3 className="chat-empty-state__title">No conversations found</h3>
            <p className="chat-empty-state__sub">
                Try another search or find people to connect with and start messaging.
            </p>
            <button
                type="button"
                className="chat-empty-state__cta"
                onClick={() => navigate("/search")}
            >
                <Sparkles size={15} strokeWidth={2} />
                Find People
            </button>
        </div>
    );
}

function ChatRequestsEmptyState() {
    return (
        <div className="chat-empty-state">
            <div className="chat-empty-state__icon-wrapper">
                <MessageSquare size={20} strokeWidth={1.8} className="chat-empty-state__icon" />
            </div>
            <h3 className="chat-empty-state__title">No chat requests yet</h3>
            <p className="chat-empty-state__sub">
                When someone sends you a request from a confession, it will appear here.
            </p>
        </div>
    );
}


export default function ChatPage({ user }) {
    const isDesktop = useIsDesktop();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { socket, connected } = useSocket();
    const { showError, dismissError } = useGlobalError();

    const userId = Number((user && user.userId) || 0);
    const [conversations, setConversations] = useState([]);
    const [chatRequests, setChatRequests] = useState({ pendingIncomingCount: 0, pending: [], accepted: [] });
    const [users, setUsers] = useState([]);
    const [joinedRooms, setJoinedRooms] = useState([]);
    const [unreadByConversation, setUnreadByConversation] = useState({});
    const [previewByConversation, setPreviewByConversation] = useState({});
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [loadingIndex, setLoadingIndex] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
    const [handlingRequestId, setHandlingRequestId] = useState(0);
    const [notice, setNotice] = useTimedNotice("", 2200);
    const [searchQuery, setSearchQuery] = useState("");
    const [messageLimit, setMessageLimit] = useState(MESSAGE_PAGE_SIZE);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState({});
    const threadContentRef = useRef(null);
    const mobileTextareaRef = useRef(null);
    const olderMessagesLoadRef = useRef(false);
    const previousScrollHeightRef = useRef(0);
    const isNearBottomRef = useRef(true);

    const handleMessagesScroll = useCallback(() => {
        const node = threadContentRef.current;
        if (!node) return;
        const distanceToBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
        isNearBottomRef.current = distanceToBottom < 120;
    }, []);
    // Connection management sheet state
    const [manageSheetOpen, setManageSheetOpen] = useState(false);
    const [endSheetOpen, setEndSheetOpen] = useState(false);
    const [connectionBusyAction, setConnectionBusyAction] = useState(null);
    const [endingConversation, setEndingConversation] = useState(false);
    // Inbox view tab state: "active" | "past" | "archived"
    const [inboxTab, setInboxTab] = useState("active");
    const [showSearch, setShowSearch] = useState(false);
    // Local overrides for conversation status (optimistic / socket-pushed updates)
    const [conversationStatusOverrides, setConversationStatusOverrides] = useState({});
    const [closingNoteOverrides, setClosingNoteOverrides] = useState({});

    const isRequestsView = searchParams.get("requests") === "1";
    const activeConversationId = Number(searchParams.get("conversationId") || 0);
    const isMobileThreadView = !isDesktop && !!activeConversationId;
    const mobileViewportFrame = useMobileViewport(isMobileThreadView);
    const swipeNavigationHandlers = usePrimaryTabSwipeNavigation({
        enabled: !isDesktop && !activeConversationId && !isRequestsView
    });

    useBodyClass("confessions-scroll-unlocked");
    useBodyClass("chat-thread-locked", isMobileThreadView);

    const loadConversationIndex = useCallback(async () => {
        try {
            setLoadingIndex(true);

            const [conversationRows, userRows, unreadRows, requestRows, joinedRoomRows] = await Promise.all([
                listConversations({ view: "all", conversationId: activeConversationId }),
                listUsers(),
                listConversationUnreadCounts(),
                listChatRequests(),
                getJoinedRooms().catch(() => [])
            ]);

            const safeConversations = Array.isArray(conversationRows) ? conversationRows : [];
            const safeUsers = Array.isArray(userRows) ? userRows : [];
            const safeUnread = Array.isArray(unreadRows) ? unreadRows : [];
            const safeRequests = requestRows && typeof requestRows === "object" ? requestRows : {};

            const previews = await Promise.all(
                safeConversations.map(async (conversation) => {
                    try {
                        const rows = await listConversationMessages(conversation.id, { limit: 1 });
                        const list = Array.isArray(rows) ? rows : [];
                        const lastMessage = list.length > 0 ? list[list.length - 1] : null;
                        return [conversation.id, lastMessage];
                    } catch {
                        return [conversation.id, null];
                    }
                })
            );

            setConversations(safeConversations);
            setUsers(safeUsers);
            setJoinedRooms(Array.isArray(joinedRoomRows) ? joinedRoomRows : []);
            setChatRequests({
                pendingIncomingCount: Number(safeRequests.pendingIncomingCount) || 0,
                pending: Array.isArray(safeRequests.pending) ? safeRequests.pending : [],
                accepted: Array.isArray(safeRequests.accepted) ? safeRequests.accepted : []
            });
            setUnreadByConversation(
                Object.fromEntries(
                    safeUnread.map((row) => [Number(row && row.conversationId), Number(row && row.unreadCount) || 0])
                )
            );
            setPreviewByConversation(Object.fromEntries(previews));
            dismissError();
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to load chats right now.", loadConversationIndex);
        } finally {
            setLoadingIndex(false);
        }
    }, [dismissError, showError]);

    useEffect(() => {
        loadConversationIndex();
    }, [loadConversationIndex]);

    const usersById = useMemo(() => {
        const map = new Map();
        for (const item of Array.isArray(users) ? users : []) {
            map.set(Number(item && item.id), item);
        }
        return map;
    }, [users]);
    const pendingRequests = useMemo(
        () => (Array.isArray(chatRequests.pending) ? chatRequests.pending : []),
        [chatRequests.pending]
    );
    const acceptedRequests = useMemo(
        () => (Array.isArray(chatRequests.accepted) ? chatRequests.accepted : []),
        [chatRequests.accepted]
    );
    const pendingRequestCount = Number(chatRequests.pendingIncomingCount) || 0;
    const showRequestsCard = pendingRequestCount > 0 || acceptedRequests.length > 0;

    const acceptedRequestLabelsByConversation = useMemo(() => {
        const map = new Map();
        for (const item of acceptedRequests) {
            const conversationId = Number(item && item.conversationId);
            const displayAlias = String(item && item.displayAlias ? item.displayAlias : "").trim();
            if (!conversationId || !displayAlias) continue;
            map.set(conversationId, displayAlias);
        }
        return map;
    }, [acceptedRequests]);

    const conversationItems = useMemo(() => {
        return (Array.isArray(conversations) ? conversations : []).map((conversation) => {
            const participants = Array.isArray(conversation && conversation.participants)
                ? conversation.participants.map((item) => Number(item))
                : [];
            const otherUserId = participants.find((item) => item !== userId) || 0;
            const isOtherUserOnline = !!onlineUsers[otherUserId];
            const otherUser = usersById.get(otherUserId) || null;
            const displayNames = normalizeDisplayNames(conversation && conversation.participantDisplayNames ? conversation.participantDisplayNames : {});
            const displayTitle = displayNames && displayNames[String(otherUserId)] ? displayNames[String(otherUserId)] : "";
            const acceptedRequestTitle = acceptedRequestLabelsByConversation.get(Number(conversation && conversation.id)) || "";
            const rawTitle = displayTitle || acceptedRequestTitle || (otherUser && otherUser.username ? otherUser.username : `User ${otherUserId || conversation.id}`);
            const preview = previewByConversation[conversation.id] || null;
            const timeLabel = formatListTime((preview && preview.createdAt) || conversation.created_at);
            const desktopDateLabel = formatDesktopDateLabel((preview && preview.createdAt) || conversation.created_at);
            const avatar = conversation.participantAvatars?.[otherUserId] || null;

            return {
                ...conversation,
                otherUserId,
                isOtherUserOnline,
                presenceLabel: connected ? (isOtherUserOnline ? "Active now" : "Offline") : "Reconnecting...",
                title: rawTitle,
                subtitle: truncateText(preview && preview.content),
                timeLabel,
                desktopDateLabel,
                listMetaLabel: connected && isOtherUserOnline ? "Active now" : timeLabel,
                desktopMetaLabel: connected && isOtherUserOnline ? "Active now" : (desktopDateLabel || timeLabel),
                unreadCount: Number(unreadByConversation[conversation.id]) || 0,
                avatarLabel: getChatAvatarGlyph(rawTitle),
                avatar: conversation?.participantAvatars?.[String(otherUserId)] || null,
                avatarTone: getAvatarTone(rawTitle),
                status: conversationStatusOverrides[conversation.id] || conversation.status,
                isArchivedForMe: Boolean(conversation.isArchivedForMe)
            };
        });
    }, [acceptedRequestLabelsByConversation, connected, conversationStatusOverrides, conversations, onlineUsers, previewByConversation, unreadByConversation, userId, usersById]);

    const activeConversationsCount = useMemo(() => {
        return conversationItems.filter((c) => c.status !== "ENDED" && !c.isArchivedForMe).length;
    }, [conversationItems]);

    const pastConversationsCount = useMemo(() => {
        return conversationItems.filter((c) => c.status === "ENDED" && !c.isArchivedForMe).length;
    }, [conversationItems]);

    const archivedConversationsCount = useMemo(() => {
        return conversationItems.filter((c) => c.isArchivedForMe).length;
    }, [conversationItems]);

    const activeTabItems = useMemo(() => {
        if (inboxTab === "past") {
            return conversationItems.filter((c) => c.status === "ENDED" && !c.isArchivedForMe);
        }
        if (inboxTab === "archived") {
            return conversationItems.filter((c) => c.isArchivedForMe);
        }
        return conversationItems.filter((c) => c.status !== "ENDED" && !c.isArchivedForMe);
    }, [conversationItems, inboxTab]);

    const filteredConversationItems = useMemo(() => {
        const term = String(searchQuery || "").trim().toLowerCase();
        if (!term) return activeTabItems;

        return activeTabItems.filter((conversation) => {
            const haystack = `${conversation.title || ""} ${conversation.subtitle || ""}`.toLowerCase();
            return haystack.includes(term);
        });
    }, [activeTabItems, searchQuery]);

    const activeConversation = useMemo(
        () => conversationItems.find((conversation) => Number(conversation.id) === activeConversationId) || null,
        [activeConversationId, conversationItems]
    );

    // Automatically switch inboxTab to "past" or "archived" when viewing an ended conversation
    useEffect(() => {
        if (activeConversation && activeConversation.status === "ENDED") {
            if (activeConversation.isArchivedForMe) {
                setInboxTab("archived");
            } else {
                setInboxTab("past");
            }
        }
    }, [activeConversation]);

    const activeConversationStatus = useMemo(() => {
        if (!activeConversation) return "";
        return activeConversation.presenceLabel || (connected ? "Offline" : "Reconnecting...");
    }, [activeConversation, connected]);

    const markConversationRead = useCallback((conversationId, rows) => {
        if (!socket || !connected || !conversationId) return;
        const list = Array.isArray(rows) ? rows : [];
        const lastMessage = list.length > 0 ? list[list.length - 1] : null;
        if (!lastMessage || !lastMessage.id) return;

        socket.emit("mark_read", {
            conversationId,
            messageId: Number(lastMessage.id)
        });

        setUnreadByConversation((prev) => ({
            ...prev,
            [conversationId]: 0
        }));
    }, [connected, socket]);

    useEffect(() => {
        if (!activeConversationId) {
            setMessages([]);
            setDraft("");
            setMessageLimit(MESSAGE_PAGE_SIZE);
            setHasMoreMessages(false);
            return;
        }

        let cancelled = false;

        async function loadMessages() {
            try {
                if (olderMessagesLoadRef.current) {
                    previousScrollHeightRef.current = threadContentRef.current ? threadContentRef.current.scrollHeight : 0;
                    setLoadingOlderMessages(true);
                } else {
                    setLoadingMessages(true);
                }
                const rows = await listConversationMessages(activeConversationId, { limit: messageLimit });
                if (cancelled) return;

                const safeMessages = dedupeMessages(rows);
                setMessages(safeMessages);
                setHasMoreMessages(safeMessages.length >= messageLimit);
                if (safeMessages.length > 0) {
                    setPreviewByConversation((prev) => ({
                        ...prev,
                        [activeConversationId]: safeMessages[safeMessages.length - 1]
                    }));
                }
                markConversationRead(activeConversationId, safeMessages);
                dismissError();
                if (olderMessagesLoadRef.current) {
                    requestAnimationFrame(() => {
                        if (!threadContentRef.current) return;
                        const nextScrollHeight = threadContentRef.current.scrollHeight;
                        threadContentRef.current.scrollTop += nextScrollHeight - previousScrollHeightRef.current;
                    });
                }
            } catch (err) {
                if (cancelled) return;
                setMessages([]);
                showError(err && err.message ? err.message : "Unable to load this conversation.");
            } finally {
                olderMessagesLoadRef.current = false;
                if (!cancelled) {
                    setLoadingMessages(false);
                    setLoadingOlderMessages(false);
                }
            }
        }

        loadMessages();

        return () => {
            cancelled = true;
        };
    }, [activeConversationId, dismissError, markConversationRead, messageLimit, showError]);

    useEffect(() => {
        setMessageLimit(MESSAGE_PAGE_SIZE);
        olderMessagesLoadRef.current = false;
    }, [activeConversationId]);

    useEffect(() => {
        if (!isDesktop || isRequestsView || activeConversationId || conversationItems.length === 0) return;
        setSearchParams({ conversationId: String(conversationItems[0].id) });
    }, [activeConversationId, conversationItems, isDesktop, isRequestsView, setSearchParams]);


    useEffect(() => {
        if (isDesktop || !activeConversationId || !threadContentRef.current) return;
        const node = threadContentRef.current;
        requestAnimationFrame(() => {
            node.scrollTop = node.scrollHeight;
            isNearBottomRef.current = true;
        });
    }, [activeConversationId, isDesktop]);

    useEffect(() => {
        if (isDesktop || !activeConversationId || !threadContentRef.current || loadingMessages || olderMessagesLoadRef.current) return;
        if (isNearBottomRef.current) {
            requestAnimationFrame(() => {
                if (threadContentRef.current) {
                    threadContentRef.current.scrollTop = threadContentRef.current.scrollHeight;
                }
            });
        }
    }, [activeConversationId, isDesktop, loadingMessages, messages]);

    useEffect(() => {
        if (isDesktop || !activeConversationId || !threadContentRef.current) return;
        if (isNearBottomRef.current) {
            requestAnimationFrame(() => {
                if (threadContentRef.current) {
                    threadContentRef.current.scrollTop = threadContentRef.current.scrollHeight;
                }
            });
        }
    }, [activeConversationId, isDesktop, mobileViewportFrame]);

    useEffect(() => {
        if (!socket || !connected || !activeConversationId) return;
        socket.emit("join_conversation", activeConversationId);
    }, [activeConversationId, connected, socket]);

    useEffect(() => {
        if (!socket) return undefined;

        function handlePresenceSnapshot(payload) {
            const ids = Array.isArray(payload && payload.userIds) ? payload.userIds : [];
            const next = {};

            for (const value of ids) {
                const id = Number(value);
                if (!id || id === userId) continue;
                next[id] = true;
            }

            setOnlineUsers(next);
        }

        function handlePresenceUpdate(payload) {
            const presenceUserId = Number(payload && payload.userId);
            if (!presenceUserId || presenceUserId === userId) return;

            setOnlineUsers((prev) => {
                const next = { ...prev };
                if (payload && payload.status === "online") {
                    next[presenceUserId] = true;
                } else {
                    delete next[presenceUserId];
                }
                return next;
            });
        }

        socket.on("presence_snapshot", handlePresenceSnapshot);
        socket.on("presence_update", handlePresenceUpdate);

        return () => {
            socket.off("presence_snapshot", handlePresenceSnapshot);
            socket.off("presence_update", handlePresenceUpdate);
        };
    }, [socket, userId]);

    useEffect(() => {
        if (!socket) return undefined;

        function handleReceiveMessage(payload) {
            const conversationId = Number(payload && payload.conversationId);
            if (!conversationId) return;

            const normalizedMessage = {
                ...payload,
                createdAt: (payload && payload.createdAt) || new Date().toISOString()
            };

            setPreviewByConversation((prev) => ({
                ...prev,
                [conversationId]: normalizedMessage
            }));

            setConversations((prev) => {
                const current = Array.isArray(prev) ? [...prev] : [];
                const index = current.findIndex((item) => Number(item && item.id) === conversationId);
                if (index <= 0) return current;
                const [entry] = current.splice(index, 1);
                return [entry, ...current];
            });

            if (conversationId !== activeConversationId) return;

            setMessages((prev) => {
                const next = replaceOptimisticMessage(prev, normalizedMessage);
                if (Number(normalizedMessage.senderId) !== userId) {
                    setTimeout(() => markConversationRead(conversationId, next), 0);
                }
                return next;
            });
        }

        function handleDmCreated() {
            loadConversationIndex();
        }

        function handleChatRequestEvent() {
            loadConversationIndex();
        }

        function handleUnreadUpdate(payload) {
            const conversationId = Number(payload && payload.conversationId);
            if (!conversationId || conversationId === activeConversationId) return;

            setUnreadByConversation((prev) => ({
                ...prev,
                [conversationId]: (Number(prev[conversationId]) || 0) + 1
            }));
        }

        function handleUnreadReset(payload) {
            const conversationId = Number(payload && payload.conversationId);
            const targetUserId = Number(payload && payload.userId);
            if (!conversationId || targetUserId !== userId) return;

            setUnreadByConversation((prev) => ({
                ...prev,
                [conversationId]: 0
            }));
        }

        function handleConversationEnded(payload) {
            const cid = Number(payload && payload.conversationId);
            if (!cid) return;
            setConversationStatusOverrides((prev) => ({ ...prev, [cid]: "ENDED" }));
            if (payload && payload.closingNoteText) {
                setClosingNoteOverrides((prev) => ({ ...prev, [cid]: payload.closingNoteText }));
            }
        }

        function handleConversationPaused(payload) {
            const cid = Number(payload && payload.conversationId);
            if (!cid) return;
            const pausedBy = Number(payload && payload.pausedBy) || null;
            setConversationStatusOverrides((prev) => ({ ...prev, [cid]: "PAUSED", [cid + "_pausedBy"]: pausedBy }));
            setConversations((prev) =>
                prev.map((c) => (Number(c.id) === cid ? { ...c, status: "PAUSED", pausedBy } : c))
            );
            if (cid === activeConversationId) {
                setDraft("");
                if (pausedBy && pausedBy !== userId) {
                    const pausedConv = conversations.find((c) => Number(c.id) === cid);
                    const name = (pausedConv && pausedConv.title) || "The other person";
                    setNotice(`${name} paused the conversation.`);
                }
            }
        }

        function handleConversationResumed(payload) {
            const cid = Number(payload && payload.conversationId);
            if (!cid) return;
            setConversationStatusOverrides((prev) => ({ ...prev, [cid]: "ACTIVE", [cid + "_pausedBy"]: null }));
            setConversations((prev) =>
                prev.map((c) => (Number(c.id) === cid ? { ...c, status: "ACTIVE", pausedBy: null } : c))
            );
            if (cid === activeConversationId) {
                setNotice("Conversation resumed.");
            }
        }

        socket.on("receive_message", handleReceiveMessage);
        socket.on("dm_created", handleDmCreated);
        socket.on("chat_request_created", handleChatRequestEvent);
        socket.on("chat_request_updated", handleChatRequestEvent);
        socket.on("unread_update", handleUnreadUpdate);
        socket.on("unread_reset", handleUnreadReset);
        socket.on("conversation_ended", handleConversationEnded);
        socket.on("conversation_paused", handleConversationPaused);
        socket.on("conversation_resumed", handleConversationResumed);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("dm_created", handleDmCreated);
            socket.off("chat_request_created", handleChatRequestEvent);
            socket.off("chat_request_updated", handleChatRequestEvent);
            socket.off("unread_update", handleUnreadUpdate);
            socket.off("unread_reset", handleUnreadReset);
            socket.off("conversation_ended", handleConversationEnded);
            socket.off("conversation_paused", handleConversationPaused);
            socket.off("conversation_resumed", handleConversationResumed);
        };
    }, [activeConversationId, loadConversationIndex, markConversationRead, socket, userId]);

    // Network reconnection & Wake-from-sleep state synchronization
    useEffect(() => {
        const handleSyncState = () => {
            loadConversationIndex();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                loadConversationIndex();
            }
        };

        window.addEventListener("online", handleSyncState);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        if (socket) {
            socket.on("connect", handleSyncState);
        }

        return () => {
            window.removeEventListener("online", handleSyncState);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (socket) {
                socket.off("connect", handleSyncState);
            }
        };
    }, [loadConversationIndex, socket]);

    function openConversation(conversationId) {
        setSearchParams({ conversationId: String(conversationId) });
    }

    function openRequestsView() {
        if (isRequestsView) {
            setSearchParams({});
            return;
        }

        setSearchParams({ requests: "1" });
    }

    function openAcceptedConversation(conversationId) {
        const cid = Number(conversationId);
        if (!cid) return;
        openConversation(cid);
    }

    function closeConversation() {
        setSearchParams({});
    }

    function handleOpenManageSheet() {
        setManageSheetOpen(true);
    }

    function handleManageSheetSelect(action) {
        if (action === "end") {
            setManageSheetOpen(false);
            setTimeout(() => setEndSheetOpen(true), 60);
            return;
        }
        setManageSheetOpen(false);
        if (action === "pause") {
            handlePauseConnection();
        } else if (action === "archive") {
            handleArchiveConnection();
        } else if (action === "unarchive") {
            handleUnarchiveConnection();
        } else if (action === "report") {
            handleReportConnection();
        }
    }

    async function handleEndConnection({ closingNoteId } = {}) {
        if (!activeConversationId || endingConversation) return;
        try {
            setEndingConversation(true);
            await endConnection(activeConversationId, { closingNoteId });
            // Optimistically mark ended for initiator
            setConversationStatusOverrides((prev) => ({ ...prev, [activeConversationId]: "ENDED" }));
            setEndSheetOpen(false);
            // Remove from active list after brief delay for smooth UX
            setTimeout(() => {
                setConversations((prev) =>
                    prev.map((c) =>
                        Number(c.id) === activeConversationId ? { ...c, status: "ENDED" } : c
                    )
                );
                // Navigate back to list
                setSearchParams({});
            }, 400);
            setNotice("Conversation ended.");
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to end this conversation right now.");
        } finally {
            setEndingConversation(false);
        }
    }

    async function handlePauseConnection() {
        if (!activeConversationId) return;
        const currentStatus = conversationStatusOverrides[activeConversationId] || (activeConversation && activeConversation.status);
        const isCurrentlyPaused = currentStatus === "PAUSED";
        try {
            setConnectionBusyAction("pause");
            if (isCurrentlyPaused) {
                await resumeConnection(activeConversationId);
                setConversationStatusOverrides((prev) => ({ ...prev, [activeConversationId]: "ACTIVE", [activeConversationId + "_pausedBy"]: null }));
                setNotice("Conversation resumed.");
            } else {
                await pauseConnection(activeConversationId);
                setConversationStatusOverrides((prev) => ({ ...prev, [activeConversationId]: "PAUSED", [activeConversationId + "_pausedBy"]: Number(userId) }));
                setNotice("Conversation paused.");
            }
            await loadConversationIndex();
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to update conversation state.");
        } finally {
            setConnectionBusyAction(null);
        }
    }

    async function handleArchiveConnection(id) {
        const targetId = Number(id || activeConversationId);
        if (!targetId) return;
        try {
            setConnectionBusyAction("archive");
            await archiveConnection(targetId);
            setNotice("Conversation archived.");
            if (targetId === activeConversationId) {
                setSearchParams({});
            }
            await loadConversationIndex();
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to archive this conversation.");
        } finally {
            setConnectionBusyAction(null);
        }
    }

    async function handleUnarchiveConnection(id) {
        const targetId = Number(id || activeConversationId);
        if (!targetId) return;
        try {
            await unarchiveConnection(targetId);
            setNotice("Conversation unarchived.");
            await loadConversationIndex();
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to unarchive this conversation.");
        }
    }

    async function handleDeleteConnectionItem(id) {
        const targetId = Number(id || activeConversationId);
        if (!targetId) return;
        try {
            await deleteConnection(targetId);
            setNotice("Conversation deleted.");
            if (targetId === activeConversationId) {
                setSearchParams({});
            }
            await loadConversationIndex();
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to delete conversation.");
        }
    }

    async function handleReportConnection() {
        if (!activeConversationId) return;
        try {
            setConnectionBusyAction("report");
            await reportConnection(activeConversationId);
            setNotice("Report submitted. The conversation has been ended.");
            setConversationStatusOverrides((prev) => ({ ...prev, [activeConversationId]: "ENDED" }));
            setSearchParams({});
            await loadConversationIndex();
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to submit report right now.");
        } finally {
            setConnectionBusyAction(null);
        }
    }

    async function handleDeleteEndedConversation() {
        if (!activeConversationId) return;
        try {
            await deleteConnection(activeConversationId);
            setSearchParams({});
            await loadConversationIndex();
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to delete this conversation.");
        }
    }

    async function handleArchiveEndedConversation() {
        if (!activeConversationId) return;
        try {
            await archiveConnection(activeConversationId);
            setSearchParams({});
            await loadConversationIndex();
            setNotice("Moved to past conversations.");
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to archive this conversation.");
        }
    }

    function handleThreadScroll(event) {
        const node = event.currentTarget;
        if (!node || loadingMessages || loadingOlderMessages || !hasMoreMessages) return;
        if (node.scrollTop > 72) return;
        olderMessagesLoadRef.current = true;
        setMessageLimit((prev) => prev + MESSAGE_PAGE_SIZE);
    }

    async function handleRespondToRequest(requestId, action) {
        const rid = Number(requestId);
        if (!rid || (action !== "accept" && action !== "decline")) return;

        try {
            setHandlingRequestId(rid);
            dismissError();
            const result = await respondToChatRequest(rid, action);
            await loadConversationIndex();

            if (action === "accept" && Number(result && result.conversationId)) {
                setNotice("Chat request accepted.");
            }
            if (action === "decline") {
                setNotice("Chat request declined.");
            }
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to update this chat request.");
        } finally {
            setHandlingRequestId(0);
        }
    }

    async function handleDraftSubmit(event) {
        event.preventDefault();
        const content = String(draft || "").trim();
        if (!socket || !activeConversationId || !content || sendingMessage) return;

        let activeSocket = socket;

        try {
            if (!socket.connected) {
                activeSocket = await waitForSocketConnection({ forceTokenRefresh: true });
            }
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to reconnect chat right now.");
            return;
        }

        const clientMessageId = createClientMessageId();
        const optimisticMessage = buildOptimisticMessage({
            clientMessageId,
            conversationId: activeConversationId,
            content,
            senderId: userId
        });

        setDraft("");
        if (mobileTextareaRef.current) {
            mobileTextareaRef.current.style.height = "auto";
        }
        isNearBottomRef.current = true;
        requestAnimationFrame(() => {
            if (threadContentRef.current) {
                threadContentRef.current.scrollTop = threadContentRef.current.scrollHeight;
            }
        });
        setSendingMessage(true);
        setMessages((prev) => dedupeMessages([...prev, optimisticMessage]));
        setPreviewByConversation((prev) => ({
            ...prev,
            [activeConversationId]: optimisticMessage
        }));

        activeSocket.timeout(6000).emit("send_message", {
            clientMessageId,
            conversationId: activeConversationId,
            content
        }, (err, ack) => {
            setSendingMessage(false);

            if (err) {
                setDraft(content);
                setMessages((prev) => prev.filter((item) => String(item && item.clientMessageId ? item.clientMessageId : "") !== clientMessageId));
                showError("Message send timed out. Please try again.");
                return;
            }

            if (!ack || ack.status === "delivered" || ack.status === "duplicate_ignored") return;

            setDraft(content);
            setMessages((prev) => prev.filter((item) => String(item && item.clientMessageId ? item.clientMessageId : "") !== clientMessageId));

            if (ack.status === "rate_limited") {
                setNotice("You are sending messages too quickly. Please slow down.");
                return;
            }

            showError("Unable to send this message right now.");
        });
    }

    if (isDesktop) {
        return (
            <div className="chat-mobile-page chat-mobile-page--desktop">
                {notice && <p className="chat-mobile-alert chat-mobile-alert--notice">{notice}</p>}
                <DesktopAppShell
                    hideStageHeader
                    contentClassName="desktop-chat-shell"
                    sidebarRooms={joinedRooms}
                >
                    <div className="desktop-chat-board desktop-chat-board--reference">
                        <section className="desktop-chat-column desktop-chat-column--list">
                            <header className="desktop-chat-column__header desktop-chat-column__header--list">
                                <div className="desktop-chat-column__title-row">
                                    <h1>Messages</h1>
                                    <button
                                        type="button"
                                        className={`chat-requests-trigger${showRequestsCard ? " has-requests" : ""}`}
                                        onClick={openRequestsView}
                                        aria-label="Open chat requests"
                                    >
                                        <MessageRequestIcon />
                                        {pendingRequestCount > 0 && (
                                            <strong>{pendingRequestCount > 9 ? "9+" : pendingRequestCount}</strong>
                                        )}
                                    </button>
                                </div>
                            </header>

                            <div className="desktop-chat-search">
                                <SearchIcon />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search conversations..."
                                />
                            </div>

                            <nav className="chat-inbox-tabs" style={{ margin: "0.75rem 1rem" }} aria-label="Conversation filters">
                                <button
                                    type="button"
                                    className={`chat-inbox-tab${inboxTab === "active" ? " is-active" : ""}`}
                                    onClick={() => setInboxTab("active")}
                                >
                                    Active
                                    {activeConversationsCount > 0 && (
                                        <span className="chat-inbox-tab__badge">{activeConversationsCount}</span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className={`chat-inbox-tab${inboxTab === "past" ? " is-active" : ""}`}
                                    onClick={() => setInboxTab("past")}
                                >
                                    Past
                                    {pastConversationsCount > 0 && (
                                        <span className="chat-inbox-tab__badge">{pastConversationsCount}</span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className={`chat-inbox-tab${inboxTab === "archived" ? " is-active" : ""}`}
                                    onClick={() => setInboxTab("archived")}
                                >
                                    Archived
                                    {archivedConversationsCount > 0 && (
                                        <span className="chat-inbox-tab__badge">{archivedConversationsCount}</span>
                                    )}
                                </button>
                            </nav>

                            {inboxTab === "past" && (
                                <div className="chat-inbox-tab-notice" style={{ margin: "0 1rem 0.85rem" }}>
                                    Conversations that have come to an end. Visible only to you - the other person never learns who closed it.
                                </div>
                            )}

                            {inboxTab === "archived" && (
                                <div className="chat-inbox-tab-notice" style={{ margin: "0 1rem 0.85rem" }}>
                                    Your private shelf. Archiving only affects your inbox - the other person&apos;s copy stays exactly where it was.
                                </div>
                            )}

                            <div className="desktop-chat-list-wrap">
                                {loadingIndex && <ChatListSkeleton count={5} />}

                                {!loadingIndex && isRequestsView && (
                                    <ChatRequestsView
                                        pendingRequests={pendingRequests}
                                        acceptedRequests={acceptedRequests}
                                        handlingRequestId={handlingRequestId}
                                        onRespondToRequest={handleRespondToRequest}
                                        onOpenAcceptedConversation={openAcceptedConversation}
                                    />
                                )}

                                {!loadingIndex && !isRequestsView && filteredConversationItems.length === 0 && (
                                    <div className="chat-tab-empty-card">
                                        <div className="chat-tab-empty-card__icon">
                                            <Leaf size={24} />
                                        </div>
                                        <h2>{inboxTab === "archived" ? "Archive is empty" : inboxTab === "past" ? "No past conversations" : "No active conversations"}</h2>
                                        <p>
                                            {inboxTab === "archived"
                                                ? "Anything you archive lands here - always private to you."
                                                : inboxTab === "past"
                                                ? "Ended conversations will appear here."
                                                : "Start a conversation from confessions or search."}
                                        </p>
                                    </div>
                                )}

                                {!loadingIndex && !isRequestsView && filteredConversationItems.length > 0 && inboxTab === "active" && (
                                    <div className="desktop-chat-list desktop-chat-list--reference">
                                        {filteredConversationItems.map((conversation) => (
                                            <button
                                                key={conversation.id}
                                                type="button"
                                                className={`desktop-chat-list__item${Number(conversation.id) === activeConversationId ? " is-active" : ""}`}
                                                onClick={() => openConversation(conversation.id)}
                                            >
                                                <UserAvatar avatarId={conversation.avatar} className="desktop-chat-avatar" />
                                                <div style={{ position: 'absolute', top: 0, right: 0 }}>
                                                    {conversation.unreadCount > 0 && (
                                                        <b>{conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}</b>
                                                    )}
                                                </div>
                                                <div className="desktop-chat-list__copy">
                                                    <strong>{conversation.title}</strong>
                                                    <p>{conversation.subtitle}</p>
                                                </div>
                                                <div className="desktop-chat-list__meta">
                                                    <span>{conversation.desktopMetaLabel}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!loadingIndex && !isRequestsView && filteredConversationItems.length > 0 && inboxTab === "past" && (
                                    <div className="desktop-chat-list" style={{ padding: "0 1rem" }}>
                                        {filteredConversationItems.map((conversation) => (
                                            <div key={conversation.id} className="chat-tabbed-card">
                                                <button
                                                    type="button"
                                                    className="chat-tabbed-card__head"
                                                    onClick={() => openConversation(conversation.id)}
                                                >
                                                    <UserAvatar avatarId={conversation.avatar} className="chat-tabbed-card__avatar" />
                                                    <div className="chat-tabbed-card__body">
                                                        <h2>{conversation.title}</h2>
                                                        <p>Conversation ended</p>
                                                    </div>
                                                    <div className="chat-tabbed-card__meta">
                                                        <span>{conversation.timeLabel}</span>
                                                        <ChevronRight size={16} />
                                                    </div>
                                                </button>

                                                <div className="chat-tabbed-card__actions" style={{ justifyContent: "center" }}>
                                                    <button
                                                        type="button"
                                                        className="chat-tabbed-card__btn"
                                                        style={{ width: "100%", justifyContent: "center" }}
                                                        onClick={() => handleArchiveConnection(conversation.id)}
                                                    >
                                                        <Archive size={15} />
                                                        <span>Archive</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!loadingIndex && !isRequestsView && filteredConversationItems.length > 0 && inboxTab === "archived" && (
                                    <div className="desktop-chat-list" style={{ padding: "0 1rem" }}>
                                        {filteredConversationItems.map((conversation) => {
                                            const isEnded = conversation.status === "ENDED";
                                            const subtitleText = isEnded ? "Conversation ended" : "Archived while active";
                                            return (
                                                <div key={conversation.id} className="chat-tabbed-card">
                                                    <button
                                                        type="button"
                                                        className="chat-tabbed-card__head"
                                                        onClick={() => openConversation(conversation.id)}
                                                    >
                                                        <UserAvatar avatarId={conversation.avatar} className="chat-tabbed-card__avatar" />
                                                        <div className="chat-tabbed-card__body">
                                                            <h2>{conversation.title}</h2>
                                                            <p>{subtitleText}</p>
                                                        </div>
                                                        <div className="chat-tabbed-card__meta">
                                                            <span>{conversation.timeLabel}</span>
                                                            <ChevronRight size={16} />
                                                        </div>
                                                    </button>

                                                     <div className="chat-tabbed-card__actions">
                                                        <button
                                                            type="button"
                                                            className="chat-tabbed-card__btn"
                                                            onClick={() => handleUnarchiveConnection(conversation.id)}
                                                        >
                                                            <Archive size={15} />
                                                            <span>Unarchive</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="desktop-chat-column desktop-chat-column--thread">
                            {!activeConversation && (
                                <div className="desktop-chat-placeholder desktop-chat-placeholder--reference">
                                    <ChatBubbleIcon />
                                    <h2>Select a conversation</h2>
                                    <p>Choose a chat from the list to start messaging.</p>
                                </div>
                            )}

                            {activeConversation && (
                                <>
                                    {(() => {
                                        const convStatus = conversationStatusOverrides[activeConversationId] || activeConversation.status;
                                        const isPaused = convStatus === "PAUSED";
                                        const isEnded = convStatus === "ENDED";
                                        const closingNote = closingNoteOverrides[activeConversationId] || getClosingNoteDisplay(activeConversation);
                                        const currentPausedBy = conversationStatusOverrides[activeConversationId + "_pausedBy"] !== undefined
                                            ? conversationStatusOverrides[activeConversationId + "_pausedBy"]
                                            : activeConversation.pausedBy;
                                        const isPausedByMe = Number(currentPausedBy) === Number(userId);
                                        const otherName = activeConversation.title || "Other user";
                                        const pausedSubtitle = isPausedByMe
                                            ? "• You paused this conversation"
                                            : `• ${otherName} paused this conversation`;
                                        const pausedBannerText = isPausedByMe || !currentPausedBy
                                            ? "You paused this conversation. Nothing was ended."
                                            : `${otherName} paused this conversation. Nothing was ended.`;
                                        const statusText = isPaused ? pausedSubtitle : activeConversationStatus;

                                        return (
                                            <>
                                                <header className="desktop-chat-column__header desktop-chat-column__header--thread">
                                                    <div
                                                        className="desktop-chat-thread__identity"
                                                        onClick={() => {
                                                            const targetParam = activeConversation.otherUsername || activeConversation.title || activeConversation.otherUserId;
                                                            if (targetParam) navigate(`/user/${targetParam}`, { state: { profileUser: { id: activeConversation.otherUserId, username: activeConversation.title } } });
                                                        }}
                                                        style={{ cursor: "pointer" }}
                                                        role="button"
                                                        tabIndex={0}
                                                    >
                                                        <UserAvatar avatarId={activeConversation.avatar} className="desktop-chat-avatar" />
                                                        <div>
                                                            <strong>{activeConversation.title}</strong>
                                                            <small style={isPaused ? { color: "#806b78" } : undefined}>
                                                                {statusText}
                                                            </small>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="desktop-chat-header__manage-btn"
                                                        onClick={handleOpenManageSheet}
                                                        aria-label="Manage connection"
                                                    >
                                                        <SlidersHorizontal size={15} />
                                                        <span>Manage connection</span>
                                                    </button>
                                                </header>

                                                {isPaused && (
                                                    <div className="chat-thread-paused-banner" role="status">
                                                        <Pause size={16} strokeWidth={2} />
                                                        <span>{pausedBannerText}</span>
                                                    </div>
                                                )}

                                                <main className="desktop-chat-thread__messages desktop-chat-thread__messages--reference" style={{ display: 'flex', flexDirection: 'column' }}>
                                                    {loadingMessages && messages.length === 0 && <ChatThreadSkeleton count={5} />}

                                                    {!loadingMessages && (
                                                        <>
                                                            <VirtualChatFeed
                                                                messages={messages}
                                                                isLoadingOlder={loadingOlderMessages}
                                                                onLoadMore={() => {
                                                                    if (loadingMessages || loadingOlderMessages || !hasMoreMessages) return;
                                                                    olderMessagesLoadRef.current = true;
                                                                    setMessageLimit((prev) => prev + MESSAGE_PAGE_SIZE);
                                                                }}
                                                                itemContent={(index, message) => {
                                                                    const isMine = Number(message && message.senderId) === userId;
                                                                    return (
                                                                        <MemoizedMessageBubble
                                                                            key={message.id}
                                                                            message={message}
                                                                            isMine={isMine}
                                                                            title={activeConversation.title}
                                                                            avatar={activeConversation.avatar}
                                                                            isDesktop={true}
                                                                        />
                                                                    );
                                                                }}
                                                            />

                                                            {isEnded && (
                                                                <ConversationEndedPanel
                                                                    closingNoteText={closingNote}
                                                                    onArchive={handleArchiveEndedConversation}
                                                                    isInitiator={true}
                                                                />
                                                            )}
                                                        </>
                                                    )}
                                                </main>

                                                {!isEnded && (
                                                    <form className="desktop-chat-thread__composer desktop-chat-thread__composer--reference" onSubmit={handleDraftSubmit}>
                                                        <div className="desktop-chat-thread__composer-shell">
                                                            <input
                                                                type="text"
                                                                value={isPaused ? "" : draft}
                                                                onChange={(event) => setDraft(event.target.value)}
                                                                placeholder={isPaused ? "Conversation paused" : "Type a message..."}
                                                                maxLength={1500}
                                                                disabled={!connected || isPaused}
                                                            />
                                                        </div>
                                                        <button
                                                            type="submit"
                                                            className="desktop-chat-thread__send"
                                                            disabled={!connected || isPaused || !String(draft || "").trim() || sendingMessage}
                                                            aria-label="Send message"
                                                        >
                                                            {sendingMessage ? <InlineSpinner size="sm" tone="light" label="Sending message" /> : <SendIcon />}
                                                        </button>
                                                    </form>
                                                )}

                                                {isEnded && (
                                                    <div className="conversation-ended-footer-bar">
                                                        <Leaf size={13} strokeWidth={1.8} />
                                                        <span>Conversation closed — messages can no longer be sent</span>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </>
                            )}
                        </section>
                    </div>
                </DesktopAppShell>
                {/* ── Manage Connection Sheet / Modal ── */}
                <ManageConnectionSheet
                    open={manageSheetOpen}
                    onClose={() => setManageSheetOpen(false)}
                    onSelect={handleManageSheetSelect}
                    busyAction={connectionBusyAction}
                    isPaused={(conversationStatusOverrides[activeConversationId] || (activeConversation && activeConversation.status)) === "PAUSED"}
                    isPausedByMe={(() => {
                        const activePausedBy = conversationStatusOverrides[activeConversationId + "_pausedBy"] !== undefined
                            ? conversationStatusOverrides[activeConversationId + "_pausedBy"]
                            : (activeConversation && activeConversation.pausedBy);
                        return Number(activePausedBy || 0) === Number(userId);
                    })()}
                    isArchived={Boolean(activeConversation && activeConversation.isArchivedForMe)}
                    isEnded={(conversationStatusOverrides[activeConversationId] || (activeConversation && activeConversation.status)) === "ENDED"}
                />

                {/* ── End Connection Sheet / Modal ── */}
                <EndConnectionSheet
                    open={endSheetOpen}
                    onClose={() => setEndSheetOpen(false)}
                    onConfirm={handleEndConnection}
                    submitting={endingConversation}
                />
            </div>
        );
    }

    return (
        <div
            className={`chat-mobile-page${activeConversation ? " chat-mobile-page--thread" : ""}`}
            style={isMobileThreadView && mobileViewportFrame ? {
                "--chat-mobile-bottom-inset": `${mobileViewportFrame.bottomInset}px`,
                "--chat-mobile-visible-height": `${mobileViewportFrame.height}px`,
                top: `${mobileViewportFrame.offsetTop}px`,
                height: `${mobileViewportFrame.height}px`
            } : undefined}
            {...swipeNavigationHandlers}
        >
            {notice && <p className="chat-mobile-alert chat-mobile-alert--notice">{notice}</p>}

            {!activeConversation && !isRequestsView && (
                <>
                    <nav className="chat-inbox-tabs" aria-label="Conversation filters">
                        <button
                            type="button"
                            className={`chat-inbox-tab${inboxTab === "active" ? " is-active" : ""}`}
                            onClick={() => setInboxTab("active")}
                        >
                            Active
                        </button>
                        <button
                            type="button"
                            className={`chat-inbox-tab${inboxTab === "past" ? " is-active" : ""}`}
                            onClick={() => setInboxTab("past")}
                        >
                            Past
                            {pastConversationsCount > 0 && (
                                <span className="chat-inbox-tab__badge">{pastConversationsCount}</span>
                            )}
                        </button>
                        <button
                            type="button"
                            className={`chat-inbox-tab${inboxTab === "archived" ? " is-active" : ""}`}
                            onClick={() => setInboxTab("archived")}
                        >
                            Archived
                            {archivedConversationsCount > 0 && (
                                <span className="chat-inbox-tab__badge">{archivedConversationsCount}</span>
                            )}
                        </button>
                    </nav>

                    {inboxTab === "past" && (
                        <div className="chat-inbox-tab-notice">
                            Conversations that have come to an end. Visible only to you - the other person never learns who closed it.
                        </div>
                    )}

                    {inboxTab === "archived" && (
                        <div className="chat-inbox-tab-notice">
                            Your private shelf. Archiving only affects your inbox - the other person&apos;s copy stays exactly where it was.
                        </div>
                    )}

                    {showSearch && (
                        <section className="chat-search" style={{ padding: "0 1.25rem 1rem" }}>
                            <div className="chat-search__field">
                                <SearchIcon />
                                <input
                                    type="text"
                                    placeholder="Search by name or message"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                />
                            </div>
                        </section>
                    )}

                    <main className="chat-content">
                        {loadingIndex && <ChatListSkeleton count={5} />}

                        {!loadingIndex && filteredConversationItems.length === 0 && (
                            <ChatEmptyState />
                        )}

                        {!loadingIndex && filteredConversationItems.length > 0 && inboxTab === "active" && (
                            <div className="chat-conversation-list">
                                {filteredConversationItems.map((conversation) => (
                                    <button
                                        key={conversation.id}
                                        type="button"
                                        className="chat-conversation-card"
                                        onClick={() => openConversation(conversation.id)}
                                    >
                                        <UserAvatar avatarId={conversation.avatar} className="chat-conversation-card__avatar" />

                                        <div className="chat-conversation-card__body">
                                            <h2>{conversation.title}</h2>
                                            <p>{conversation.subtitle}</p>
                                        </div>

                                        <div className="chat-conversation-card__aside">
                                            <span>{conversation.listMetaLabel}</span>
                                            {conversation.unreadCount > 0 && (
                                                <strong>{conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}</strong>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {!loadingIndex && filteredConversationItems.length > 0 && inboxTab === "past" && (
                            <div className="chat-conversation-list">
                                {filteredConversationItems.map((conversation) => (
                                    <div key={conversation.id} className="chat-tabbed-card">
                                        <button
                                            type="button"
                                            className="chat-tabbed-card__head"
                                            onClick={() => openConversation(conversation.id)}
                                        >
                                            <UserAvatar avatarId={conversation.avatar} className="chat-tabbed-card__avatar" />
                                            <div className="chat-tabbed-card__body">
                                                <h2>{conversation.title}</h2>
                                                <p>Conversation ended</p>
                                            </div>
                                            <div className="chat-tabbed-card__meta">
                                                <span>{conversation.timeLabel}</span>
                                                <ChevronRight size={16} />
                                            </div>
                                        </button>

                                        <div className="chat-tabbed-card__actions">
                                            <button
                                                type="button"
                                                className="chat-tabbed-card__btn"
                                                onClick={() => handleArchiveConnection(conversation.id)}
                                            >
                                                <Archive size={15} />
                                                <span>Archive</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loadingIndex && filteredConversationItems.length > 0 && inboxTab === "archived" && (
                            <div className="chat-conversation-list">
                                {filteredConversationItems.map((conversation) => {
                                    const isEnded = conversation.status === "ENDED";
                                    const subtitleText = isEnded ? "Conversation ended" : "Archived while active";
                                    return (
                                        <div key={conversation.id} className="chat-tabbed-card">
                                            <button
                                                type="button"
                                                className="chat-tabbed-card__head"
                                                onClick={() => openConversation(conversation.id)}
                                            >
                                                <UserAvatar avatarId={conversation.avatar} className="chat-tabbed-card__avatar" />
                                                <div className="chat-tabbed-card__body">
                                                    <h2>{conversation.title}</h2>
                                                    <p>{subtitleText}</p>
                                                </div>
                                                <div className="chat-tabbed-card__meta">
                                                    <span>{conversation.timeLabel}</span>
                                                    <ChevronRight size={16} />
                                                </div>
                                            </button>

                                            <div className="chat-tabbed-card__actions">
                                                <button
                                                    type="button"
                                                    className="chat-tabbed-card__btn"
                                                    onClick={() => handleUnarchiveConnection(conversation.id)}
                                                >
                                                    <Archive size={15} />
                                                    <span>Unarchive</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </main>
                </>
            )}

            {!activeConversation && isRequestsView && (
                <>
                    <header className="chat-requests-header">
                        <button type="button" className="chat-thread-header__back" onClick={closeConversation}>
                            <ArrowLeftIcon />
                        </button>
                        <div className="chat-requests-header__copy">
                            <h1>Chat Requests</h1>
                            <p>{formatRequestSummary(pendingRequestCount)}</p>
                        </div>
                    </header>

                    <main className="chat-requests-content">
                        {pendingRequests.length > 0 && (
                            <section className="chat-requests-section">
                                <span className="chat-requests-section__label">Pending</span>
                                <div className="chat-requests-list">
                                    {pendingRequests.map((request) => (
                                        <PendingRequestCard
                                            key={request.requestId}
                                            request={request}
                                            handlingRequestId={handlingRequestId}
                                            onRespond={handleRespondToRequest}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {acceptedRequests.length > 0 && (
                            <section className="chat-requests-section">
                                <span className="chat-requests-section__label">Accepted</span>
                                <div className="chat-requests-list">
                                    {acceptedRequests.map((request) => (
                                        <AcceptedRequestCard
                                            key={request.requestId}
                                            request={request}
                                            onOpenConversation={openAcceptedConversation}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {pendingRequests.length === 0 && acceptedRequests.length === 0 && !loadingIndex && (
                            <ChatRequestsEmptyState />
                        )}

                        <section className="chat-requests-info">
                            <strong>About Chat Requests</strong>
                            <ul>
                                <li>Users can request to chat after liking your content</li>
                                <li>Accept requests to start a private conversation</li>
                                <li>Your anonymity is maintained throughout</li>
                            </ul>
                        </section>
                    </main>

                </>
            )}

            {activeConversation && (
                <>
                    {(() => {
                        const convStatus = conversationStatusOverrides[activeConversationId] || activeConversation.status;
                        const isPaused = convStatus === "PAUSED";
                        const isEnded = convStatus === "ENDED";
                        const currentPausedBy = conversationStatusOverrides[activeConversationId + "_pausedBy"] !== undefined
                            ? conversationStatusOverrides[activeConversationId + "_pausedBy"]
                            : activeConversation.pausedBy;
                        const isPausedByMe = Number(currentPausedBy) === Number(userId);
                        const otherName = activeConversation.title || "Other user";
                        const pausedSubtitle = isPausedByMe
                            ? "• You paused this conversation"
                            : `• ${otherName} paused this conversation`;
                        const pausedBannerText = isPausedByMe || !currentPausedBy
                            ? "You paused this conversation. Nothing was ended."
                            : `${otherName} paused this conversation. Nothing was ended.`;
                        const statusText = isPaused
                            ? pausedSubtitle
                            : isEnded
                            ? "Conversation ended"
                            : activeConversationStatus;

                        return (
                            <>
                                <header className="chat-thread-header">
                                    <button type="button" className="chat-thread-header__back" onClick={closeConversation}>
                                        <ArrowLeftIcon />
                                    </button>

                                    <button
                                        type="button"
                                        className="chat-thread-header__identity"
                                        onClick={() => {
                                            const targetParam = activeConversation.otherUsername || activeConversation.title || activeConversation.otherUserId;
                                            if (targetParam) navigate(`/user/${targetParam}`, { state: { profileUser: { id: activeConversation.otherUserId, username: activeConversation.title } } });
                                        }}
                                    >
                                        <UserAvatar avatarId={activeConversation.avatar} className="chat-conversation-card__avatar" />
                                        <div className="chat-mobile-header__titles">
                                            <strong>{activeConversation.title}</strong>
                                            <small style={isPaused ? { color: "#806b78" } : undefined}>
                                                {statusText}
                                            </small>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        className="chat-thread-header__more"
                                        onClick={handleOpenManageSheet}
                                        aria-label="Manage connection"
                                    >
                                        <MoreIcon />
                                    </button>
                                </header>

                                {isPaused && (
                                    <div className="chat-thread-paused-banner" role="status">
                                        <Pause size={16} strokeWidth={2} />
                                        <span>{pausedBannerText}</span>
                                    </div>
                                )}
                            </>
                        );
                    })()}

                    {(() => {
                        const convStatus = conversationStatusOverrides[activeConversationId] || activeConversation.status;
                        const isPaused = convStatus === "PAUSED";
                        const isEnded = convStatus === "ENDED";
                        const closingNote = closingNoteOverrides[activeConversationId] || getClosingNoteDisplay(activeConversation);
                        return (
                            <>
                                <main className="chat-thread-content" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                                    {loadingMessages && messages.length === 0 && <div style={{ padding: '1rem' }}><ChatThreadSkeleton count={5} /></div>}

                                    {!loadingMessages && messages.length === 0 && !isEnded && (
                                        <div className="chat-thread-empty">
                                            <p>Say hi to start the <em>conversation</em></p>
                                        </div>
                                    )}

                                    {!loadingMessages && messages.length > 0 && (
                                        <div
                                            ref={threadContentRef}
                                            className="chat-thread-messages"
                                            onScroll={handleMessagesScroll}
                                            style={{ flex: 1, minHeight: 0, padding: "1rem 1rem 0.5rem", overflowY: "auto" }}
                                        >
                                            {hasMoreMessages && (
                                                <button
                                                    type="button"
                                                    className="chat-thread-load-more"
                                                    onClick={() => {
                                                        if (loadingMessages || loadingOlderMessages || !hasMoreMessages) return;
                                                        olderMessagesLoadRef.current = true;
                                                        setMessageLimit((prev) => prev + MESSAGE_PAGE_SIZE);
                                                    }}
                                                    disabled={loadingOlderMessages}
                                                >
                                                    {loadingOlderMessages ? "Loading earlier messages..." : "Load earlier messages"}
                                                </button>
                                            )}

                                            {messages.map((message) => {
                                                const isMine = Number(message && message.senderId) === userId;
                                                return (
                                                    <MemoizedMessageBubble
                                                        key={message.id}
                                                        message={message}
                                                        isMine={isMine}
                                                        title={activeConversation.title}
                                                        avatar={activeConversation.avatar}
                                                        isDesktop={false}
                                                    />
                                                );
                                            })}

                                            {isEnded && (
                                                <ConversationEndedPanel
                                                    closingNoteText={closingNote}
                                                    onArchive={handleArchiveEndedConversation}
                                                    isInitiator={true}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {!loadingMessages && messages.length === 0 && isEnded && (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                                            <ConversationEndedPanel
                                                closingNoteText={closingNote}
                                                onArchive={handleArchiveEndedConversation}
                                                isInitiator={true}
                                            />
                                        </div>
                                    )}
                                </main>

                                {!isEnded && (
                                    <form className="chat-thread-composer" autoComplete="off" onSubmit={handleDraftSubmit}>
                                        <textarea
                                            ref={mobileTextareaRef}
                                            name="chat_message"
                                            value={isPaused ? "" : draft}
                                            onChange={(event) => {
                                                setDraft(event.target.value);
                                                if (event.target) {
                                                    event.target.style.height = "auto";
                                                    event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`;
                                                }
                                            }}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" && !event.shiftKey) {
                                                    event.preventDefault();
                                                    handleDraftSubmit(event);
                                                    if (mobileTextareaRef.current) {
                                                        mobileTextareaRef.current.style.height = "auto";
                                                    }
                                                }
                                            }}
                                            placeholder={isPaused ? "Conversation paused" : "Type a message..."}
                                            maxLength={1500}
                                            disabled={!connected || isPaused}
                                            autoComplete="off"
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            spellCheck={false}
                                            rows={1}
                                            enterKeyHint="send"
                                        />
                                        <button type="submit" disabled={!connected || isPaused || !String(draft || "").trim() || sendingMessage} aria-label="Send message">
                                            {sendingMessage ? <InlineSpinner size="sm" tone="dark" label="Sending message" /> : <SendIcon />}
                                        </button>
                                    </form>
                                )}

                                {isEnded && (
                                    <div className="conversation-ended-footer-bar">
                                        <Leaf size={13} strokeWidth={1.8} />
                                        <span>Conversation closed — messages can no longer be sent</span>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </>
            )}

            {/* ── Manage Connection Sheet ── */}
            <ManageConnectionSheet
                open={manageSheetOpen}
                onClose={() => setManageSheetOpen(false)}
                onSelect={handleManageSheetSelect}
                busyAction={connectionBusyAction}
                isPaused={(conversationStatusOverrides[activeConversationId] || (activeConversation && activeConversation.status)) === "PAUSED"}
                isPausedByMe={(() => {
                    const activePausedBy = conversationStatusOverrides[activeConversationId + "_pausedBy"] !== undefined
                        ? conversationStatusOverrides[activeConversationId + "_pausedBy"]
                        : (activeConversation && activeConversation.pausedBy);
                    return Number(activePausedBy || 0) === Number(userId);
                })()}
                isArchived={Boolean(activeConversation && activeConversation.isArchivedForMe)}
                isEnded={(conversationStatusOverrides[activeConversationId] || (activeConversation && activeConversation.status)) === "ENDED"}
            />

            {/* ── End Connection Sheet ── */}
            <EndConnectionSheet
                open={endSheetOpen}
                onClose={() => setEndSheetOpen(false)}
                onConfirm={handleEndConnection}
                submitting={endingConversation}
            />
        </div>
    );
}
