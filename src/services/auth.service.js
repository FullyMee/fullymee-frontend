import { apiRequest } from "./api";

export function requestOTP(email, intent) {
    const payload = { email };
    if (intent) {
        payload.intent = intent;
    }

    return apiRequest("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

export function verifyOTP(email, otp, username) {
    const payload = { email, otp };
    const normalizedUsername = String(username || "").trim().toLowerCase();

    if (normalizedUsername) {
        payload.username = normalizedUsername;
    }

    return apiRequest("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

export function googleSignIn(credential) {
    return apiRequest("/auth/google-signin", {
        method: "POST",
        body: JSON.stringify({ credential })
    });
}

export function checkUsername(username) {
    const value = String(username || "").trim().toLowerCase();
    return apiRequest(`/auth/check-username?username=${encodeURIComponent(value)}`, {
        method: "GET",
        skipErrorLog: true
    });
}

export function logout() {
    return apiRequest("/auth/logout", {
        method: "POST",
        skipErrorLog: true
    });
}

export function getSocketToken() {
    return apiRequest("/auth/socket-token", {
        method: "GET",
        skipCache: true,
        skipErrorLog: true
    });
}

export function getCurrentUser() {
    return apiRequest("/users/me", {
        method: "GET",
        skipErrorLog: true
    });
}

export function getAllUsers(options = {}) {
    const params = new URLSearchParams();
    if (options.search) params.append("search", options.search);
    if (options.limit) params.append("limit", options.limit);
    if (options.offset !== undefined) params.append("offset", options.offset);
    if (options.paginate) params.append("paginate", "true");

    return apiRequest(`/users?${params.toString()}`, {
        method: "GET",
        skipErrorLog: true
    });
}

export function updateCurrentUserPreferences(payload) {
    return apiRequest("/users/preferences", {
        method: "PUT",
        body: JSON.stringify(payload || {})
    });
}
