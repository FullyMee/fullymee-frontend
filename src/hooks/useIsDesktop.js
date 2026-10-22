import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 900px)";

export default function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);

    useEffect(() => {
        const mq = window.matchMedia(DESKTOP_QUERY);
        const onChange = (e) => setIsDesktop(e.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    return isDesktop;
}
