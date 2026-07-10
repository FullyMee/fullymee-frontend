import SurfaceCard from "./SurfaceCard.jsx";

export default function DesktopRailCard({
    title,
    icon,
    className = "",
    headerClassName = "",
    children,
    ...props
}) {
    const cardClassName = `desktop-rail-card${className ? ` ${className}` : ""}`;
    const resolvedHeaderClassName = `desktop-rail-card__header${headerClassName ? ` ${headerClassName}` : ""}`;

    return (
        <SurfaceCard as="section" className={cardClassName} {...props}>
            {(icon || title) && (
                <div className={resolvedHeaderClassName}>
                    {icon}
                    {title ? <h2>{title}</h2> : null}
                </div>
            )}
            {children}
        </SurfaceCard>
    );
}
