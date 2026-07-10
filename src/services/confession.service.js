import { apiRequest } from "./api";
import { getSocket } from "./socket";

export function getRecommendedRooms({ limit = 3, roomType = "public" } = {}) {
    const params = new URLSearchParams({ limit: String(limit), roomType });
    return apiRequest(`/confessions/rooms/recommendations?${params.toString()}`, {
        method: "GET"
    });
}

export function getPublicRooms({ limit = 100, offset = 0, sortBy = "discover", search = "", paginate = false } = {}) {
    const params = new URLSearchParams({
        limit: String(limit),
        sortBy,
        offset: String(Math.max(0, Math.floor(Number(offset) || 0)))
    });
    if (String(search || "").trim()) {
        params.set("search", String(search).trim());
    }
    if (paginate) {
        params.set("paginate", "1");
    }

    return apiRequest(`/confessions/rooms/public?${params.toString()}`, {
        method: "GET"
    });
}

export function getJoinedRooms() {
    return apiRequest("/confessions/rooms/my", { method: "GET" });
}

export function getRoomMembers(roomId) {
    return apiRequest(`/confessions/rooms/${roomId}/members`, { method: "GET" });
}

export function getMyConfessions({ limit = 50 } = {}) {
    const params = new URLSearchParams({ limit: String(limit) });
    return apiRequest(`/confessions/posts/my?${params.toString()}`, { method: "GET" });
}

export function joinConfessionRoom(payload) {
    return apiRequest("/confessions/rooms/join", {
        method: "POST",
        body: JSON.stringify(payload || {})
    });
}

export function createConfessionRoom(payload) {
    return apiRequest("/confessions/rooms", {
        method: "POST",
        body: JSON.stringify(payload || {})
    });
}

export function joinConfessionRoomByCode(code, joinSource = "room_code") {
    return apiRequest("/confessions/rooms/join-by-code", {
        method: "POST",
        body: JSON.stringify({
            code,
            joinSource
        })
    });
}

export function leaveConfessionRoom(roomId) {
    return apiRequest(`/confessions/rooms/${roomId}/leave`, {
        method: "POST"
    });
}

export function listConfessions(roomId, { limit = 50, sortBy = "ranked" } = {}) {
    const params = new URLSearchParams({ limit: String(limit), sortBy });
    return apiRequest(`/confessions/rooms/${roomId}/confessions?${params.toString()}`, {
        method: "GET"
    });
}

export function postConfession(roomId, content, scheduledAt = null) {
    const body = { content };
    if (scheduledAt) body.scheduledAt = new Date(scheduledAt).toISOString();
    return apiRequest(`/confessions/rooms/${roomId}/confessions`, {
        method: "POST",
        body: JSON.stringify(body)
    });
}

export function listReplies(roomId, confessionId, { limit = 50 } = {}) {
    const params = new URLSearchParams({ limit: String(limit) });
    return apiRequest(
        `/confessions/rooms/${roomId}/confessions/${confessionId}/replies?${params.toString()}`,
        { method: "GET" }
    );
}

export function postReply(roomId, confessionId, content) {
    return apiRequest(`/confessions/rooms/${roomId}/confessions/${confessionId}/replies`, {
        method: "POST",
        body: JSON.stringify({ content })
    });
}

export function sendConfessionChatRequest(roomId, confessionId) {
    return apiRequest(`/confessions/rooms/${roomId}/confessions/${confessionId}/chat-request`, {
        method: "POST"
    });
}

export function reactToConfessionTarget(roomId, targetType, targetId, reactionType) {
    return apiRequest(`/confessions/rooms/${roomId}/reactions`, {
        method: "POST",
        body: JSON.stringify({ targetType, targetId, reactionType })
    });
}

export function reportConfessionTarget(roomId, targetType, targetId, reason) {
    return apiRequest(`/confessions/rooms/${roomId}/reports`, {
        method: "POST",
        body: JSON.stringify({ targetType, targetId, reason })
    });
}

export function subscribeConfessionRoom(roomId) {
    const socket = getSocket();
    if (!socket) return Promise.resolve({ ok: false, error: "Socket unavailable" });

    return new Promise((resolve) => {
        socket.emit("confession_subscribe", { roomId }, (ack) => resolve(ack || { ok: false }));
    });
}

export function unsubscribeConfessionRoom(roomId) {
    const socket = getSocket();
    if (!socket) return Promise.resolve({ ok: false, error: "Socket unavailable" });

    return new Promise((resolve) => {
        socket.emit("confession_unsubscribe", { roomId }, (ack) => resolve(ack || { ok: false }));
    });
}

export function sendConfessionPresencePing(roomId) {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("confession_presence_ping", { roomId });
}

export function getModerationQueue({
    status = "pending",
    severity = "all",
    targetType = "all",
    limit = 50
} = {}) {
    const params = new URLSearchParams({
        status,
        severity,
        targetType,
        limit: String(limit)
    });

    return apiRequest(`/confessions/moderation/queue?${params.toString()}`, {
        method: "GET"
    });
}

export function resolveModerationQueueItem(queueId, { action, reason } = {}) {
    const payload = { action };
    const trimmedReason = String(reason || "").trim();
    if (trimmedReason.length >= 3) {
        payload.reason = trimmedReason;
    }

    return apiRequest(`/confessions/moderation/queue/${queueId}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
    });
}

export function likeConfession(confessionId) {
    return apiRequest(`/confessions/${confessionId}/like`, {
        method: "POST"
    });
}

export function likeReply(replyId) {
    return apiRequest(`/confessions/replies/${replyId}/like`, {
        method: "POST"
    });
}

export function getConfessionsFeed({ limit = 20, offset = 0, useAggregation = false } = {}) {
    const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        useAggregation: useAggregation ? "true" : "false"
    });
    return apiRequest(`/confessions?${params.toString()}`, {
        method: "GET"
    });
}

export function createConfession(content) {
    return apiRequest("/confessions", {
        method: "POST",
        body: JSON.stringify({ content })
    });
}

export function shuffleRoomAlias(roomId) {
    return apiRequest(`/confessions/rooms/${roomId}/shuffle`, {
        method: "POST"
    });
}

export function getMyScheduledConfessions(roomId) {
    return apiRequest(`/confessions/rooms/${roomId}/scheduled`);
}

export function confirmScheduledConfession(roomId, confessionId) {
    return apiRequest(`/confessions/rooms/${roomId}/scheduled/${confessionId}/confirm`, {
        method: "POST"
    });
}

export function cancelScheduledConfession(roomId, confessionId) {
    return apiRequest(`/confessions/rooms/${roomId}/scheduled/${confessionId}`, {
        method: "DELETE"
    });
}

