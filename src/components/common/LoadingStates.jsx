function range(count) {
    return Array.from({ length: count }, (_, index) => index);
}

export function InlineSpinner({ size = "md", tone = "light", label = "Loading" }) {
    return (
        <span className={`inline-spinner inline-spinner--${size} inline-spinner--${tone}`} role="status" aria-live="polite" aria-label={label}>
            <span className="inline-spinner__dot" aria-hidden="true" />
            <span className="inline-spinner__dot" aria-hidden="true" />
            <span className="inline-spinner__dot" aria-hidden="true" />
        </span>
    );
}

export function FeedSkeletonList({ count = 3 }) {
    return (
        <div className="skeleton-list skeleton-list--feed" aria-hidden="true">
            {range(count).map((item) => (
                <article key={item} className="skeleton-card skeleton-card--feed">
                    <div className="skeleton-row skeleton-row--author">
                        <span className="skeleton-avatar" />
                        <div className="skeleton-copy">
                            <span className="skeleton-line skeleton-line--title" />
                            <span className="skeleton-line skeleton-line--meta" />
                        </div>
                    </div>
                    <span className="skeleton-line skeleton-line--body" />
                    <span className="skeleton-line skeleton-line--body" />
                    <span className="skeleton-line skeleton-line--body short" />
                    <div className="skeleton-actions">
                        <span className="skeleton-pill" />
                        <span className="skeleton-pill" />
                        <span className="skeleton-icon" />
                    </div>
                </article>
            ))}
        </div>
    );
}

export function CommentSkeletonList({ count = 3 }) {
    return (
        <div className="skeleton-list skeleton-list--comments" aria-hidden="true">
            {range(count).map((item) => (
                <article key={item} className="skeleton-card skeleton-card--comment">
                    <div className="skeleton-row skeleton-row--author">
                        <span className="skeleton-avatar skeleton-avatar--small" />
                        <div className="skeleton-copy">
                            <span className="skeleton-line skeleton-line--title" />
                            <span className="skeleton-line skeleton-line--meta" />
                        </div>
                    </div>
                    <span className="skeleton-line skeleton-line--body" />
                    <span className="skeleton-line skeleton-line--body short" />
                </article>
            ))}
        </div>
    );
}

export function RoomCardSkeletonList({ count = 4 }) {
    return (
        <div className="skeleton-list skeleton-list--rooms" aria-hidden="true">
            {range(count).map((item) => (
                <article key={item} className="skeleton-card skeleton-card--room">
                    <div className="skeleton-copy">
                        <span className="skeleton-line skeleton-line--title" />
                        <span className="skeleton-line skeleton-line--body" />
                        <span className="skeleton-line skeleton-line--meta short" />
                    </div>
                    <span className="skeleton-button" />
                </article>
            ))}
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="skeleton-profile" aria-hidden="true">
            <section className="skeleton-card skeleton-card--profile-hero">
                <div className="skeleton-row skeleton-row--author">
                    <span className="skeleton-avatar skeleton-avatar--large" />
                    <div className="skeleton-copy">
                        <span className="skeleton-line skeleton-line--title" />
                        <span className="skeleton-line skeleton-line--meta" />
                    </div>
                </div>
                <div className="skeleton-profile__stats">
                    {range(3).map((item) => (
                        <span key={item} className="skeleton-line skeleton-line--stat" />
                    ))}
                </div>
            </section>
            <RoomCardSkeletonList count={4} />
        </div>
    );
}

export function ChatListSkeleton({ count = 5 }) {
    return (
        <div className="skeleton-list skeleton-list--chat" aria-hidden="true">
            {range(count).map((item) => (
                <article key={item} className="skeleton-card skeleton-card--chat">
                    <span className="skeleton-avatar" />
                    <div className="skeleton-copy">
                        <span className="skeleton-line skeleton-line--title" />
                        <span className="skeleton-line skeleton-line--body short" />
                    </div>
                </article>
            ))}
        </div>
    );
}

export function ChatThreadSkeleton({ count = 5 }) {
    return (
        <div className="skeleton-list skeleton-list--thread" aria-hidden="true">
            {range(count).map((item) => (
                <div key={item} className={`skeleton-chat-bubble${item % 2 === 0 ? "" : " is-mine"}`}>
                    <span className="skeleton-line skeleton-line--body" />
                    <span className="skeleton-line skeleton-line--body short" />
                </div>
            ))}
        </div>
    );
}

export function InfiniteScrollLoader({ label = "Loading more" }) {
    return (
        <div className="infinite-scroll-loader" role="status" aria-live="polite">
            <InlineSpinner size="sm" tone="brand" label={label} />
            <span>{label}</span>
        </div>
    );
}
