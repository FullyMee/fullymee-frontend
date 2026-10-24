import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatRelativeTime, formatJoinedDate } from "./time.js";

describe("time utilities", () => {
    describe("formatJoinedDate", () => {
        it("returns 'Recently' when input is null, undefined, or empty", () => {
            expect(formatJoinedDate(null)).toBe("Recently");
            expect(formatJoinedDate(undefined)).toBe("Recently");
            expect(formatJoinedDate("")).toBe("Recently");
        });

        it("returns 'Recently' when input is an invalid date string", () => {
            expect(formatJoinedDate("not-a-date")).toBe("Recently");
            expect(formatJoinedDate(NaN)).toBe("Recently");
        });

        it("formats valid date string correctly to 'Month Year'", () => {
            const formatted = formatJoinedDate("2024-05-15T12:00:00.000Z");
            expect(formatted).toBe("May 2024");
        });

        it("formats timestamp numbers correctly", () => {
            const timestamp = new Date("2023-01-10T00:00:00Z").getTime();
            expect(formatJoinedDate(timestamp)).toBe("Jan 2023");
        });
    });

    describe("formatRelativeTime", () => {
        const NOW = 1700000000000; // Fixed timestamp for deterministic testing

        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(NOW);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("returns nowLabel for null, undefined, or empty", () => {
            expect(formatRelativeTime(null)).toBe("just now");
            expect(formatRelativeTime(undefined)).toBe("just now");
            expect(formatRelativeTime("")).toBe("just now");
        });

        it("returns custom invalidLabel when invalid input is provided", () => {
            expect(formatRelativeTime("invalid", { invalidLabel: "Unknown" })).toBe("Unknown");
        });

        it("returns nowLabel for future or immediate dates", () => {
            expect(formatRelativeTime(NOW + 5000)).toBe("just now");
            expect(formatRelativeTime(NOW, { nowLabel: "right now" })).toBe("right now");
        });

        it("formats minutes ago correctly", () => {
            const fiveMinutesAgo = NOW - 5 * 60 * 1000;
            expect(formatRelativeTime(fiveMinutesAgo)).toBe("5m ago");
            expect(formatRelativeTime(fiveMinutesAgo, { short: true })).toBe("5m");
        });

        it("formats hours ago correctly", () => {
            const twoHoursAgo = NOW - 2 * 60 * 60 * 1000;
            expect(formatRelativeTime(twoHoursAgo)).toBe("2h ago");
            expect(formatRelativeTime(twoHoursAgo, { short: true })).toBe("2h");
        });

        it("formats days ago correctly (< 7 days)", () => {
            const threeDaysAgo = NOW - 3 * 24 * 60 * 60 * 1000;
            expect(formatRelativeTime(threeDaysAgo)).toBe("3d ago");
            expect(formatRelativeTime(threeDaysAgo, { short: true })).toBe("3d");
        });

        it("formats as Month Day when older than 7 days", () => {
            const tenDaysAgo = NOW - 10 * 24 * 60 * 60 * 1000;
            const result = formatRelativeTime(tenDaysAgo);
            // Result is formatted with Intl.DateTimeFormat "en-US" month & day
            expect(result).toMatch(/^[A-Z][a-z]{2}\s\d{1,2}$/);
        });
    });
});
