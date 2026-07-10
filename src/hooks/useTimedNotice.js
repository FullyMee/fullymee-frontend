import { useEffect, useState } from "react";

export default function useTimedNotice(initialValue = "", durationMs = 2400) {
    const [notice, setNotice] = useState(initialValue);

    useEffect(() => {
        if (!notice) return undefined;

        const timer = setTimeout(() => setNotice(""), durationMs);
        return () => clearTimeout(timer);
    }, [durationMs, notice]);

    return [notice, setNotice, () => setNotice("")];
}
