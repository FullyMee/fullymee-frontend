import { apiRequest } from "./api";

export function listConversations() {
    return apiRequest("/conversations", { method: "GET" });
}

export function listConversationMessages(conversationId, { limit } = {}) {
    const params = new URLSearchParams();
    if (Number.isFinite(Number(limit)) && Number(limit) > 0) {
        params.set("limit", String(Math.min(100, Math.floor(Number(limit)))));
    }
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiRequest(`/messages/${conversationId}${suffix}`, { method: "GET" });
}

export function listConversationUnreadCounts() {
    return apiRequest("/conversations/unread", { method: "GET" });
}

export function listUsers({ limit = 10, offset = 0, search = "", paginate = false } = {}) {
    const params = new URLSearchParams({
        limit: String(limit),
        offset: String(Math.max(0, Math.floor(Number(offset) || 0)))
    });
    if (String(search || "").trim()) {
        params.set("search", String(search).trim());
        params.set("q", String(search).trim());
    }
    if (paginate) {
        params.set("paginate", "1");
    }

    return apiRequest(`/users?${params.toString()}`, { method: "GET" });
}

export function createDirectConversation(targetUserId) {
    return apiRequest("/conversations/create-dm", {
        method: "POST",
        body: JSON.stringify({ targetUserId })
    });
}

export function sendUserChatRequest(targetUserId) {
    return apiRequest("/conversations/requests", {
        method: "POST",
        body: JSON.stringify({ targetUserId })
    });
}

export function listChatRequests() {
    return apiRequest("/conversations/requests", { method: "GET" });
}

export function respondToChatRequest(requestId, action) {
    return apiRequest(`/conversations/requests/${requestId}/respond`, {
        method: "POST",
        body: JSON.stringify({ action })
    });
}
