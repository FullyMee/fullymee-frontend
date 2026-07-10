import SurfaceCard from "./SurfaceCard.jsx";

export default function DesktopEmptyState({
    title,
    description,
    compact = false,
    className = "",
    action = null,
    children = null,
    ...props
}) {
    const cardClassName = `desktop-empty-card${compact ? " desktop-empty-card--compact" : ""}${className ? ` ${className}` : ""}`;

    return (
        <SurfaceCard as="section" className={cardClassName} {...props}>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
            {action}
            {children}
        </SurfaceCard>
    );
}
