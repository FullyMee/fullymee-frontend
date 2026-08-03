import { extractErrorInfo, mapHttpStatus, isRetryable } from '../utils/errorMapping.js';

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

function resolveApiUrl() {
    const env = (typeof import.meta !== 'undefined' && import.meta.env)
        ? import.meta.env
        : process.env;

    const raw = rewriteUrlHostname(env.VITE_API_URL || env.API_URL || "http://localhost:5000", 5000);
    if (!raw) {
        return "http://localhost:5000/api";
    }

    return raw.replace(/\/+$/, "").endsWith("/api")
        ? raw.replace(/\/+$/, "")
        : `${raw.replace(/\/+$/, "")}/api`;
}

const API_URL = resolveApiUrl();
const GET_CACHE_TTL_MS = 5000;
const getRequestCache = new Map();
const inflightGetRequests = new Map();

/**
 * Pre-warm / keep-alive strategy for Render free-tier.
 *
 * 1. Fires an immediate ping as soon as the module loads so the backend
 *    starts waking up while the React app is still mounting.
 *
 * 2. After the initial ping, continues to send a lightweight health
 *    request every KEEP_ALIVE_INTERVAL_MS (4 minutes). This prevents
 *    Render's 15-minute inactivity sleep — so users who return to an
 *    open tab never hit the 20-second cold-start delay.
 *
 * 3. Pauses automatically when the browser tab is hidden (Page
 *    Visibility API) and resumes immediately when the tab becomes
 *    visible again, also firing a fresh ping on resume.
 */
const KEEP_ALIVE_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

function getHealthUrl() {
    return API_URL.replace(/\/api\/?$/, "") + "/health";
}

function pingHealth() {
    if (typeof window === "undefined" || !window.fetch) return;
    try {
        fetch(getHealthUrl(), { method: "GET", cache: "no-store" }).catch(() => { });
    } catch {
        // Non-blocking — ignore all errors
    }
}

export function prewarmBackend() {
    pingHealth();
}

// ── Keep-alive scheduler ─────────────────────────────────────────────────────
if (typeof window !== "undefined") {
    // Fire immediately on page load
    pingHealth();

    let keepAliveTimer = null;

    function startKeepAlive() {
        if (keepAliveTimer) return; // already running
        keepAliveTimer = setInterval(() => {
            if (document.visibilityState !== "hidden") {
                pingHealth();
            }
        }, KEEP_ALIVE_INTERVAL_MS);
    }

    function stopKeepAlive() {
        if (keepAliveTimer) {
            clearInterval(keepAliveTimer);
            keepAliveTimer = null;
        }
    }

    // Pause/resume based on tab visibility
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            stopKeepAlive();
        } else {
            // Tab became visible again — ping immediately then restart interval
            pingHealth();
            startKeepAlive();
        }
    });

    // Start the first interval
    startKeepAlive();
}


const DEFAULT_RETRY_OPTIONS = {
    retries: 3,
    baseDelayMs: 300,
    maxDelayMs: 3000,
    jitterFactor: 0.25,
    retryMethods: ['GET', 'HEAD', 'OPTIONS'],
    retryStatusCodes: [0, 429, 502, 503, 504]
};

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeBackoffDelay(attempt, baseDelayMs, maxDelayMs, jitterFactor) {
    const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
    const jitter = 1 + ((Math.random() * 2 - 1) * jitterFactor);
    return Math.max(0, Math.min(maxDelayMs, Math.round(exponential * jitter)));
}

function getRetryAfterDelay(response, defaultDelay) {
    if (!response || typeof response.headers?.get !== 'function') {
        return defaultDelay;
    }
    const raw = response.headers.get('Retry-After');
    if (!raw) return defaultDelay;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return defaultDelay;
    return Math.max(defaultDelay, parsed * 1000);
}

/**
 * Default error messages for common HTTP status codes
 */
function getDefaultErrorMessage(status) {
    if (status === 400) return "Invalid request. Please check your input and try again.";
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403) return "You do not have permission to perform this action.";
    if (status === 404) return "Requested resource was not found.";
    if (status === 429) return "Too many requests. Please wait and try again.";
    if (status >= 500) return "We are experiencing a server issue. Please try again shortly.";
    return "Something went wrong. Please try again.";
}

function clonePayload(value) {
    if (value === null || value === undefined) return value;
    if (typeof value !== "object") return value;
    return JSON.parse(JSON.stringify(value));
}

function getRequestCacheKey(endpoint, fetchOptions, headers) {
    return JSON.stringify({
        endpoint,
        method: String(fetchOptions.method || "GET").toUpperCase(),
        headers,
        body: fetchOptions.body || null
    });
}

function readCachedGet(cacheKey) {
    const entry = getRequestCache.get(cacheKey);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
        getRequestCache.delete(cacheKey);
        return null;
    }
    return clonePayload(entry.payload);
}

