export default function DesktopIconStatCard({
    icon,
    iconTone = "blue",
    value,
    label,
    className = "",
    ...props
}) {
    return (
        <article className={`desktop-profile-stat-box${className ? ` ${className}` : ""}`} {...props}>
            <div className={`desktop-profile-stat-box__icon desktop-profile-stat-box__icon--${iconTone}`}>
                {icon}
            </div>
            <div className="desktop-profile-stat-box__info">
                <strong>{value}</strong>
                <span>{label}</span>
            </div>
        </article>
    );
}
