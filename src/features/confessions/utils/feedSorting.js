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

    const title = String(room?.title || "").toLowerCase();
    const desc = String(room?.description || "").toLowerCase();
    const category = String(room?.category || "").toLowerCase();
    const cleanQuery = value.replace(/[\s_\-]+/g, "");
    const cleanCategory = category.replace(/[\s_\-]+/g, "");
    const categorySpaced = category.replace(/_/g, " ");

    return (
        title.includes(value) ||
        desc.includes(value) ||
        category.includes(value) ||
        categorySpaced.includes(value) ||
        cleanCategory.includes(cleanQuery)
    );
}

export function matchesCategoryFilter(item, filterKey) {
    if (!filterKey || filterKey === "all") return true;
    const key = String(filterKey).trim().toLowerCase();

    const category = String(item?.category || item?.roomCategory || "").trim().toLowerCase();
    const title = String(item?.title || item?.roomTitle || "").trim().toLowerCase();
    const desc = String(item?.description || item?.roomDescription || "").trim().toLowerCase();
    const content = String(item?.content || "").trim().toLowerCase();
    const tone = String(item?.tone || "").trim().toLowerCase();

    if (category && (category === key || category.includes(key) || key.includes(category))) {
        return true;
    }

    const toneLabel = getHomeFilterLabel(tone).toLowerCase();
    if (toneLabel === key || toneLabel.includes(key)) {
        return true;
    }

    return title.includes(key) || desc.includes(key) || content.includes(key);
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