function writeCachedGet(cacheKey, payload) {
    getRequestCache.set(cacheKey, {
        payload: clonePayload(payload),
        expiresAt: Date.now() + GET_CACHE_TTL_MS
    });
}

function clearGetCache() {
    getRequestCache.clear();
    inflightGetRequests.clear();
}

/**
 * Extract message from response payload
 */
function extractMessage(payload) {
    if (!payload) return "";
    if (typeof payload === "string") return payload.trim();
    if (typeof payload === "object") {
        const candidate = payload.error || payload.message;
        return typeof candidate === "string" ? candidate.trim() : "";
    }
    return "";
}

/**
 * Format error message using error mapping utilities
 */
function formatErrorMessage(status, payload) {
    // Use the advanced error mapping for known error codes
    const mappedMessage = mapHttpStatus(status, payload);
    if (mappedMessage) {
        return mappedMessage;
    }

    const serverMessage = extractMessage(payload);

    // Keep backend-auth messages that are already user-friendly.
    if (status === 400 || status === 429) {
        return serverMessage || getDefaultErrorMessage(status);
    }

    if (status === 401) {
        return getDefaultErrorMessage(status);
    }

    if (status >= 500) {
        return getDefaultErrorMessage(status);
    }

    return serverMessage || getDefaultErrorMessage(status);
}

/**
 * Parse response body
 */
async function parseResponseBody(response) {
    if (response.status === 204) return null;
    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function getDocumentCookieValue(name) {
    if (typeof document === 'undefined' || !document.cookie) return null;
    const cookies = document.cookie.split(';').map((item) => item.trim());
    for (const cookie of cookies) {
        const [key, ...rest] = cookie.split('=');
        if (String(key || '').trim() === name) {
            return decodeURIComponent(rest.join('=').trim());
        }
    }
    return null;
}

function isCsrfProtectedMethod(method) {
    return !['GET', 'HEAD', 'OPTIONS'].includes(String(method || 'GET').toUpperCase());
}

let inMemoryCsrfToken = null;
let csrfTokenPromise = null;

async function getCsrfTokenSafe() {
    if (inMemoryCsrfToken) return inMemoryCsrfToken;

    let token = getDocumentCookieValue('csrf_token');
    if (token) {
        inMemoryCsrfToken = token;
        return token;
    }

    if (!csrfTokenPromise) {
        csrfTokenPromise = fetch(`${API_URL}/auth/csrf`, {
            method: 'GET',
            credentials: 'include'
        }).then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.csrfToken) {
                    inMemoryCsrfToken = data.csrfToken;
                    return inMemoryCsrfToken;
                }
                return null;
            }).catch(() => null)
            .finally(() => {
                csrfTokenPromise = null;
            });
    }
    return csrfTokenPromise;
}

/**
 * Main API request function
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise} API response
 */
