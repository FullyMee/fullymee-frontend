export default function DesktopMiniStats({ items, className = "", ...props }) {
    return (
        <div className={`desktop-mini-stats${className ? ` ${className}` : ""}`} {...props}>
            {(Array.isArray(items) ? items : []).map((item) => (
                <article key={item.key || item.label}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                </article>
            ))}
        </div>
    );
}
