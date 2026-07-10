import './SurfaceCard.css';

export default function SurfaceCard({
    as: Tag = 'article',
    interactive = false,
    className = '',
    children,
    ...props
}) {
    const interactiveClass = interactive ? ' shared-surface-card--interactive' : '';

    return (
        <Tag
            className={`shared-surface-card${interactiveClass}${className ? ` ${className}` : ''}`}
            {...props}
        >
            {children}
        </Tag>
    );
}
