import { mapHttpStatus, isRetryable } from '../utils/errorMapping.js';

const env = typeof import.meta !== 'undefined' ? import.meta.env : {};
const RAW_API_URL = String(env.VITE_API_URL || env.API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;

// ── Keep-alive (prevents Render free-tier cold starts) ────────────────────────
const HEALTH_URL = API_URL.replace(/\/api\/?$/, '') + '/health';
const KEEP_ALIVE_MS = 4 * 60 * 1000; // 4 minutes

function pingHealth() {
    if (typeof window === 'undefined' || !window.fetch) return;
    fetch(HEALTH_URL, { method: 'GET', cache: 'no-store' }).catch(() => {});
}

if (typeof window !== 'undefined') {
    pingHealth();
    let timer = setInterval(() => {
        if (document.visibilityState !== 'hidden') pingHealth();
    }, KEEP_ALIVE_MS);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            clearInterval(timer);
            timer = null;
        } else {
            pingHealth();
            timer = timer || setInterval(() => {
                if (document.visibilityState !== 'hidden') pingHealth();
            }, KEEP_ALIVE_MS);
        }
    });
}

// ── GET cache + inflight deduplication ───────────────────────────────────────
const GET_CACHE_TTL_MS = 5000;
const getCache = new Map();
const inflight = new Map();

function cacheKey(endpoint, opts, headers) {
    return JSON.stringify({ endpoint, method: String(opts.method || 'GET').toUpperCase(), headers, body: opts.body || null });
}

function readCache(key) {
    const entry = getCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) { getCache.delete(key); return null; }
    return JSON.parse(JSON.stringify(entry.payload));
}

function writeCache(key, payload) {
    getCache.set(key, { payload: JSON.parse(JSON.stringify(payload)), expiresAt: Date.now() + GET_CACHE_TTL_MS });
}

function clearCache() {
    getCache.clear();
    inflight.clear();
}

// ── Retry helpers ─────────────────────────────────────────────────────────────
const RETRY_DEFAULTS = {
    retries: 3, baseDelayMs: 300, maxDelayMs: 3000,
    jitterFactor: 0.25,
    retryMethods: ['GET', 'HEAD', 'OPTIONS'],
    retryStatusCodes: [0, 429, 502, 503, 504]
};

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

function backoffDelay(attempt, base, max, jitter) {
    const exp = Math.min(max, base * 2 ** attempt);
    return Math.max(0, Math.min(max, Math.round(exp * (1 + (Math.random() * 2 - 1) * jitter))));
}

function retryAfterMs(response, defaultDelay) {
    const raw = response?.headers?.get?.('Retry-After');
    if (!raw) return defaultDelay;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.max(defaultDelay, parsed * 1000) : defaultDelay;
}

// ── Error formatting ──────────────────────────────────────────────────────────
function defaultMsg(status) {
    if (status === 400) return 'Invalid request. Please check your input and try again.';
    if (status === 401) return 'Your session has expired. Please sign in again.';
    if (status === 403) return 'You do not have permission to perform this action.';
    if (status === 404) return 'Requested resource was not found.';
    if (status === 429) return 'Too many requests. Please wait and try again.';
    if (status >= 500) return 'We are experiencing a server issue. Please try again shortly.';
    return 'Something went wrong. Please try again.';
}

function extractMsg(payload) {
    if (!payload) return '';
    if (typeof payload === 'string') return payload.trim();
    const c = payload.error || payload.message;
    return typeof c === 'string' ? c.trim() : '';
}

function formatError(status, payload) {
    const mapped = mapHttpStatus(status, payload);
    if (mapped) return mapped;
    const server = extractMsg(payload);
    if (status === 400 || status === 429) return server || defaultMsg(status);
    return defaultMsg(status);
}

async function parseBody(response) {
    if (response.status === 204) return null;
    const text = await response.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return text; }
}

// ── CSRF ──────────────────────────────────────────────────────────────────────
function getCookie(name) {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|;)\\s*' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

let csrfToken = null;
let csrfPromise = null;

