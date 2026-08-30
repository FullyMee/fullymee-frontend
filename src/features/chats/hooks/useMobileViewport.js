import { useEffect, useState } from "react";

export default function useMobileViewport(isMobileThreadView) {
    const [mobileViewportFrame, setMobileViewportFrame] = useState(null);

    useEffect(() => {
        if (!isMobileThreadView) {
            setMobileViewportFrame(null);
            return undefined;
        }

        let animationFrameId = null;

        const updateViewportFrame = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            animationFrameId = requestAnimationFrame(() => {
                const viewport = window.visualViewport;
                if (viewport) {
                    const visibleHeight = Math.round(viewport.height);
                    const offsetTop = Math.round(viewport.offsetTop || 0);
                    const layoutHeight = Math.round(window.innerHeight || visibleHeight);
                    const bottomInset = Math.max(0, layoutHeight - visibleHeight - offsetTop);

                    setMobileViewportFrame((prev) => {
                        if (
                            prev &&
                            prev.height === visibleHeight &&
                            prev.offsetTop === offsetTop &&
                            prev.bottomInset === bottomInset
                        ) {
                            return prev;
                        }
                        return {
                            height: visibleHeight,
                            offsetTop,
                            bottomInset
                        };
                    });
                } else {
                    const windowHeight = window.innerHeight;
                    setMobileViewportFrame((prev) => {
                        if (prev && prev.height === windowHeight && prev.offsetTop === 0) {
                            return prev;
                        }
                        return {
                            height: windowHeight,
                            offsetTop: 0,
                            bottomInset: 0
                        };
                    });
                }
            });
        };

        updateViewportFrame();

        const viewport = window.visualViewport;
        if (viewport) {
            viewport.addEventListener("resize", updateViewportFrame);
            viewport.addEventListener("scroll", updateViewportFrame);
        } else {
            window.addEventListener("resize", updateViewportFrame);
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            if (viewport) {
                viewport.removeEventListener("resize", updateViewportFrame);
                viewport.removeEventListener("scroll", updateViewportFrame);
            } else {
                window.removeEventListener("resize", updateViewportFrame);
            }
        };
    }, [isMobileThreadView]);

    return mobileViewportFrame;
}
