export const USERNAME_REGEX = /^[a-z0-9._]{3,20}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const USERNAME_ADJECTIVES = [
    "gentle",
    "bright",
    "calm",
    "kind",
    "silent",
    "steady",
    "open",
    "brave",
    "honest",
    "soft",
    "clear",
    "mellow"
];

export const USERNAME_NOUNS = [
    "tiger",
    "river",
    "ember",
    "harbor",
    "meadow",
    "echo",
    "lantern",
    "summit",
    "willow",
    "comet",
    "sparrow",
    "horizon"
];

export function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
}

export function normalizeUsername(value) {
    return String(value || "").trim().toLowerCase();
}

export function buildUsernameCandidate() {
    const adjective = USERNAME_ADJECTIVES[Math.floor(Math.random() * USERNAME_ADJECTIVES.length)];
    const noun = USERNAME_NOUNS[Math.floor(Math.random() * USERNAME_NOUNS.length)];
    const number = Math.floor(10 + Math.random() * 90);
    return `${adjective}${noun}${number}`.slice(0, 20);
}
