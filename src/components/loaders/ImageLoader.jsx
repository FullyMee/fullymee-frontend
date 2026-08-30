import React, { useState, useCallback } from "react";

/**
 * Image loading wrapper — skeleton placeholder → fade-in on load → fallback on error.
 *
 * @param {string} props.src
 * @param {string} [props.alt]
 * @param {string} [props.width]
 * @param {string} [props.height]
 * @param {string} [props.className]
 * @param {string} [props.fallbackText] - Text to show if image fails
 * @param {string} [props.borderRadius]
 */
export default function ImageLoader({
    src,
    alt = "",
    width,
    height,
    className = "",
    fallbackText = "?",
    borderRadius,
    style,
    ...rest
}) {
    const [loaded, setLoaded] = useState(false);
    const [errored, setErrored] = useState(false);

    const handleLoad = useCallback(() => setLoaded(true), []);
    const handleError = useCallback(() => { setErrored(true); setLoaded(true); }, []);

    const wrapStyle = {
        width,
        height,
        borderRadius,
        ...style,
    };

    return (
        <span className={`fm-img-loader ${className}`.trim()} style={wrapStyle}>
            {/* Shimmer placeholder */}
            <span className={`fm-img-loader__placeholder${loaded ? " is-hidden" : ""}`} />

            {errored ? (
                <span className="fm-img-loader__fallback" style={{ borderRadius }}>
                    {fallbackText}
                </span>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    className="fm-img-loader__img"
                    onLoad={handleLoad}
                    onError={handleError}
                    loading="lazy"
                    style={{ borderRadius }}
                    {...rest}
                />
            )}
        </span>
    );
}
