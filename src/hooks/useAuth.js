import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../services/auth.service";

export default function useAuth() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const syncAuthFromServer = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getCurrentUser();
            const nextUser = result && result.user ? result.user : null;
            setUser(nextUser);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        syncAuthFromServer();

        window.addEventListener("auth-changed", syncAuthFromServer);

        return () => {
            window.removeEventListener("auth-changed", syncAuthFromServer);
        };
    }, [syncAuthFromServer]);

    return useMemo(() => ({
        loading,
        user,
        isAuthenticated: !!(user && user.userId)
    }), [loading, user]);
}
