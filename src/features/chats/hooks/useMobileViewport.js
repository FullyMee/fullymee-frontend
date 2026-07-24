import { useEffect, useState } from "react";

export default function useMobileViewport(isMobileThreadView) {
    const [mobileViewportFrame, setMobileViewportFrame] = useState(null);

    useEffect(() => {
        if (!isMobileThreadView) {
            setMobileViewportFrame(null);
            return undefined;
        }

        const viewport = window.visualViewport;
        if (!viewport) {
            setMobileViewportFrame({
                height: window.innerHeight,
                offsetTop: 0,
                bottomInset: 0
            });
            return undefined;
        }

        const updateViewportFrame = () => {
            const layoutHeight = Math.round(window.innerHeight || viewport.height || 0);
            const offsetTop = Math.round(viewport.offsetTop || 0);
            const visibleHeight = Math.round(viewport.height || 0);
            const bottomInset = Math.max(0, layoutHeight - visibleHeight - offsetTop);

            setMobileViewportFrame({
                height: visibleHeight,
                offsetTop,
                bottomInset
            });
        };

        updateViewportFrame();
        viewport.addEventListener("resize", updateViewportFrame);
        viewport.addEventListener("scroll", updateViewportFrame);

        return () => {
            viewport.removeEventListener("resize", updateViewportFrame);
            viewport.removeEventListener("scroll", updateViewportFrame);
        };
    }, [isMobileThreadView]);

    return mobileViewportFrame;
}
