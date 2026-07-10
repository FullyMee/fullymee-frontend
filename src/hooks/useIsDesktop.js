import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 1100px)";

function getMatch() {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return false;
    }

    return window.matchMedia(DESKTOP_QUERY).matches;
}

export default function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(getMatch);

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return undefined;
        }

        const mediaQuery = window.matchMedia(DESKTOP_QUERY);
        const handleChange = (event) => {
            setIsDesktop(event.matches);
        };

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", handleChange);
            return () => mediaQuery.removeEventListener("change", handleChange);
        }

        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
    }, []);

    return isDesktop;
}
