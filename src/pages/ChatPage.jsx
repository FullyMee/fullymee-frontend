import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DesktopAppShell from "../components/layout/DesktopAppShell.jsx";
import { Link, useSearchParams } from "react-router-dom";
import DesktopEmptyState from "../components/common/DesktopEmptyState.jsx";
import { getChatAvatarGlyph } from "../components/common/MobileRoomVisuals.jsx";
import { ChatListSkeleton, ChatThreadSkeleton, InfiniteScrollLoader, InlineSpinner } from "../components/common/LoadingStates.jsx";
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
import { waitForSocketConnection } from "../services/socket.js";
import { getJoinedRooms } from "../services/confession.service";
import { getInitial } from "../utils/presentation.js";
import {
    listChatRequests,
    listConversationMessages,
    listConversationUnreadCounts,
    listConversations,
    listUsers,
    respondToChatRequest
} from "../services/chat.service";
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

const MESSAGE_PAGE_SIZE = 30;


export default function ChatPage({ user }) {
    const isDesktop = useIsDesktop();
    const [searchParams, setSearchParams] = useSearchParams();
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
    const olderMessagesLoadRef = useRef(false);
    const previousScrollHeightRef = useRef(0);

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
                listConversations(),
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
                avatarTone: getAvatarTone(rawTitle)
            };
        });
    }, [acceptedRequestLabelsByConversation, connected, conversations, onlineUsers, previewByConversation, unreadByConversation, userId, usersById]);

    const filteredConversationItems = useMemo(() => {
        const term = String(searchQuery || "").trim().toLowerCase();
        if (!term) return conversationItems;

        return conversationItems.filter((conversation) => {
            const haystack = `${conversation.title || ""} ${conversation.subtitle || ""}`.toLowerCase();
            return haystack.includes(term);
        });
    }, [conversationItems, searchQuery]);

    const activeConversation = useMemo(
        () => conversationItems.find((conversation) => Number(conversation.id) === activeConversationId) || null,
        [activeConversationId, conversationItems]
    );

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
        });
        const timer = setTimeout(() => {
            if (threadContentRef.current) {
                threadContentRef.current.scrollTop = threadContentRef.current.scrollHeight;
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [activeConversationId, isDesktop, messages.length, mobileViewportFrame]);

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

        socket.on("receive_message", handleReceiveMessage);
        socket.on("dm_created", handleDmCreated);
        socket.on("chat_request_created", handleChatRequestEvent);
        socket.on("chat_request_updated", handleChatRequestEvent);
        socket.on("unread_update", handleUnreadUpdate);
        socket.on("unread_reset", handleUnreadReset);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("dm_created", handleDmCreated);
            socket.off("chat_request_created", handleChatRequestEvent);
            socket.off("chat_request_updated", handleChatRequestEvent);
            socket.off("unread_update", handleUnreadUpdate);
            socket.off("unread_reset", handleUnreadReset);
        };
    }, [activeConversationId, loadConversationIndex, markConversationRead, socket, userId]);

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
                                    <DesktopEmptyState
                                        compact
                                        title="No conversations found"
                                        description="Try another search or start from Search to connect with someone."
                                        action={<Link to="/search" className="chat-empty-card__link">Find People</Link>}
                                    />
                                )}

                                {!loadingIndex && !isRequestsView && filteredConversationItems.length > 0 && (
                                    <div className="desktop-chat-list desktop-chat-list--reference">
                                        {filteredConversationItems.map((conversation) => (
                                            <button
                                                key={conversation.id}
                                                type="button"
                                                className={`desktop-chat-list__item${Number(conversation.id) === activeConversationId ? " is-active" : ""}`}
                                                onClick={() => openConversation(conversation.id)}
                                            >
                                                <div className={`desktop-chat-avatar desktop-chat-avatar--${conversation.avatarTone}`}>
                                                    <span>{getInitial(conversation.title)}</span>
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
                                    <header className="desktop-chat-column__header desktop-chat-column__header--thread">
                                        <div className="desktop-chat-thread__identity">
                                            <div className={`desktop-chat-avatar desktop-chat-avatar--${activeConversation.avatarTone}`}>
                                                <span>{getInitial(activeConversation.title)}</span>
                                            </div>
                                            <div>
                                                <strong>{activeConversation.title}</strong>
                                                <small>{activeConversationStatus}</small>
                                            </div>
                                        </div>
                                    </header>

                                    <main className="desktop-chat-thread__messages desktop-chat-thread__messages--reference" style={{ display: 'flex', flexDirection: 'column' }}>
                                        {loadingMessages && messages.length === 0 && <ChatThreadSkeleton count={5} />}
                                        
                                        {!loadingMessages && (
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
                                                            avatarTone={activeConversation.avatarTone}
                                                            isDesktop={true}
                                                        />
                                                    );
                                                }}
                                            />
                                        )}
                                    </main>

                                    <form className="desktop-chat-thread__composer desktop-chat-thread__composer--reference" onSubmit={handleDraftSubmit}>
                                        <div className="desktop-chat-thread__composer-shell">
                                            <input
                                                type="text"
                                                value={draft}
                                                onChange={(event) => setDraft(event.target.value)}
                                                placeholder="Type a message..."
                                                maxLength={1500}
                                                disabled={!connected}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="desktop-chat-thread__send"
                                            disabled={!connected || !String(draft || "").trim() || sendingMessage}
                                            aria-label="Send message"
                                        >
                                            {sendingMessage ? <InlineSpinner size="sm" tone="light" label="Sending message" /> : <SendIcon />}
                                        </button>
                                    </form>
                                </>
                            )}
                        </section>
                    </div>
                </DesktopAppShell>
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
                    <header className="chat-header">
                        <div className="chat-header__row">
                            <div className="chat-header__title">
                                <h1>Chats</h1>
                                <p>Connect with people anonymously</p>
                            </div>
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

                    <section className="chat-search">
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

                    <main className="chat-content">
                        {loadingIndex && <ChatListSkeleton count={5} />}

                        {!loadingIndex && filteredConversationItems.length === 0 && (
                            <section className="chat-empty-card">
                                <h2>No conversations found</h2>
                                <p>Try another search or connect with someone from the Search page.</p>
                            </section>
                        )}

                        {!loadingIndex && filteredConversationItems.length > 0 && (
                            <div className="chat-conversation-list">
                                {filteredConversationItems.map((conversation) => (
                                    <button
                                        key={conversation.id}
                                        type="button"
                                        className="chat-conversation-card"
                                        onClick={() => openConversation(conversation.id)}
                                    >
                                        <div className={`chat-conversation-card__avatar chat-conversation-card__avatar--${conversation.avatarTone}`}>
                                            <span>{conversation.avatarLabel}</span>
                                        </div>

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
                            <section className="chat-empty-card">
                                <h2>No chat requests yet</h2>
                                <p>When someone sends you a request from a confession, it will appear here.</p>
                            </section>
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
                    <header className="chat-thread-header">
                        <button type="button" className="chat-thread-header__back" onClick={closeConversation}>
                            <ArrowLeftIcon />
                        </button>

                        <button type="button" className="chat-thread-header__identity">
                            <div className={`chat-conversation-card__avatar chat-conversation-card__avatar--${activeConversation.avatarTone}`}>
                                <span>{activeConversation.avatarLabel}</span>
                            </div>
                            <div>
                                <strong>{activeConversation.title}</strong>
                                <small>{activeConversationStatus}</small>
                            </div>
                        </button>
                        <button
                            type="button"
                            className="chat-thread-header__more"
                            onClick={() => setNotice("More chat actions will appear here.")}
                            aria-label="More options"
                        >
                            <MoreIcon />
                        </button>
                    </header>

                    <main className="chat-thread-content" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                        {loadingMessages && messages.length === 0 && <div style={{ padding: '1rem' }}><ChatThreadSkeleton count={5} /></div>}

                        {!loadingMessages && messages.length === 0 && (
                            <div className="chat-thread-empty">
                                <p>Say hi to start the <em>conversation</em></p>
                            </div>
                        )}

                        {!loadingMessages && messages.length > 0 && (
                            <div
                                ref={threadContentRef}
                                className="chat-thread-messages"
                                style={{ flex: 1, minHeight: 0, padding: "1rem", overflowY: "auto" }}
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
                                            isDesktop={false}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </main>

                    <form className="chat-thread-composer" autoComplete="off" onSubmit={handleDraftSubmit}>
                        <input
                            type="search"
                            name="chat_message"
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onFocus={() => {
                                setTimeout(() => {
                                    if (threadContentRef.current) {
                                        threadContentRef.current.scrollTop = threadContentRef.current.scrollHeight;
                                    }
                                }, 150);
                                setTimeout(() => {
                                    if (threadContentRef.current) {
                                        threadContentRef.current.scrollTop = threadContentRef.current.scrollHeight;
                                    }
                                }, 350);
                            }}
                            placeholder="Type a message..."
                            maxLength={1500}
                            disabled={!connected}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            enterKeyHint="send"
                            inputMode="text"
                        />
                        <button type="submit" disabled={!connected || !String(draft || "").trim() || sendingMessage} aria-label="Send message">
                            {sendingMessage ? <InlineSpinner size="sm" tone="dark" label="Sending message" /> : <SendIcon />}
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}
