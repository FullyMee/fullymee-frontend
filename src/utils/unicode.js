/**
 * Production-level Unicode & Emoji handling utilities.
 * Ensures complex multi-byte Emojis (e.g. 🌌✨🧘‍♀️), surrogate pairs, ZWJ sequences,
 * and special characters are sliced and measured accurately without breaking
 * surrogate pairs into invalid replacement characters (???) or ().
 */

/**
 * Safely slices a string by user-perceived characters (grapheme clusters / code points).
 * @param {string} str - Input string
 * @param {number} maxChars - Maximum visible character count
 * @returns {string} - Cleanly sliced string
 */
export function safeUnicodeSlice(str, maxChars) {
    if (!str) return "";
    const num = Number(maxChars);
    if (!num || num <= 0) return String(str);

    try {
        if (typeof Intl !== "undefined" && Intl.Segmenter) {
            const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
            const segments = Array.from(segmenter.segment(String(str)), (s) => s.segment);
            if (segments.length <= num) return String(str);
            return segments.slice(0, num).join("");
        }
    } catch (e) {
        // Fallback to code point array
    }

    const codePoints = Array.from(String(str));
    if (codePoints.length <= num) return String(str);
    return codePoints.slice(0, num).join("");
}

/**
 * Returns the visible character count (grapheme clusters) of a string.
 * @param {string} str - Input string
 * @returns {number} - Count of visible characters / emojis
 */
export function getUnicodeLength(str) {
    if (!str) return 0;
    try {
        if (typeof Intl !== "undefined" && Intl.Segmenter) {
            const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
            return Array.from(segmenter.segment(String(str))).length;
        }
    } catch (e) {
        // Fallback to code point array length
    }
    return Array.from(String(str)).length;
}
