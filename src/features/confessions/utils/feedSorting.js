export function uniqueByRoomId(rooms) {
    const seen = new Set();
    const next = [];
    for (const room of Array.isArray(rooms) ? rooms : []) {
        const roomId = Number(room && room.roomId);
        if (!roomId || seen.has(roomId)) continue;
        seen.add(roomId);
        next.push(room);
    }
    return next;
}

export function getHomeFilterLabel(key) {
    const value = String(key || "").toLowerCase();
    if (value === "daily") return "Late Night";
    if (value === "advice") return "Heartbreak";
    if (value === "chill") return "Anxiety";
    if (value === "general") return "Random";
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function matchesHomeSearch(room, term) {
    const value = String(term || "").trim().toLowerCase();
    if (!value) return true;

    const haystack = `${room && room.title ? room.title : ""} ${room && room.description ? room.description : ""} ${room && room.category ? room.category : ""} ${room && room.roomType ? room.roomType : ""}`.toLowerCase();
    return haystack.includes(value);
}

export function matchesHomeConfessionSearch(card, term) {
    const value = String(term || "").trim().toLowerCase();
    if (!value) return true;

    const haystack = `${card && card.alias ? card.alias : ""} ${card && card.roomTitle ? card.roomTitle : ""} ${card && card.roomDescription ? card.roomDescription : ""} ${card && card.content ? card.content : ""}`.toLowerCase();
    return haystack.includes(value);
}

export function formatRoomAccess(room) {
    return room && room.roomType === "private" ? "Private" : "Public";
}

export function formatCompactPulseCount(value) {
    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(Number(value) || 0);
}

export function getLatestConfessionScore(item) {
    const createdAtMs = new Date((item && item.createdAt) || 0).getTime();
    const ageMinutes = Math.max(1, (Date.now() - createdAtMs) / (1000 * 60));
    const reactionCount = Number(item && item.reactionCount) || 0;
    const replyCount = Number(item && item.replyCount) || 0;
    const freshnessScore = 12 / Math.pow(ageMinutes + 12, 1.15);
    const engagementScore = Math.log1p(reactionCount * 2 + replyCount * 3) * 2.4;
    return freshnessScore + engagementScore;
}
