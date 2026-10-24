import { describe, it, expect } from "vitest";
import {
    uniqueByRoomId,
    matchesHomeSearch,
    matchesCategoryFilter,
    formatRoomAccess,
    formatCompactPulseCount,
    getHomeFilterLabel
} from "./feedSorting.js";

describe("feedSorting utilities", () => {
    describe("uniqueByRoomId", () => {
        it("deduplicates rooms by roomId keeping first occurrence", () => {
            const rooms = [
                { roomId: 1, title: "Room 1" },
                { roomId: 2, title: "Room 2" },
                { roomId: 1, title: "Duplicate Room 1" },
                { roomId: 3, title: "Room 3" }
            ];
            const result = uniqueByRoomId(rooms);
            expect(result).toHaveLength(3);
            expect(result.map(r => r.roomId)).toEqual([1, 2, 3]);
            expect(result[0].title).toBe("Room 1");
        });

        it("filters out items without valid roomId", () => {
            const rooms = [
                { roomId: 0, title: "Invalid 0" },
                { roomId: null, title: "Invalid null" },
                { roomId: 5, title: "Valid 5" }
            ];
            const result = uniqueByRoomId(rooms);
            expect(result).toHaveLength(1);
            expect(result[0].roomId).toBe(5);
        });

        it("handles empty or non-array inputs safely", () => {
            expect(uniqueByRoomId([])).toEqual([]);
            expect(uniqueByRoomId(null)).toEqual([]);
            expect(uniqueByRoomId(undefined)).toEqual([]);
        });
    });

    describe("matchesHomeSearch", () => {
        const sampleRoom = {
            roomId: 10,
            title: "Midnight Thoughts",
            description: "A safe space for night owls",
            category: "late_night"
        };

        it("returns true for empty or whitespace-only search term", () => {
            expect(matchesHomeSearch(sampleRoom, "")).toBe(true);
            expect(matchesHomeSearch(sampleRoom, "   ")).toBe(true);
            expect(matchesHomeSearch(sampleRoom, null)).toBe(true);
        });

        it("matches title case-insensitively", () => {
            expect(matchesHomeSearch(sampleRoom, "midnight")).toBe(true);
            expect(matchesHomeSearch(sampleRoom, "THOUGHTS")).toBe(true);
            expect(matchesHomeSearch(sampleRoom, "morning")).toBe(false);
        });

        it("matches description", () => {
            expect(matchesHomeSearch(sampleRoom, "night owls")).toBe(true);
            expect(matchesHomeSearch(sampleRoom, "SAFE SPACE")).toBe(true);
        });

        it("matches category with or without spaces/underscores", () => {
            expect(matchesHomeSearch(sampleRoom, "late night")).toBe(true);
            expect(matchesHomeSearch(sampleRoom, "late_night")).toBe(true);
            expect(matchesHomeSearch(sampleRoom, "latenight")).toBe(true);
        });
    });

    describe("matchesCategoryFilter", () => {
        const item = {
            roomId: 1,
            category: "heartbreak",
            title: "Moving On",
            content: "Healing takes time."
        };

        it("returns true for 'all' or empty filter", () => {
            expect(matchesCategoryFilter(item, "all")).toBe(true);
            expect(matchesCategoryFilter(item, "")).toBe(true);
            expect(matchesCategoryFilter(item, null)).toBe(true);
        });

        it("matches exact or substring category", () => {
            expect(matchesCategoryFilter(item, "heartbreak")).toBe(true);
            expect(matchesCategoryFilter(item, "career")).toBe(false);
        });

        it("falls back to matching title or content keywords", () => {
            expect(matchesCategoryFilter(item, "healing")).toBe(true);
            expect(matchesCategoryFilter(item, "moving")).toBe(true);
        });
    });

    describe("formatCompactPulseCount", () => {
        it("formats zero and falsy inputs as '0'", () => {
            expect(formatCompactPulseCount(0)).toBe("0");
            expect(formatCompactPulseCount(null)).toBe("0");
            expect(formatCompactPulseCount("")).toBe("0");
        });

        it("formats standard numbers below 1000 verbatim", () => {
            expect(formatCompactPulseCount(42)).toBe("42");
            expect(formatCompactPulseCount(850)).toBe("850");
        });

        it("formats thousands in compact K notation", () => {
            expect(formatCompactPulseCount(1500)).toBe("1.5K");
            expect(formatCompactPulseCount(10000)).toBe("10K");
        });

        it("formats millions in compact M notation", () => {
            expect(formatCompactPulseCount(2500000)).toBe("2.5M");
        });
    });

    describe("formatRoomAccess", () => {
        it("returns 'Private' for private roomType", () => {
            expect(formatRoomAccess({ roomType: "private" })).toBe("Private");
        });

        it("returns 'Public' for public roomType or undefined", () => {
            expect(formatRoomAccess({ roomType: "public" })).toBe("Public");
            expect(formatRoomAccess({})).toBe("Public");
            expect(formatRoomAccess(null)).toBe("Public");
        });
    });

    describe("getHomeFilterLabel", () => {
        it("maps legacy aliases to modern display labels", () => {
            expect(getHomeFilterLabel("daily")).toBe("Late Night");
            expect(getHomeFilterLabel("advice")).toBe("Heartbreak");
            expect(getHomeFilterLabel("chill")).toBe("Anxiety");
            expect(getHomeFilterLabel("general")).toBe("Random");
        });

        it("capitalizes custom filter names", () => {
            expect(getHomeFilterLabel("career")).toBe("Career");
            expect(getHomeFilterLabel("family")).toBe("Family");
        });
    });
});
