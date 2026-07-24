const AVATAR_TONES = ["indigo", "ocean", "violet", "teal", "royal"];

export function getHashValue(value) {
    const source = String(value || "");
    let total = 0;
    for (let index = 0; index < source.length; index += 1) {
        total = (total + source.charCodeAt(index) * (index + 1)) % 9973;
    }
    return total;
}

export function getAvatarTone(value) {
    return AVATAR_TONES[getHashValue(value) % AVATAR_TONES.length];
}

export function formatListTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function formatMessageTime(value) {
    if (!value) return "now";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "now";
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit"
    }).format(date);
}

export function formatDesktopDateLabel(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function truncateText(value, limit = 46) {
    const text = String(value || "").trim();
    if (!text) return "Start a private conversation";
    if (text.length <= limit) return text;
    return `${text.slice(0, limit - 1).trim()}...`;
}

export function formatRequestSummary(count) {
    if (count <= 0) return "View chat requests";
    return `${count} pending request${count === 1 ? "" : "s"}`;
}

export function getRequestSubtitle(request) {
    const contextType = String(request && request.contextType ? request.contextType : "confession");
    if (contextType === "profile") return "Wants to connect with you";
    if (contextType === "reply") return "Wants to connect based on their reply";
    return "Wants to connect based on their post";
}

export function getRequestInfoLine(request) {
    const contextType = String(request && request.contextType ? request.contextType : "confession");
    if (contextType === "profile") return "Accept this request to start a private conversation";
    return "You can now chat with this user";
}
