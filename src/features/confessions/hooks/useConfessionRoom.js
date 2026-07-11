import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGlobalError } from "../../../context/ErrorContext.jsx";
import useBodyClass from "../../../hooks/useBodyClass.js";
import useIntersectionLoadMore from "../../../hooks/useIntersectionLoadMore";
import useTimedNotice from "../../../hooks/useTimedNotice.js";
import {
    getJoinedRooms,
    leaveConfessionRoom,
    getRoomMembers,
    listConfessions,
    listReplies,
    postConfession,
    postReply,
    likeConfession,
    likeReply,
    sendConfessionChatRequest,
    sendConfessionPresencePing,
    subscribeConfessionRoom,
    unsubscribeConfessionRoom,
    shuffleRoomAlias,
    getMyScheduledConfessions,
    confirmScheduledConfession,
    cancelScheduledConfession
} from "../../../services/confession.service";
import { getSocket } from "../../../services/socket";
import { asArray, uniqueByNumericId } from "../utils/confessionView.js";

const CONFESSION_PAGE_SIZE = 8;
const REPLY_PAGE_SIZE = 10;

export default function useConfessionRoom() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { showError, dismissError } = useGlobalError();

    const [joinedRooms, setJoinedRooms] = useState([]);
    const [roomMembers, setRoomMembers] = useState([]);
    const [confessions, setConfessions] = useState([]);
    const [repliesByConfession, setRepliesByConfession] = useState({});
    const [confessionDraft, setConfessionDraft] = useState("");
    const [replyDrafts, setReplyDrafts] = useState({});
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [loadingConfessions, setLoadingConfessions] = useState(false);
    const [loadingMoreConfessions, setLoadingMoreConfessions] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [loadingMoreReplies, setLoadingMoreReplies] = useState(false);
    const [notice, setNotice] = useTimedNotice("", 2200);
    const [leavingRoomId, setLeavingRoomId] = useState(null);
    const [copiedRoomId, setCopiedRoomId] = useState(null);
    const [showComposer, setShowComposer] = useState(false);
    const [likedConfessionIds, setLikedConfessionIds] = useState(() => new Set());
    const [likedReplyIds, setLikedReplyIds] = useState(() => new Set());
    const [chatRequestTarget, setChatRequestTarget] = useState(null);
    const [sendingChatRequest, setSendingChatRequest] = useState(false);
    const [chatRequestSuccess, setChatRequestSuccess] = useState(null);
    const [sentChatRequestIds, setSentChatRequestIds] = useState(() => new Set());
    const [confessionLimit, setConfessionLimit] = useState(CONFESSION_PAGE_SIZE);
    const [replyLimit, setReplyLimit] = useState(REPLY_PAGE_SIZE);
    const [hasMoreConfessions, setHasMoreConfessions] = useState(false);
    const [hasMoreReplies, setHasMoreReplies] = useState(false);
    const [postingConfession, setPostingConfession] = useState(false);
    const [postingReplyId, setPostingReplyId] = useState(0);
    const [reactingConfessionIds, setReactingConfessionIds] = useState(() => new Set());
    const [reactingReplyIds, setReactingReplyIds] = useState(() => new Set());
    const [shufflingAlias, setShufflingAlias] = useState(false);
    const [scheduledConfessions, setScheduledConfessions] = useState([]);
    const [pendingConfirmation, setPendingConfirmation] = useState(null);
    const [selectedScheduledAt, setSelectedScheduledAt] = useState(null);
    const hasLoadedConfessionsRef = useRef(false);
    const hasLoadedRepliesRef = useRef(false);

    const activeRoomId = Number(searchParams.get("roomId") || 0);
    const selectedConfessionId = Number(searchParams.get("confessionId") || 0);

    const activeRoom = useMemo(
        () => joinedRooms.find((room) => Number(room.roomId) === activeRoomId) || null,
        [joinedRooms, activeRoomId]
    );
    const selectedConfession = useMemo(
        () => confessions.find((item) => Number(item.confessionId) === selectedConfessionId) || null,
        [confessions, selectedConfessionId]
    );
    const selectedReplies = useMemo(
        () => asArray(repliesByConfession[selectedConfessionId]),
        [repliesByConfession, selectedConfessionId]
    );
    const detailReplyDraft = selectedConfession ? (replyDrafts[selectedConfession.confessionId] || "") : "";

    const loadMoreConfessions = useCallback(() => {
        setConfessionLimit((prev) => prev + CONFESSION_PAGE_SIZE);
    }, []);

    const loadMoreReplies = useCallback(() => {
        setReplyLimit((prev) => prev + REPLY_PAGE_SIZE);
    }, []);

    const repliesLoadMoreRef = useIntersectionLoadMore(loadMoreReplies, {
        enabled: !!selectedConfession && !loadingReplies && !loadingMoreReplies && hasMoreReplies
    });

    const refreshRoomMembers = useCallback(async (roomId) => {
        if (!roomId) {
            setRoomMembers([]);
            return;
        }

        setRoomMembers([]);
        try {
            const rows = await getRoomMembers(roomId);
            setRoomMembers(Array.isArray(rows) ? rows : []);
        } catch {
            setRoomMembers([]);
        }
    }, []);

    useBodyClass("confessions-scroll-unlocked");

    useEffect(() => {
        let cancelled = false;

        async function loadRooms() {
            try {
                setLoadingRooms(true);
                const rooms = await getJoinedRooms();
                if (cancelled) return;
                setJoinedRooms(uniqueByNumericId(rooms, (room) => room && room.roomId));
                dismissError();
            } catch (err) {
                if (!cancelled) {
                    showError(err && err.message ? err.message : "Unable to load your confession rooms.");
                }
            } finally {
                if (!cancelled) {
                    setLoadingRooms(false);
                }
            }
        }

        loadRooms();
        return () => {
            cancelled = true;
        };
    }, [dismissError, showError]);

    const refreshConfessions = useCallback(async (roomId) => {
        if (!roomId) return;

        const isIncrementalLoad = hasLoadedConfessionsRef.current && confessionLimit > CONFESSION_PAGE_SIZE;
        if (isIncrementalLoad) {
            setLoadingMoreConfessions(true);
        } else {
            setLoadingConfessions(true);
        }

        try {
            const rows = await listConfessions(roomId, { limit: confessionLimit });
            setConfessions(uniqueByNumericId(rows, (row) => row && row.confessionId));
            const likedIds = asArray(rows)
                .filter((row) => row && row.likedByViewer)
                .map((row) => Number(row.confessionId))
                .filter(Boolean);
            const sentRequestIds = asArray(rows)
                .filter((row) => ['pending', 'accepted'].includes(String(row && row.viewerChatRequestStatus ? row.viewerChatRequestStatus : '').trim()))
                .map((row) => Number(row.confessionId))
                .filter(Boolean);
            setLikedConfessionIds(new Set(likedIds));
            setSentChatRequestIds(new Set(sentRequestIds));
            setHasMoreConfessions(Array.isArray(rows) && rows.length >= confessionLimit);
            hasLoadedConfessionsRef.current = true;
            dismissError();
        } catch (err) {
            setConfessions([]);
            setHasMoreConfessions(false);
            showError(err && err.message ? err.message : "Failed to load confessions.");
        } finally {
            setLoadingConfessions(false);
            setLoadingMoreConfessions(false);
        }
    }, [confessionLimit, dismissError, showError]);

    const fetchReplies = useCallback(async (confessionId) => {
        if (!activeRoomId || !confessionId) return;

        const isIncrementalLoad = hasLoadedRepliesRef.current && replyLimit > REPLY_PAGE_SIZE;
        if (isIncrementalLoad) {
            setLoadingMoreReplies(true);
        } else {
            setLoadingReplies(true);
        }

        try {
            const rows = await listReplies(activeRoomId, confessionId, { limit: replyLimit });
            setRepliesByConfession((prev) => ({
                ...prev,
                [confessionId]: uniqueByNumericId(rows, (row) => row && row.replyId)
            }));
            const likedReplyIdsFromRows = asArray(rows)
                .filter((row) => row && row.likedByViewer)
                .map((row) => Number(row.replyId))
                .filter(Boolean);
            setLikedReplyIds(new Set(likedReplyIdsFromRows));
            setHasMoreReplies(Array.isArray(rows) && rows.length >= replyLimit);
            hasLoadedRepliesRef.current = true;
            dismissError();
        } catch (err) {
            setHasMoreReplies(false);
            showError(err && err.message ? err.message : "Unable to load replies.");
        } finally {
            setLoadingReplies(false);
            setLoadingMoreReplies(false);
        }
    }, [activeRoomId, dismissError, replyLimit, showError]);

    useEffect(() => {
        if (!activeRoomId) {
            setConfessions([]);
            setRoomMembers([]);
            setConfessionLimit(CONFESSION_PAGE_SIZE);
            setHasMoreConfessions(false);
            hasLoadedConfessionsRef.current = false;
            return;
        }

        hasLoadedConfessionsRef.current = false;
        setConfessionLimit(CONFESSION_PAGE_SIZE);
        setHasMoreConfessions(false);
        refreshRoomMembers(activeRoomId);
    }, [activeRoomId, refreshRoomMembers]);

    useEffect(() => {
        if (!selectedConfessionId) {
            setReplyLimit(REPLY_PAGE_SIZE);
            setHasMoreReplies(false);
            hasLoadedRepliesRef.current = false;
            return;
        }

        hasLoadedRepliesRef.current = false;
        setReplyLimit(REPLY_PAGE_SIZE);
        setHasMoreReplies(false);
    }, [selectedConfessionId]);

    useEffect(() => {
        if (activeRoomId && activeRoom) {
            refreshConfessions(activeRoomId);
        }
    }, [activeRoom, activeRoomId, confessionLimit, refreshConfessions]);

    useEffect(() => {
        if (activeRoomId && selectedConfessionId) {
            fetchReplies(selectedConfessionId);
        }
    }, [activeRoomId, fetchReplies, replyLimit, selectedConfessionId]);

    useEffect(() => {
        if (!selectedConfessionId || loadingConfessions) return;
        if (confessions.some((item) => Number(item.confessionId) === selectedConfessionId)) return;
        if (!activeRoomId) return;
        setSearchParams({ roomId: String(activeRoomId) });
    }, [activeRoomId, confessions, loadingConfessions, selectedConfessionId, setSearchParams]);

    useEffect(() => {
        if (!activeRoomId) return undefined;

        const roomId = Number(activeRoomId);
        const socket = getSocket();
        let isUnmounted = false;

        subscribeConfessionRoom(roomId).catch(() => { });

        function handleConfessionCreated(payload) {
            const confession = payload && payload.confession ? payload.confession : payload;
            if (Number(confession && confession.roomId) !== roomId) return;
            setConfessions((prev) => uniqueByNumericId([confession, ...prev], (row) => row && row.confessionId).slice(0, 100));
        }

        function handleReplyCreated(payload) {
            const reply = payload && payload.reply ? payload.reply : null;
            const confessionId = Number(payload && payload.confessionId);
            if (!reply || Number(reply.roomId) !== roomId || !confessionId) return;

            setConfessions((prev) => prev.map((row) => (
                Number(row.confessionId) === confessionId
                    ? { ...row, replyCount: Number(row.replyCount || 0) + 1 }
                    : row
            )));

            setRepliesByConfession((prev) => {
                if (!prev[confessionId]) return prev;
                return {
                    ...prev,
                    [confessionId]: uniqueByNumericId([reply, ...prev[confessionId]], (entry) => entry && entry.replyId)
                };
            });
        }

        function handleLikesUpdated(payload) {
            const confessionId = Number(payload && payload.confessionId);
            const likesCount = Number(payload && payload.likesCount);
            if (!confessionId || Number.isNaN(likesCount)) return;

            setConfessions((prev) => prev.map((row) => (
                Number(row.confessionId) === confessionId
                    ? { ...row, reactionCount: likesCount, likesCount }
                    : row
            )));
        }

        function handleReactionUpdated(payload) {
            const targetType = payload && payload.targetType;
            const targetId = Number(payload && payload.targetId);
            const reactionCount = Number(payload && payload.reactionCount);
            if (!targetId || Number.isNaN(reactionCount)) return;

            if (targetType === "confession") {
                setConfessions((prev) => prev.map((row) => (
                    Number(row.confessionId) === targetId ? { ...row, reactionCount } : row
                )));
                return;
            }

            if (targetType === "reply") {
                setRepliesByConfession((prev) => {
                    const next = {};
                    for (const key of Object.keys(prev)) {
                        next[key] = asArray(prev[key]).map((reply) => (
                            Number(reply.replyId) === targetId ? { ...reply, reactionCount } : reply
                        ));
                    }
                    return next;
                });
            }
        }

        function handleContentHidden(payload) {
            const targetType = payload && payload.targetType;
            const targetId = Number(payload && payload.targetId);
            if (!targetId) return;

            if (targetType === "confession") {
                setConfessions((prev) => prev.filter((row) => Number(row.confessionId) !== targetId));
                setRepliesByConfession((prev) => {
                    const next = { ...prev };
                    delete next[targetId];
                    return next;
                });
                return;
            }

            if (targetType === "reply") {
                setRepliesByConfession((prev) => {
                    const next = {};
                    for (const key of Object.keys(prev)) {
                        next[key] = asArray(prev[key]).filter((reply) => Number(reply.replyId) !== targetId);
                    }
                    return next;
                });
            }
        }

        function handleRoomStats(payload) {
            if (Number(payload && payload.roomId) !== roomId) return;
            const currentUserCount = Number(payload && payload.currentUserCount);
            if (Number.isNaN(currentUserCount)) return;

            setJoinedRooms((prev) => prev.map((room) => (
                Number(room.roomId) === roomId
                    ? { ...room, currentUserCount }
                    : room
            )));
        }

        function handleRoomMembersUpdated(payload) {
            if (Number(payload && payload.roomId) !== roomId) return;
            setRoomMembers(Array.isArray(payload && payload.members) ? payload.members : []);
        }

        function handleMemberShuffled(payload) {
            if (Number(payload && payload.roomId) !== roomId) return;
            const newAlias = String(payload && payload.newAlias ? payload.newAlias : "");
            if (!newAlias) return;

            refreshRoomMembers(roomId);
        }

        function handleScheduledReady(payload) {
            if (Number(payload && payload.roomId) !== roomId) return;
            setPendingConfirmation({
                confessionId: Number(payload.confessionId),
                roomId: Number(payload.roomId),
                content: String(payload.content || ""),
                scheduledAt: payload.scheduledAt || null,
                confirmExpiresAt: payload.confirmExpiresAt || null
            });
        }

        if (socket) {
            socket.on("confession_created", handleConfessionCreated);
            socket.on("confession_reply_created", handleReplyCreated);
            socket.on("confession_reaction_updated", handleReactionUpdated);
            socket.on("confession:likesUpdated", handleLikesUpdated);
            socket.on("confession_content_hidden", handleContentHidden);
            socket.on("confession_room_stats", handleRoomStats);
            socket.on("confession_room_members_updated", handleRoomMembersUpdated);
            socket.on("confession_room_member_shuffled", handleMemberShuffled);
            socket.on("confession_scheduled_ready", handleScheduledReady);
        }

        return () => {
            if (isUnmounted) return;
            isUnmounted = true;
            unsubscribeConfessionRoom(roomId).catch(() => { });
            if (!socket) return;
            socket.off("confession_created", handleConfessionCreated);
            socket.off("confession_reply_created", handleReplyCreated);
            socket.off("confession_reaction_updated", handleReactionUpdated);
            socket.off("confession:likesUpdated", handleLikesUpdated);
            socket.off("confession_content_hidden", handleContentHidden);
            socket.off("confession_room_stats", handleRoomStats);
            socket.off("confession_room_members_updated", handleRoomMembersUpdated);
            socket.off("confession_room_member_shuffled", handleMemberShuffled);
            socket.off("confession_scheduled_ready", handleScheduledReady);
        };
    }, [activeRoomId, refreshRoomMembers]);

    useEffect(() => {
        if (!activeRoomId || !activeRoom) return undefined;

        sendConfessionPresencePing(activeRoomId);
        const timer = window.setInterval(() => {
            sendConfessionPresencePing(activeRoomId);
        }, 60000);

        return () => {
            window.clearInterval(timer);
        };
    }, [activeRoom, activeRoomId]);

    useEffect(() => {
        if (!copiedRoomId) return undefined;
        const timer = window.setTimeout(() => setCopiedRoomId(null), 1800);
        return () => window.clearTimeout(timer);
    }, [copiedRoomId]);

    useEffect(() => {
        if (!activeRoomId || !activeRoom || selectedConfessionId) {
            setShowComposer(false);
        }
    }, [activeRoom, activeRoomId, selectedConfessionId]);

    useEffect(() => {
        setChatRequestTarget(null);
    }, [activeRoomId, selectedConfessionId]);

    const openRoomsView = useCallback(() => {
        setSearchParams({});
    }, [setSearchParams]);

    const openRoomView = useCallback((roomId) => {
        setSearchParams({ roomId: String(roomId) });
    }, [setSearchParams]);

    const openConfessionView = useCallback((confessionId) => {
        if (!activeRoomId) return;
        setSearchParams({
            roomId: String(activeRoomId),
            confessionId: String(confessionId)
        });
    }, [activeRoomId, setSearchParams]);

    const closeConfessionView = useCallback(() => {
        if (!activeRoomId) {
            setSearchParams({});
            return;
        }
        setSearchParams({ roomId: String(activeRoomId) });
    }, [activeRoomId, setSearchParams]);

    const updateReplyDraft = useCallback((confessionId, value) => {
        setReplyDrafts((prev) => ({
            ...prev,
            [confessionId]: value
        }));
    }, []);

    const handleCopyRoomCode = useCallback(async (room) => {
        const roomId = Number(room && room.roomId);
        const code = room && room.joinCode ? String(room.joinCode) : "";
        if (!code) return;

        try {
            if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(code);
                setCopiedRoomId(roomId || -1);
                return;
            }
        } catch {
            // Fall back to notice.
        }

        setNotice(`Room code: ${code}`);
    }, [setNotice]);

    const handleLeaveRoom = useCallback(async (room) => {
        const roomId = Number(room && room.roomId);
        if (!roomId) return;

        try {
            setLeavingRoomId(roomId);
            dismissError();
            await leaveConfessionRoom(roomId);

            setJoinedRooms((prev) => prev.filter((entry) => Number(entry && entry.roomId) !== roomId));

            if (roomId === activeRoomId) {
                setSearchParams({});
            }

            setNotice(`Left ${room.title}`);
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to leave this room right now.");
        } finally {
            setLeavingRoomId(null);
        }
    }, [activeRoomId, dismissError, setNotice, setSearchParams, showError]);

    const handlePostConfession = useCallback(async (event, options = {}) => {
        event.preventDefault();
        const content = String(confessionDraft || "").trim();
        const audioPublicId = String(options.audioPublicId || "").trim();
        if (!activeRoomId || (!content && !audioPublicId)) return false;

        try {
            setPostingConfession(true);
            const result = await postConfession(activeRoomId, content, {
                scheduledAt: selectedScheduledAt || undefined,
                audioPublicId: audioPublicId || undefined
            });
            setConfessionDraft("");
            setSelectedScheduledAt(null);
            dismissError();

            if (result && result.moderationWarning) {
                setNotice(result.moderationWarning);
            }

            if (result && result.scheduled) {
                setScheduledConfessions((prev) => [
                    ...prev,
                    {
                        confessionId: result.scheduled.confessionId,
                        content: result.scheduled.content,
                        audio: result.scheduled.audio || null,
                        alias: result.scheduled.alias,
                        scheduledAt: result.scheduled.scheduledAt,
                        scheduleStatus: "pending",
                        confirmExpiresAt: null
                    }
                ]);
                setNotice("⏱ Confession scheduled");
            } else if (result && result.confession) {
                setConfessions((prev) => uniqueByNumericId([result.confession, ...prev], (row) => row && row.confessionId).slice(0, 100));
            } else {
                refreshConfessions(activeRoomId);
            }

            setShowComposer(false);
            return true;
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to post confession.");
            return false;
        } finally {
            setPostingConfession(false);
        }
    }, [activeRoomId, confessionDraft, dismissError, refreshConfessions, selectedScheduledAt, setNotice, showError]);

    const handlePostReply = useCallback(async (confessionId) => {
        const content = String(replyDrafts[confessionId] || "").trim();
        if (!activeRoomId || !confessionId || !content) return;

        try {
            setPostingReplyId(Number(confessionId));
            const result = await postReply(activeRoomId, confessionId, content);
            setReplyDrafts((prev) => ({ ...prev, [confessionId]: "" }));
            dismissError();

            if (result && result.moderationWarning) {
                setNotice(result.moderationWarning);
            }

            if (result && result.reply) {
                setRepliesByConfession((prev) => ({
                    ...prev,
                    [confessionId]: uniqueByNumericId([result.reply, ...asArray(prev[confessionId])], (entry) => entry && entry.replyId)
                }));
                setConfessions((prev) => prev.map((row) => (
                    Number(row.confessionId) === Number(confessionId)
                        ? { ...row, replyCount: Number(row.replyCount || 0) + 1 }
                        : row
                )));
            } else {
                fetchReplies(confessionId);
            }
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to post reply.");
        } finally {
            setPostingReplyId(0);
        }
    }, [activeRoomId, dismissError, fetchReplies, replyDrafts, setNotice, showError]);

    const handleReact = useCallback(async (targetType, targetId) => {
        if (!activeRoomId || !targetId) return;

        try {
            if (targetType === "confession") {
                const targetIdNum = Number(targetId);
                setReactingConfessionIds((prev) => new Set(prev).add(targetIdNum));
                const previousConfessions = [...confessions];
                const previousLikedConfessionIds = new Set(likedConfessionIds);

                // 1. Optimistic Update
                setConfessions((prev) => prev.map((row) => {
                    if (Number(row.confessionId) === targetIdNum) {
                        const currentlyLiked = likedConfessionIds.has(targetIdNum);
                        const nextLiked = !currentlyLiked;
                        return {
                            ...row,
                            reactionCount: Math.max(0, (row.reactionCount || 0) + (nextLiked ? 1 : -1)),
                            likesCount: Math.max(0, (row.likesCount || 0) + (nextLiked ? 1 : -1)),
                            likedByViewer: nextLiked
                        };
                    }
                    return row;
                }));

                setLikedConfessionIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(targetIdNum)) {
                        next.delete(targetIdNum);
                    } else {
                        next.add(targetIdNum);
                    }
                    return next;
                });

                try {
                    // 2. Call API
                    const result = await likeConfession(targetIdNum);
                    const likesCount = Number(result && result.likesCount);
                    const liked = !!(result && result.liked);

                    setConfessions((prev) => prev.map((row) => (
                        Number(row.confessionId) === targetIdNum
                            ? { ...row, reactionCount: likesCount, likesCount, likedByViewer: liked }
                            : row
                    )));

                    setLikedConfessionIds((prev) => {
                        const next = new Set(prev);
                        if (liked) next.add(targetIdNum);
                        else next.delete(targetIdNum);
                        return next;
                    });
                } catch (err) {
                    // 3. Rollback
                    setConfessions(previousConfessions);
                    setLikedConfessionIds(previousLikedConfessionIds);
                    showError(err && err.message ? err.message : "Unable to toggle like on confession.");
                } finally {
                    setReactingConfessionIds((prev) => {
                        const next = new Set(prev);
                        next.delete(targetIdNum);
                        return next;
                    });
                }
                return;
            }

            // Otherwise, targetType === "reply"
            const targetIdNum = Number(targetId);
            setReactingReplyIds((prev) => new Set(prev).add(targetIdNum));
            const previousReplies = { ...repliesByConfession };
            const previousLikedReplyIds = new Set(likedReplyIds);

            // 1. Optimistic Update
            const currentlyLiked = likedReplyIds.has(targetIdNum);
            const nextLiked = !currentlyLiked;

            setRepliesByConfession((prev) => {
                const next = {};
                for (const key of Object.keys(prev)) {
                    next[key] = asArray(prev[key]).map((reply) => (
                        Number(reply.replyId) === targetIdNum
                            ? {
                                ...reply,
                                reactionCount: Math.max(0, (reply.reactionCount || 0) + (nextLiked ? 1 : -1)),
                                likesCount: Math.max(0, (reply.likesCount || 0) + (nextLiked ? 1 : -1)),
                                likedByViewer: nextLiked
                            }
                            : reply
                    ));
                }
                return next;
            });

            setLikedReplyIds((prev) => {
                const next = new Set(prev);
                if (nextLiked) next.add(targetIdNum);
                else next.delete(targetIdNum);
                return next;
            });

            try {
                // 2. Call API
                const result = await likeReply(targetIdNum);
                const likesCount = Number(result && result.likesCount);
                const liked = !!(result && result.liked);

                // 3. Reconcile with server truth
                setRepliesByConfession((prev) => {
                    const next = {};
                    for (const key of Object.keys(prev)) {
                        next[key] = asArray(prev[key]).map((reply) => (
                            Number(reply.replyId) === targetIdNum
                                ? { ...reply, reactionCount: likesCount, likesCount, likedByViewer: liked }
                                : reply
                        ));
                    }
                    return next;
                });
                setLikedReplyIds((prev) => {
                    const next = new Set(prev);
                    if (liked) next.add(targetIdNum);
                    else next.delete(targetIdNum);
                    return next;
                });
            } catch (err) {
                // 4. Rollback on error
                setRepliesByConfession(previousReplies);
                setLikedReplyIds(previousLikedReplyIds);
                showError(err && err.message ? err.message : "Unable to toggle like on reply.");
            } finally {
                setReactingReplyIds((prev) => {
                    const next = new Set(prev);
                    next.delete(targetIdNum);
                    return next;
                });
            }
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to update this reaction right now.");
        }
    }, [activeRoomId, confessions, likedConfessionIds, likedReplyIds, repliesByConfession, showError]);

    const openChatRequest = useCallback((confession) => {
        const confessionId = Number(confession && confession.confessionId);
        const alias = String(confession && confession.alias ? confession.alias : "").trim();
        if (!confessionId || !alias) return;

        if (activeRoom && String(activeRoom.alias || "").trim() === alias) {
            showError("You cannot send a chat request to your own confession.");
            return;
        }

        if (sentChatRequestIds.has(confessionId)) {
            setChatRequestSuccess({ confessionId, alias });
            return;
        }

        dismissError();
        setChatRequestTarget({ confessionId, alias });
    }, [activeRoom, dismissError, sentChatRequestIds, showError]);

    const handleSendChatRequest = useCallback(async () => {
        if (!activeRoomId || !chatRequestTarget || !chatRequestTarget.confessionId) return;

        try {
            setSendingChatRequest(true);
            dismissError();
            const result = await sendConfessionChatRequest(activeRoomId, chatRequestTarget.confessionId);
            const confessionId = Number(chatRequestTarget.confessionId);
            const alias = String((result && result.targetAlias) || chatRequestTarget.alias || "").trim();
            const requestState = String((result && result.requestState) || "").trim();

            setSentChatRequestIds((prev) => new Set(prev).add(confessionId));
            setChatRequestTarget(null);

            if ((requestState === "already_connected" || requestState === "accepted") && Number(result && result.conversationId)) {
                setNotice(`You are already connected with ${alias}.`);
                navigate(`/chats?conversationId=${result.conversationId}`);
                return;
            }

            if (requestState === "already_pending") {
                setNotice(`Chat request already pending for ${alias}.`);
                return;
            }

            setChatRequestSuccess({ confessionId, alias });
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to send a chat request right now.");
        } finally {
            setSendingChatRequest(false);
        }
    }, [activeRoomId, chatRequestTarget, dismissError, navigate, setNotice, showError]);

    const handleConfirmPublish = useCallback(async (confessionId) => {
        if (!activeRoomId) return;
        try {
            const published = await confirmScheduledConfession(activeRoomId, confessionId);
            setScheduledConfessions((prev) => prev.filter((s) => s.confessionId !== confessionId));
            setPendingConfirmation(null);
            if (published && published.confessionId) {
                setConfessions((prev) => uniqueByNumericId([published, ...prev], (row) => row && row.confessionId).slice(0, 100));
            }
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to confirm the confession.");
        }
    }, [activeRoomId, showError]);

    const handleCancelScheduled = useCallback(async (confessionId) => {
        if (!activeRoomId) return;
        try {
            await cancelScheduledConfession(activeRoomId, confessionId);
            setScheduledConfessions((prev) => prev.filter((s) => s.confessionId !== confessionId));
            if (pendingConfirmation && pendingConfirmation.confessionId === confessionId) {
                setPendingConfirmation(null);
            }
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to cancel the scheduled confession.");
        }
    }, [activeRoomId, pendingConfirmation, showError]);

    const handleShuffleAlias = useCallback(async () => {
        if (!activeRoomId || !activeRoom) return;

        try {
            setShufflingAlias(true);
            dismissError();
            const result = await shuffleRoomAlias(activeRoomId);
            const newAlias = String(result && result.alias ? result.alias : "");
            if (!newAlias) return;

            setJoinedRooms((prev) => prev.map((room) =>
                Number(room.roomId) === activeRoomId ? { ...room, alias: newAlias } : room
            ));

            refreshRoomMembers(activeRoomId);
            setNotice(`Identity changed to ${newAlias}`);
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to shuffle your alias right now.");
        } finally {
            setShufflingAlias(false);
        }
    }, [activeRoom, activeRoomId, dismissError, refreshRoomMembers, setNotice, showError]);

    // Load scheduled confessions when entering a room
    useEffect(() => {
        if (!activeRoomId) { setScheduledConfessions([]); return; }
        getMyScheduledConfessions(activeRoomId)
            .then((res) => setScheduledConfessions(Array.isArray(res && res.scheduled) ? res.scheduled : []))
            .catch(() => setScheduledConfessions([]));
    }, [activeRoomId]);

    const handleShare = useCallback(async (type, item) => {
        const baseUrl = window.location.origin;
        const targetUrl = type === "confession"
            ? `${baseUrl}/confessions?roomId=${activeRoomId}&confessionId=${item.confessionId}`
            : `${baseUrl}/confessions?roomId=${item.roomId || activeRoomId}`;
        const shareTitle = type === "confession"
            ? "Anonymous confession"
            : (item && item.title) || "Confession room";

        try {
            if (navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    text: type === "confession" ? String(item.content || "").slice(0, 120) : String(item.description || ""),
                    url: targetUrl
                });
                return;
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(targetUrl);
                setNotice("Link copied to clipboard.");
                return;
            }
        } catch {
            return;
        }

        setNotice("Sharing is not available on this device.");
    }, [activeRoomId, setNotice]);

    return {
        joinedRooms,
        confessions,
        selectedReplies,
        activeRoomId,
        selectedConfessionId,
        activeRoom,
        selectedConfession,
        loadingRooms,
        loadingConfessions,
        loadingMoreConfessions,
        loadingReplies,
        loadingMoreReplies,
        notice,
        leavingRoomId,
        copiedRoomId,
        showComposer,
        likedConfessionIds,
        likedReplyIds,
        roomMembers,
        chatRequestTarget,
        sendingChatRequest,
        chatRequestSuccess,
        sentChatRequestIds,
        hasMoreConfessions,
        hasMoreReplies,
        postingConfession,
        postingReplyId,
        reactingConfessionIds,
        reactingReplyIds,
        shufflingAlias,
        repliesLoadMoreRef,
        confessionDraft,
        detailReplyDraft,
        setShowComposer,
        setConfessionDraft,
        setChatRequestTarget,
        setChatRequestSuccess,
        openRoomsView,
        openRoomView,
        openConfessionView,
        closeConfessionView,
        loadMoreConfessions,
        updateReplyDraft,
        handleCopyRoomCode,
        handleLeaveRoom,
        handlePostConfession,
        handlePostReply,
        handleReact,
        openChatRequest,
        handleSendChatRequest,
        handleShuffleAlias,
        scheduledConfessions,
        pendingConfirmation,
        selectedScheduledAt,
        setSelectedScheduledAt,
        handleConfirmPublish,
        handleCancelScheduled,
        handleShare
    };
}
