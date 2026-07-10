import { getRoomBadgeLabel } from "../../../components/common/MobileRoomVisuals.jsx";

export function asArray(value) {
    return Array.isArray(value) ? value : [];
}

export function uniqueByNumericId(items, getId) {
    const seen = new Set();
    const next = [];

    for (const item of asArray(items)) {
        const id = Number(getId(item));
        if (!id || Number.isNaN(id) || seen.has(id)) continue;
        seen.add(id);
        next.push(item);
    }

    return next;
}

export function getRoomHeroBadge(room) {
    if (room && room.roomType === "private") return "private room";

    const badge = getRoomBadgeLabel(room);
    if (badge === "room") return "public room";
    return `${badge} room`;
}

export function getConfessionParts(content) {
    const text = String(content || "").trim();
    if (!text) {
        return { title: "Untitled confession", body: "" };
    }

    const questionMarkIndex = text.indexOf("?");
    if (questionMarkIndex >= 18 && questionMarkIndex <= 120) {
        return {
            title: text.slice(0, questionMarkIndex + 1).trim(),
            body: text.slice(questionMarkIndex + 1).trim()
        };
    }

    const sentenceSplit = text.match(/^(.{24,90}?[.!])\s+([\s\S]+)$/);
    if (sentenceSplit) {
        return {
            title: sentenceSplit[1].trim(),
            body: sentenceSplit[2].trim()
        };
    }

    return { title: text, body: "" };
}
