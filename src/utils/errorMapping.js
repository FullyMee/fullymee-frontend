/**
 * Backend error code → user-friendly message
 */
const ERROR_CODE_MAP = {
    // Auth
    'AUTH_INVALID_OTP': 'The OTP you entered is invalid or has expired. Please request a new one.',
    'AUTH_OTP_EXPIRED': 'Your OTP has expired. Please request a new one.',
    'AUTH_USER_NOT_FOUND': 'No account found with this email. Please sign up first.',
    'AUTH_USER_ALREADY_EXISTS': 'An account with this email already exists.',
    'AUTH_SESSION_EXPIRED': 'Your session has expired. Please sign in again.',
    'AUTH_INVALID_TOKEN': 'Your authentication token is invalid. Please sign in again.',
    'AUTH_RATE_LIMITED': 'Too many attempts. Please wait a moment and try again.',
    'GOOGLE_SIGNIN_NO_ACCOUNT': 'User does not exist, sign up first.',
    'GOOGLE_ACCOUNT_CONFLICT': 'This Google account is already linked to another user.',
    'GOOGLE_SIGNIN_INVALID': 'Unable to validate Google credential. Please try again.',
    // Validation
    'VALIDATION_EMAIL_INVALID': 'Please enter a valid email address.',
    'VALIDATION_EMAIL_REQUIRED': 'Email is required.',
    'VALIDATION_USERNAME_INVALID': 'Username can only contain letters, numbers, and underscores.',
    'VALIDATION_USERNAME_TOO_SHORT': 'Username must be at least 3 characters.',
    'VALIDATION_USERNAME_TOO_LONG': 'Username must be less than 20 characters.',
    'VALIDATION_USERNAME_TAKEN': 'This username is already taken. Please choose another.',
    'VALIDATION_PASSWORD_TOO_WEAK': 'Password does not meet security requirements.',
    'VALIDATION_FIELD_REQUIRED': 'This field is required.',
    'VALIDATION_INVALID_FORMAT': 'The format of this field is invalid.',
    // Confession
    'CONFESSION_NOT_FOUND': 'This confession could not be found.',
    'CONFESSION_ALREADY_REPORTED': 'You have already reported this content.',
    'CONFESSION_ROOM_FULL': 'This room is full. Please try again later.',
    'CONFESSION_ROOM_NOT_FOUND': 'The room you are looking for does not exist.',
    'CONFESSION_ROOM_CLOSED': 'This room has been closed.',
    'CONFESSION_CONTENT_TOO_LONG': 'Your content exceeds the maximum length allowed.',
    'CONFESSION_RATE_LIMITED': 'You are posting too quickly. Please wait a moment.',
    // Chat
    'CHAT_USER_NOT_FOUND': 'The user you are trying to message could not be found.',
    'CHAT_BLOCKED': 'You cannot message this user.',
    'CHAT_BLOCKED_BY_USER': 'You have been blocked by this user.',
    'CHAT_CONVERSATION_NOT_FOUND': 'This conversation could not be found.',
    // Network / Server
    'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection.',
    'NETWORK_TIMEOUT': 'The request timed out. Please try again.',
    'NETWORK_OFFLINE': 'You appear to be offline. Please check your internet connection.',
    'SERVER_ERROR': 'Something went wrong on our end. Please try again later.',
    'SERVER_MAINTENANCE': 'We are currently performing maintenance. Please try again later.',
    // Generic
    'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.',
    'PERMISSION_DENIED': 'You do not have permission to perform this action.'
};

const HTTP_STATUS_MAP = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'Your session has expired. Please sign in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'A conflict occurred. Please refresh and try again.',
    422: 'The data you provided is invalid. Please check your input.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'We are experiencing technical difficulties. Please try again later.',
    502: 'The server is temporarily unavailable. Please try again later.',
    503: 'Service is temporarily unavailable. Please try again later.',
    504: 'The request timed out. Please try again.'
};

/** Maps a backend error code to a user-friendly message */
export function mapErrorCode(code, fallback = null) {
    if (!code || typeof code !== 'string') return fallback || ERROR_CODE_MAP.UNKNOWN_ERROR;
    if (ERROR_CODE_MAP[code]) return ERROR_CODE_MAP[code];

    const prefixMap = {
        'AUTH': 'Authentication failed. Please try again.',
        'VALIDATION': 'Please check your input and try again.',
        'CONFESSION': 'Unable to process your request. Please try again.',
        'CHAT': 'Unable to complete this action. Please try again.',
        'NETWORK': 'Connection error. Please check your internet.',
        'SERVER': 'Server error. Please try again later.'
    };
    const prefix = code.split('_')[0];
    return prefixMap[prefix] || fallback || ERROR_CODE_MAP.UNKNOWN_ERROR;
}

/** Maps HTTP status + optional payload to a user-friendly message */
export function mapHttpStatus(status, payload = null) {
    if (payload?.code && ERROR_CODE_MAP[payload.code]) return ERROR_CODE_MAP[payload.code];
    const msg = String(payload?.error || payload?.message || '').trim();
    if (msg) return msg;
    if (payload?.code) return mapErrorCode(payload.code);
    return HTTP_STATUS_MAP[status] || ERROR_CODE_MAP.UNKNOWN_ERROR;
}

/** Whether an HTTP status is safe to retry */
export function isRetryable(status) {
    if (!status) return true;
    if (status === 429) return true;
    if (status >= 500 && status < 600) return true;
    return false;
}