async function getCsrf() {
    if (csrfToken) return csrfToken;
    const fromCookie = getCookie('csrf_token');
    if (fromCookie) { csrfToken = fromCookie; return csrfToken; }

    if (!csrfPromise) {
        csrfPromise = fetch(`${API_URL}/auth/csrf`, { method: 'GET', credentials: 'include' })
            .then((r) => r.ok ? r.json() : null)
            .then((d) => { if (d?.csrfToken) csrfToken = d.csrfToken; return csrfToken; })
            .catch(() => null)
            .finally(() => { csrfPromise = null; });
    }
    return csrfPromise;
}

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// ── Core request ──────────────────────────────────────────────────────────────
export async function apiRequest(endpoint, options = {}) {
    const {
        skipErrorLog = false,
        skipCache = false,
        skipAuthRefresh = false,
        retryOptions = {},
        ...fetchOptions
    } = options;

    const headers = { ...(fetchOptions.headers || {}) };
    if (fetchOptions.body != null && !headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
    }

    const method = String(fetchOptions.method || 'GET').toUpperCase();
    const hasCsrfHeader = Object.keys(headers).some((k) => ['x-csrf-token', 'x-xsrf-token'].includes(k.toLowerCase()));
    const useGetCache = method === 'GET' && !skipCache;
    const key = useGetCache ? cacheKey(endpoint, fetchOptions, headers) : '';

    const retry = { ...RETRY_DEFAULTS, ...retryOptions };
    const canRetry = retry.retryMethods.includes(method);
    const isRefreshEndpoint = endpoint.replace(/^\/+/, '') === 'auth/refresh';
    let refreshAttempted = false;
    let csrfRetried = false;

    const doRefresh = async () => {
        if (skipAuthRefresh || isRefreshEndpoint || refreshAttempted) return false;
        refreshAttempted = true;
        try {
            const h = { 'Content-Type': 'application/json' };
            const t = getCookie('csrf_token');
            if (t) h['X-CSRF-Token'] = t;
            const r = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include', headers: h });
            if (!r.ok) return false;
            await parseBody(r);
            return true;
        } catch { return false; }
    };

    const doRequest = async () => {
        const reqHeaders = { ...headers };
        if (!SAFE_METHODS.includes(method) && !hasCsrfHeader) {
            const t = await getCsrf();
            if (t) reqHeaders['X-CSRF-Token'] = t;
        }

        let response;
        try {
            response = await fetch(`${API_URL}${endpoint}`, { ...fetchOptions, credentials: 'include', headers: reqHeaders });
        } catch {
            const err = new Error('Unable to connect to the server. Please check your internet connection.');
            err.status = 0;
            err.payload = { code: 'NETWORK_ERROR' };
            err.isNetworkError = true;
            err.retryable = true;
            if (!skipErrorLog) console.error('API Network Error:', err.message);
            throw err;
        }

        const payload = await parseBody(response);

        if (!response.ok) {
            const message = formatError(response.status, payload);
            if (!skipErrorLog) console.error('API Error:', message, { status: response.status });
            const err = new Error(message);
            err.status = response.status;
            err.payload = payload;
            err.retryable = isRetryable(response.status);
            err.retryAfterMs = retryAfterMs(response, 0);
            throw err;
        }

        if (method !== 'GET') clearCache();
        if (useGetCache) writeCache(key, payload);
        return payload;
    };

    let attempt = 0;
    let lastError = null;

    while (true) {
        if (useGetCache) {
            const cached = readCache(key);
            if (cached !== null) return cached;
            if (inflight.has(key)) return JSON.parse(JSON.stringify(await inflight.get(key)));
        }

        try {
            if (!useGetCache) return await doRequest();
            const promise = doRequest();
            inflight.set(key, promise);
            try { return JSON.parse(JSON.stringify(await promise)); }
            finally { inflight.delete(key); }
        } catch (error) {
            lastError = error;
            const status = error.status || 0;

            if (status === 401 && !skipAuthRefresh) {
                if (await doRefresh()) continue;
            }

            if (status === 403 && error.payload?.error === 'Invalid CSRF token' && !csrfRetried) {
                csrfToken = null;
                csrfRetried = true;
                continue;
            }

            if (!canRetry || !retry.retryStatusCodes.includes(status) || attempt >= retry.retries) {
                throw lastError;
            }

            attempt += 1;
            const delay = Math.max(backoffDelay(attempt, retry.baseDelayMs, retry.maxDelayMs, retry.jitterFactor),
                error.retryAfterMs || 0);
            if (!skipErrorLog) console.warn(`Retrying after ${delay}ms (attempt ${attempt})`, { endpoint, status });
            await wait(delay);
        }
    }
}

export async function safeApiRequest(endpoint, options = {}) {
    try {
        const data = await apiRequest(endpoint, options);
        return { data, error: null, retry: null };
    } catch (error) {
        return {
            data: null,
            error: { message: error.message, status: error.status, code: error.payload?.code, retryable: error.retryable },
            retry: error.retryable ? () => safeApiRequest(endpoint, options) : null
        };
    }
}

export const get = (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' });
export const post = (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
export const put = (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
export const patch = (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
export const del = (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' });

export default { apiRequest, safeApiRequest, get, post, put, patch, del };
