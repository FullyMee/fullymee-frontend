import { useEffect, useState } from "react";
import { connectSocket, getSocket } from "../services/socket";

export default function useSocket() {
    const socket = getSocket();

    const [connected, setConnected] = useState(() => Boolean(socket && socket.connected));

    useEffect(() => {
        const s = socket;

        if (!s) return;

        connectSocket().catch(() => {
            setConnected(false);
        });

        function onConnect() {
            setConnected(true);
        }

        function onDisconnect() {
            setConnected(false);
        }

        function onConnectError() {
            setConnected(false);
        }

        s.on("connect", onConnect);
        s.on("disconnect", onDisconnect);
        s.on("connect_error", onConnectError);

        return () => {
            s.off("connect", onConnect);
            s.off("disconnect", onDisconnect);
            s.off("connect_error", onConnectError);
        };

    }, [socket]);

    return { socket, connected };
}
