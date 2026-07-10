const ALIAS_TONES = ["violet", "iris", "indigo", "teal"];

export function getInitial(value, fallback = "A") {
    const text = String(value || "").replace(/^@/, "").trim();
    return text ? text.charAt(0).toUpperCase() : fallback;
}

export function getAliasTone(value, tones = ALIAS_TONES) {
    const text = String(value || "");
    let total = 0;

    for (let index = 0; index < text.length; index += 1) {
        total = (total + text.charCodeAt(index) * (index + 5)) % 7919;
    }

    return tones[total % tones.length];
}
