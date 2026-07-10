import { io } from "socket.io-client";
import { getSocketToken as requestSocketToken } from "./auth.service";

let socket = null;
let socketToken = "";
let socketTokenPromise = null;
const SOCKET_CONNECT_TIMEOUT_MS = 5000;

function getRuntimeHostname() {
    if (typeof window === "undefined" || !window.location) {
        return "";
    }
    return String(window.location.hostname || "").trim().toLowerCase();
}

function rewriteUrlHostname(rawUrl, fallbackPort) {
    const trimmed = String(rawUrl || "").trim();
    if (!trimmed) return "";

    try {
        const url = new URL(trimmed);
        const runtimeHostname = getRuntimeHostname();
        const isLocalHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
        const shouldUseRuntimeHost = runtimeHostname && runtimeHostname !== "localhost" && runtimeHostname !== "127.0.0.1";

        if (isLocalHost && shouldUseRuntimeHost) {
            url.hostname = runtimeHostname;
            if (!url.port && fallbackPort) {
                url.port = String(fallbackPort);
            }
        }

        return url.toString();
    } catch {
        return trimmed;
    }
}

function getSocketUrl() {
    if (import.meta.env.VITE_SOCKET_URL) {
        return rewriteUrlHostname(import.meta.env.VITE_SOCKET_URL, 5000);
    }
    const apiUrl = rewriteUrlHostname(import.meta.env.VITE_API_URL || "http://localhost:5000/api", 5000);
    return apiUrl.replace(/\/api\/?$/, "");
}

function ensureSocket() {
    if (socket) return socket;

    socket = io(getSocketUrl(), {
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        auth: {}
    });

    return socket;
}

async function loadSocketToken(forceRefresh = false) {
    if (socketToken && !forceRefresh) {
        return socketToken;
    }

    if (socketTokenPromise && !forceRefresh) {
        return socketTokenPromise;
    }

    socketTokenPromise = requestSocketToken()
        .then((result) => {
            socketToken = String(result && result.token ? result.token : "").trim();
            return socketToken;
        })
        .finally(() => {
            socketTokenPromise = null;
        });

    return socketTokenPromise;
}

/* Singleton socket instance */
export function getSocket() {
    return ensureSocket();
}

export async function connectSocket({ forceTokenRefresh = false } = {}) {
    const instance = ensureSocket();
    const token = await loadSocketToken(forceTokenRefresh);

    if (!token) {
        throw new Error("Missing socket token");
    }

    instance.auth = { token };

    if (!instance.connected) {
        instance.connect();
    }

    return instance;
}

export async function waitForSocketConnection({ forceTokenRefresh = false, timeoutMs = SOCKET_CONNECT_TIMEOUT_MS } = {}) {
    const instance = await connectSocket({ forceTokenRefresh });

    if (instance.connected) {
        return instance;
    }

    return new Promise((resolve, reject) => {
        let settled = false;
        let timerId = null;

        function cleanup() {
            if (timerId) {
                clearTimeout(timerId);
            }
            instance.off("connect", handleConnect);
            instance.off("connect_error", handleConnectError);
        }

        function finish(fn, value) {
            if (settled) return;
            settled = true;
            cleanup();
            fn(value);
        }

        function handleConnect() {
            finish(resolve, instance);
        }

        function handleConnectError(error) {
            finish(reject, error || new Error("Unable to connect socket"));
        }

        timerId = setTimeout(() => {
            finish(reject, new Error("Socket connection timed out"));
        }, timeoutMs);

        instance.on("connect", handleConnect);
        instance.on("connect_error", handleConnectError);
        instance.connect();
    });
}

/* Safe disconnect */
export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    socketToken = "";
    socketTokenPromise = null;
}
