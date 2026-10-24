import { describe, it, expect } from "vitest";
import { getInitial, getAliasTone } from "./presentation.js";

describe("presentation utilities", () => {
    describe("getInitial", () => {
        it("extracts the first letter and capitalizes it", () => {
            expect(getInitial("wanderer")).toBe("W");
            expect(getInitial("SilentSoul")).toBe("S");
        });

        it("strips leading '@' character", () => {
            expect(getInitial("@alex")).toBe("A");
            expect(getInitial("@Sam")).toBe("S");
        });

        it("handles whitespace before the name", () => {
            expect(getInitial("   charlie   ")).toBe("C");
        });

        it("returns default fallback 'A' when input is falsy or blank", () => {
            expect(getInitial("")).toBe("A");
            expect(getInitial(null)).toBe("A");
            expect(getInitial(undefined)).toBe("A");
            expect(getInitial("   ")).toBe("A");
        });

        it("returns custom fallback when specified", () => {
            expect(getInitial("", "U")).toBe("U");
            expect(getInitial(null, "?")).toBe("?");
        });
    });

    describe("getAliasTone", () => {
        const DEFAULT_TONES = ["violet", "iris", "indigo", "teal"];

        it("returns one of the default tones", () => {
            const tone = getAliasTone("MysticShadow");
            expect(DEFAULT_TONES).toContain(tone);
        });

        it("is deterministic for identical values", () => {
            const tone1 = getAliasTone("EchoSeeker");
            const tone2 = getAliasTone("EchoSeeker");
            expect(tone1).toBe(tone2);
        });

        it("handles falsy and empty inputs safely", () => {
            expect(DEFAULT_TONES).toContain(getAliasTone(""));
            expect(DEFAULT_TONES).toContain(getAliasTone(null));
            expect(DEFAULT_TONES).toContain(getAliasTone(undefined));
        });

        it("uses custom tones array if provided", () => {
            const customTones = ["red", "blue", "green"];
            const tone = getAliasTone("TestUser", customTones);
            expect(customTones).toContain(tone);
        });
    });
});
