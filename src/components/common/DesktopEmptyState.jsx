import SurfaceCard from "./SurfaceCard.jsx";
import { Leaf } from "lucide-react";

export default function DesktopEmptyState({
    title,
    description,
    icon = null,
    compact = false,
    className = "",
    action = null,
    children = null,
    ...props
}) {
    const cardClassName = `desktop-empty-card${compact ? " desktop-empty-card--compact" : ""}${className ? ` ${className}` : ""}`;

    return (
        <SurfaceCard as="section" className={cardClassName} {...props}>
            <div className="desktop-empty-card__icon">
                {icon || <Leaf size={22} strokeWidth={1.8} />}
            </div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
            {action}
            {children}
        </SurfaceCard>
    );
}
