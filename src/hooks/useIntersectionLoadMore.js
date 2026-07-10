import { useEffect, useRef } from "react";

export default function useIntersectionLoadMore(onLoadMore, { enabled = true, root = null, rootMargin = "180px", threshold = 0.1 } = {}) {
    const targetRef = useRef(null);

    useEffect(() => {
        if (!enabled || typeof onLoadMore !== "function" || !targetRef.current) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    onLoadMore();
                }
            },
            { root, rootMargin, threshold }
        );

        observer.observe(targetRef.current);
        return () => observer.disconnect();
    }, [enabled, onLoadMore, root, rootMargin, threshold]);

    return targetRef;
}
