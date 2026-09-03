export function normalizeDisplayNames(value) {
    if (!value || typeof value !== "object") return {};
    if (value instanceof Map) {
        return Object.fromEntries(value.entries());
    }
    return value;
}

export function dedupeMessages(items) {
    const seenIds = new Set();
    const seenClientIds = new Set();
    const next = [];

    for (const item of Array.isArray(items) ? items : []) {
        const id = Number(item && item.id);
        const clientMessageId = String(item && item.clientMessageId ? item.clientMessageId : "").trim();

        if (id && !Number.isNaN(id)) {
            if (seenIds.has(id)) continue;
            seenIds.add(id);
            if (clientMessageId) seenClientIds.add(clientMessageId);
            next.push(item);
            continue;
        }

        if (clientMessageId) {
            if (seenClientIds.has(clientMessageId)) continue;
            seenClientIds.add(clientMessageId);
            next.push(item);
        }
    }

    return next.sort((a, b) => {
        const aSeq = Number(a && a.seq);
        const bSeq = Number(b && b.seq);
        if (aSeq && bSeq) return aSeq - bSeq;

        const aId = Number(a && a.id);
        const bId = Number(b && b.id);
        if (aId && bId) return aId - bId;

        const aTime = new Date((a && a.createdAt) || 0).getTime();
        const bTime = new Date((b && b.createdAt) || 0).getTime();
        return aTime - bTime;
    });
}

export function buildOptimisticMessage({ clientMessageId, conversationId, content, senderId }) {
    return {
        id: `temp-${clientMessageId}`,
        clientMessageId,
        conversationId,
        senderId,
        content,
        status: "sending",
        createdAt: new Date().toISOString()
    };
}

export function replaceOptimisticMessage(items, incomingMessage) {
    const clientMessageId = String(incomingMessage && incomingMessage.clientMessageId ? incomingMessage.clientMessageId : "").trim();
    if (!clientMessageId) {
        return dedupeMessages([...(Array.isArray(items) ? items : []), incomingMessage]);
    }

    const withoutOptimistic = (Array.isArray(items) ? items : []).filter((item) => {
        const itemClientId = String(item && item.clientMessageId ? item.clientMessageId : "").trim();
        const itemId = Number(item && item.id);
        if (!itemClientId || itemClientId !== clientMessageId) return true;
        return itemId && !Number.isNaN(itemId);
    });

    return dedupeMessages([...withoutOptimistic, incomingMessage]);
}

export function createClientMessageId() {
    const secureCrypto = typeof globalThis !== "undefined" ? globalThis.crypto : null;
    if (secureCrypto && typeof secureCrypto.randomUUID === "function") {
        return secureCrypto.randomUUID();
    }

    return `msg-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}
