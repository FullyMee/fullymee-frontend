import { describe, it, expect } from "vitest";
import {
    AVATAR_OPTIONS,
    getAvatarById,
    getDeterministicAvatarId
} from "./avatars.js";

describe("avatars constants", () => {
    it("exports exactly 7 curated avatar options with required properties", () => {
        expect(AVATAR_OPTIONS).toHaveLength(7);
        const expectedIds = [
            "flowing_waterfall",
            "cracked_mirror",
            "empty_swing",
            "locked_diary",
            "torn_photograph",
            "silent_forest",
            "broken_constellation"
        ];
        expect(AVATAR_OPTIONS.map(a => a.id)).toEqual(expectedIds);

        AVATAR_OPTIONS.forEach((opt) => {
            expect(opt.id).toBeTruthy();
            expect(opt.name).toBeTruthy();
            expect(opt.quote).toBeTruthy();
            expect(opt.description).toBeTruthy();
            expect(opt.image).toBeTruthy();
        });
    });

    it("getAvatarById returns correct image for valid IDs", () => {
        AVATAR_OPTIONS.forEach((opt) => {
            expect(getAvatarById(opt.id)).toBe(opt.image);
        });
    });

    it("getAvatarById preserves direct image URLs and paths", () => {
        expect(getAvatarById("https://example.com/pic.png")).toBe("https://example.com/pic.png");
        expect(getAvatarById("data:image/png;base64,123")).toBe("data:image/png;base64,123");
        expect(getAvatarById("/assets/custom.png")).toBe("/assets/custom.png");
    });

    it("getAvatarById falls back to flowing_waterfall for null or unknown IDs", () => {
        const defaultImage = AVATAR_OPTIONS[0].image;
        expect(getAvatarById(null)).toBe(defaultImage);
        expect(getAvatarById(undefined)).toBe(defaultImage);
        expect(getAvatarById("non_existent_avatar")).toBe(defaultImage);
    });

    it("getDeterministicAvatarId deterministically maps seeds to valid avatar IDs", () => {
        const validIds = new Set(AVATAR_OPTIONS.map(a => a.id));

        const id1 = getDeterministicAvatarId("silentsparrow85");
        const id2 = getDeterministicAvatarId("silentsparrow85");
        expect(id1).toBe(id2);
        expect(validIds.has(id1)).toBe(true);

        const id3 = getDeterministicAvatarId("clever.hawk4959");
        expect(validIds.has(id3)).toBe(true);

        expect(getDeterministicAvatarId("")).toBe("flowing_waterfall");
        expect(getDeterministicAvatarId(null)).toBe("flowing_waterfall");
        expect(getDeterministicAvatarId(undefined)).toBe("flowing_waterfall");
        expect(validIds.has(getDeterministicAvatarId(12345))).toBe(true);
    });
});
