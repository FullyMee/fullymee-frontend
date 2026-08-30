import React from "react";

/**
 * Base Skeleton component — configurable shimmer placeholder.
 *
 * @param {Object} props
 * @param {string} [props.width]       - CSS width (default: '100%')
 * @param {string} [props.height]      - CSS height (default: '1rem')
 * @param {string} [props.borderRadius] - CSS border-radius override
 * @param {'text'|'circle'|'rect'} [props.variant] - Shape variant
 * @param {string} [props.className]   - Additional class name
 * @param {number} [props.count]       - Render multiple skeletons
 * @param {Object} [props.style]       - Additional inline styles
 */
export default function Skeleton({
    width = "100%",
    height = "1rem",
    borderRadius,
    variant = "text",
    className = "",
    count = 1,
    style,
    ...rest
}) {
    const variantClass = variant !== "text" ? ` fm-skeleton--${variant}` : "";
    const resolvedStyle = {
        width,
        height,
        ...(borderRadius ? { borderRadius } : {}),
        ...style,
    };

    if (count > 1) {
        return Array.from({ length: count }, (_, i) => (
            <span
                key={i}
                className={`fm-skeleton${variantClass} ${className}`.trim()}
                style={resolvedStyle}
                aria-hidden="true"
                {...rest}
            />
        ));
    }

    return (
        <span
            className={`fm-skeleton${variantClass} ${className}`.trim()}
            style={resolvedStyle}
            aria-hidden="true"
            {...rest}
        />
    );
}
