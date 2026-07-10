export function formatRelativeTime(value, {
    short = false,
    nowLabel = "just now",
    invalidLabel = nowLabel
} = {}) {
    if (!value) return invalidLabel;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return invalidLabel;

    const diffMs = Date.now() - date.getTime();
    if (!Number.isFinite(diffMs) || diffMs <= 0) return nowLabel;

    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMinutes < 60) return short ? `${diffMinutes}m` : `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return short ? `${diffHours}h` : `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return short ? `${diffDays}d` : `${diffDays}d ago`;

    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}