export async function apiRequest(endpoint, options = {}) {
    const {
        skipErrorLog = false,
        skipCache = false,
        skipAuthRefresh = false,
        retryOptions = {},
        ...fetchOptions
    } = options;

    const headers = { ...(fetchOptions.headers || {}) };
    const hasBody = fetchOptions.body !== undefined && fetchOptions.body !== null;
    if (hasBody && !headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
    }

    const method = String(fetchOptions.method || "GET").toUpperCase();
    const headerKeys = Object.keys(headers || {});
    const hasCsrfHeader = headerKeys.some((key) => ['x-csrf-token', 'x-xsrf-token'].includes(String(key).toLowerCase()));
    const shouldUseGetCache = method === "GET" && !skipCache;
    const cacheKey = shouldUseGetCache ? getRequestCacheKey(endpoint, fetchOptions, headers) : "";

    const mergedRetryOptions = {
        ...DEFAULT_RETRY_OPTIONS,
        ...retryOptions,
        retryMethods: retryOptions.retryMethods || DEFAULT_RETRY_OPTIONS.retryMethods,
        retryStatusCodes: retryOptions.retryStatusCodes || DEFAULT_RETRY_OPTIONS.retryStatusCodes
    };

    const shouldRetry = mergedRetryOptions.retryMethods.includes(method);
    const isRefreshEndpoint = endpoint.replace(/^\/+/, '') === 'auth/refresh';
    let refreshAttempted = false;

    const performRefresh = async () => {
        if (skipAuthRefresh || isRefreshEndpoint || refreshAttempted) {
            return false;
        }

        refreshAttempted = true;
        try {
            const refreshHeaders = {
                'Content-Type': 'application/json'
            };
            const csrfToken = getDocumentCookieValue('csrf_token');
            if (csrfToken) {
                refreshHeaders['X-CSRF-Token'] = csrfToken;
            }

            const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: refreshHeaders
            });

            if (!refreshResponse.ok) {
                return false;
            }

            await parseResponseBody(refreshResponse);
            return true;
        } catch {
            return false;
        }
    };

    const performRequest = async () => {
        const requestHeaders = { ...headers };
        if (isCsrfProtectedMethod(method) && !hasCsrfHeader) {
            const csrfToken = await getCsrfTokenSafe();
            if (csrfToken) {
                requestHeaders['X-CSRF-Token'] = csrfToken;
            }
        }

        let response;
        try {
            response = await fetch(`${API_URL}${endpoint}`, {
                ...fetchOptions,
                credentials: "include",
                headers: requestHeaders
            });
        } catch {
            const error = new Error("Unable to connect to the server. Please check your internet connection.");
            error.status = 0;
            error.payload = { code: 'NETWORK_ERROR' };
            error.isNetworkError = true;
            error.retryable = true;
            if (!skipErrorLog) {
                console.error("API Network Error:", error.message);
            }
            throw error;
        }

        const payload = await parseResponseBody(response);

        if (!response.ok) {
            const message = formatErrorMessage(response.status, payload);
            if (!skipErrorLog) {
                console.error("API Error Response:", message, { status: response.status, payload });
            }

            const error = new Error(message);
            error.status = response.status;
            error.payload = payload;
            error.retryable = isRetryable(response.status);
            error.retryAfterMs = getRetryAfterDelay(response, 0);

            const errorInfo = extractErrorInfo(error);
            error.errorInfo = errorInfo;

            throw error;
        }

        if (method !== "GET") {
            clearGetCache();
        }

        if (shouldUseGetCache) {
            writeCachedGet(cacheKey, payload);
        }

        return payload;
    };

    let attempt = 0;
    let lastError = null;
    let csrfRetried = false;

    while (true) {
        if (shouldUseGetCache) {
            const cachedPayload = readCachedGet(cacheKey);
            if (cachedPayload !== null) {
                return cachedPayload;
            }

            if (inflightGetRequests.has(cacheKey)) {
                return clonePayload(await inflightGetRequests.get(cacheKey));
            }
        }

        try {
            if (!shouldUseGetCache) {
                return await performRequest();
            }

            const requestPromise = performRequest();
            inflightGetRequests.set(cacheKey, requestPromise);

            try {
                return clonePayload(await requestPromise);
            } finally {
                inflightGetRequests.delete(cacheKey);
            }
        } catch (error) {
            lastError = error;
            const status = error.status || 0;

            if (status === 401 && !skipAuthRefresh) {
                const refreshed = await performRefresh();
                if (refreshed) {
                    continue;
                }
            }

            if (status === 403 && error.payload && error.payload.error === "Invalid CSRF token" && !csrfRetried) {
                inMemoryCsrfToken = null;
                csrfRetried = true;
                continue;
            }

            const canRetry = shouldRetry && mergedRetryOptions.retryStatusCodes.includes(status);
            if (!canRetry || attempt >= mergedRetryOptions.retries) {
                throw lastError;
            }

            attempt += 1;
            const backoffMs = computeBackoffDelay(attempt, mergedRetryOptions.baseDelayMs, mergedRetryOptions.maxDelayMs, mergedRetryOptions.jitterFactor);
            const delayMs = error.retryAfterMs ? Math.max(backoffMs, error.retryAfterMs) : backoffMs;
            if (!skipErrorLog) {
                console.warn(`Retrying API request after ${delayMs}ms (attempt ${attempt})`, { endpoint, method, status });
            }
            await wait(delayMs);
            continue;
        }
    }
}

/**
 * API request wrapper with built-in error handling
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {object} { data, error, retry }
 */
export async function safeApiRequest(endpoint, options = {}) {
    try {
        const data = await apiRequest(endpoint, options);
        return { data, error: null, retry: null };
    } catch (error) {
        const retryFn = error.retryable
            ? () => safeApiRequest(endpoint, options)
            : null;

        return {
            data: null,
            error: {
                message: error.message,
                status: error.status,
                code: error.payload?.code,
                retryable: error.retryable
            },
            retry: retryFn
        };
    }
}

/**
 * GET request helper
 */
export function get(endpoint, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export function post(endpoint, body, options = {}) {
    return apiRequest(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body)
    });
}

/**
 * PUT request helper
 */
export function put(endpoint, body, options = {}) {
    return apiRequest(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body)
    });
}

/**
 * PATCH request helper
 */
export function patch(endpoint, body, options = {}) {
    return apiRequest(endpoint, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(body)
    });
}

/**
 * DELETE request helper
 */
export function del(endpoint, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'DELETE' });
}

export default {
    apiRequest,
    safeApiRequest,
    get,
    post,
    put,
    patch,
    del
};
