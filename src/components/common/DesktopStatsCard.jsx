export default function DesktopStatsCard({
    title,
    items,
    className = "",
    ...props
}) {
    return (
        <section className={`desktop-stats-card${className ? ` ${className}` : ""}`} {...props}>
            {title ? <h2>{title}</h2> : null}
            <div className="desktop-stats-card__grid">
                {(Array.isArray(items) ? items : []).map((item) => (
                    <article key={item.key || item.label}>
                        <strong>{item.value}</strong>
                        <span>{item.label}</span>
                    </article>
                ))}
            </div>
        </section>
    );
}
