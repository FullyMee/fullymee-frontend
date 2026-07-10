import { useEffect } from "react";

export default function useBodyClass(className, enabled = true) {
    useEffect(() => {
        if (!enabled || !className) return undefined;

        document.body.classList.add(className);

        return () => {
            document.body.classList.remove(className);
        };
    }, [className, enabled]);
}
