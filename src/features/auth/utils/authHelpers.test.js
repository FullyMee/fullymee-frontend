import { describe, it, expect } from "vitest";
import {
    normalizeEmail,
    normalizeUsername,
    buildUsernameCandidate,
    USERNAME_REGEX,
    EMAIL_REGEX,
    USERNAME_ADJECTIVES,
    USERNAME_NOUNS
} from "./authHelpers.js";

describe("authHelpers utilities", () => {
    describe("normalizeEmail", () => {
        it("lowercases and trims whitespace", () => {
            expect(normalizeEmail("  Hello@Example.COM  ")).toBe("hello@example.com");
        });

        it("handles null, undefined, and empty string safely", () => {
            expect(normalizeEmail(null)).toBe("");
            expect(normalizeEmail(undefined)).toBe("");
            expect(normalizeEmail("")).toBe("");
        });
    });

    describe("normalizeUsername", () => {
        it("lowercases and trims whitespace", () => {
            expect(normalizeUsername("  SilentSoul_42  ")).toBe("silentsoul_42");
        });

        it("handles null, undefined, and empty string safely", () => {
            expect(normalizeUsername(null)).toBe("");
            expect(normalizeUsername(undefined)).toBe("");
            expect(normalizeUsername("")).toBe("");
        });
    });

    describe("USERNAME_REGEX", () => {
        it("accepts valid usernames between 3 and 20 characters", () => {
            expect(USERNAME_REGEX.test("gentletiger")).toBe(true);
            expect(USERNAME_REGEX.test("user_123")).toBe(true);
            expect(USERNAME_REGEX.test("wanderer.echo")).toBe(true);
            expect(USERNAME_REGEX.test("abc")).toBe(true);
        });

        it("rejects usernames that are too short or too long", () => {
            expect(USERNAME_REGEX.test("ab")).toBe(false);
            expect(USERNAME_REGEX.test("a".repeat(21))).toBe(false);
        });

        it("rejects usernames with uppercase or forbidden characters", () => {
            expect(USERNAME_REGEX.test("GentleTiger")).toBe(false);
            expect(USERNAME_REGEX.test("user@name")).toBe(false);
            expect(USERNAME_REGEX.test("user name")).toBe(false);
            expect(USERNAME_REGEX.test("user!#$")).toBe(false);
        });
    });

    describe("EMAIL_REGEX", () => {
        it("validates standard email formats", () => {
            expect(EMAIL_REGEX.test("test@example.com")).toBe(true);
            expect(EMAIL_REGEX.test("user.name+tag@domain.co.in")).toBe(true);
        });

        it("rejects malformed email strings", () => {
            expect(EMAIL_REGEX.test("notanemail")).toBe(false);
            expect(EMAIL_REGEX.test("@missinguser.com")).toBe(false);
            expect(EMAIL_REGEX.test("user@missingtld")).toBe(false);
            expect(EMAIL_REGEX.test("user name@domain.com")).toBe(false);
        });
    });

    describe("buildUsernameCandidate", () => {
        it("generates a candidate matching USERNAME_REGEX within 20 chars", () => {
            for (let i = 0; i < 20; i++) {
                const candidate = buildUsernameCandidate();
                expect(candidate.length).toBeGreaterThanOrEqual(3);
                expect(candidate.length).toBeLessThanOrEqual(20);
                expect(USERNAME_REGEX.test(candidate)).toBe(true);
            }
        });

        it("uses approved adjective and noun lists", () => {
            const candidate = buildUsernameCandidate();
            const startsWithAdjective = USERNAME_ADJECTIVES.some((adj) => candidate.startsWith(adj));
            expect(startsWithAdjective).toBe(true);

            const containsNoun = USERNAME_NOUNS.some((noun) => candidate.includes(noun));
            expect(containsNoun).toBe(true);
        });
    });
});
