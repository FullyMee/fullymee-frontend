/**
 * Error mapping utilities for backend error codes
 * Provides user-friendly error messages based on backend error codes
 */

/**
 * Backend error code to message mapping
 */
const ERROR_CODE_MAP = {
    // Auth errors
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

    // Validation errors
    'VALIDATION_EMAIL_INVALID': 'Please enter a valid email address.',
    'VALIDATION_EMAIL_REQUIRED': 'Email is required.',
    'VALIDATION_USERNAME_INVALID': 'Username can only contain letters, numbers, and underscores.',
    'VALIDATION_USERNAME_TOO_SHORT': 'Username must be at least 3 characters.',
    'VALIDATION_USERNAME_TOO_LONG': 'Username must be less than 20 characters.',
    'VALIDATION_USERNAME_TAKEN': 'This username is already taken. Please choose another.',
    'VALIDATION_PASSWORD_TOO_WEAK': 'Password does not meet security requirements.',
    'VALIDATION_FIELD_REQUIRED': 'This field is required.',
    'VALIDATION_INVALID_FORMAT': 'The format of this field is invalid.',

    // Confession errors
    'CONFESSION_NOT_FOUND': 'This confession could not be found.',
    'CONFESSION_ALREADY_REPORTED': 'You have already reported this content.',
    'CONFESSION_ROOM_FULL': 'This room is full. Please try again later.',
    'CONFESSION_ROOM_NOT_FOUND': 'The room you are looking for does not exist.',
    'CONFESSION_ROOM_CLOSED': 'This room has been closed.',
    'CONFESSION_CONTENT_TOO_LONG': 'Your content exceeds the maximum length allowed.',
    'CONFESSION_RATE_LIMITED': 'You are posting too quickly. Please wait a moment.',

    // Chat errors
    'CHAT_USER_NOT_FOUND': 'The user you are trying to message could not be found.',
    'CHAT_BLOCKED': 'You cannot message this user.',
    'CHAT_BLOCKED_BY_USER': 'You have been blocked by this user.',
    'CHAT_CONVERSATION_NOT_FOUND': 'This conversation could not be found.',

    // Network errors
    'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection.',
    'NETWORK_TIMEOUT': 'The request timed out. Please try again.',
    'NETWORK_OFFLINE': 'You appear to be offline. Please check your internet connection.',

    // Server errors
    'SERVER_ERROR': 'Something went wrong on our end. Please try again later.',
    'SERVER_MAINTENANCE': 'We are currently performing maintenance. Please try again later.',

    // Generic fallbacks
    'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.',
    'PERMISSION_DENIED': 'You do not have permission to perform this action.'
};

/**
 * HTTP status code to error code mapping
 */
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

/**
 * Maps a backend error code to a user-friendly message
 * @param {string} code - The error code from the backend
 * @param {string} fallback - Fallback message if code not found
 * @returns {string} User-friendly error message
 */
export function mapErrorCode(code, fallback = null) {
    if (!code || typeof code !== 'string') {
        return fallback || ERROR_CODE_MAP.UNKNOWN_ERROR;
    }

    // Try exact match first
    if (ERROR_CODE_MAP[code]) {
        return ERROR_CODE_MAP[code];
    }

    // Try prefix matching for related errors
    const prefix = code.split('_')[0];
    const prefixMap = {
        'AUTH': 'Authentication failed. Please try again.',
        'VALIDATION': 'Please check your input and try again.',
        'CONFESSION': 'Unable to process your request. Please try again.',
        'CHAT': 'Unable to complete this action. Please try again.',
        'NETWORK': 'Connection error. Please check your internet.',
        'SERVER': 'Server error. Please try again later.'
    };

    if (prefixMap[prefix]) {
        return prefixMap[prefix];
    }

    return fallback || ERROR_CODE_MAP.UNKNOWN_ERROR;
}

/**
 * Maps HTTP status to a user-friendly message
 * @param {number} status - HTTP status code
 * @param {object} payload - Optional response payload with more details
 * @returns {string} User-friendly error message
 */
export function mapHttpStatus(status, payload = null) {
    // Check for exact backend error code in response
    if (payload && payload.code && ERROR_CODE_MAP[payload.code]) {
        return ERROR_CODE_MAP[payload.code];
    }

    // Check for specific error message in response
    if (payload && (payload.error || payload.message)) {
        const msg = String(payload.error || payload.message).trim();
        if (msg) {
            return msg;
        }
    }

    // Fall back to mapped error code if exists
    if (payload && payload.code) {
        return mapErrorCode(payload.code);
    }

    return HTTP_STATUS_MAP[status] || ERROR_CODE_MAP.UNKNOWN_ERROR;
}

/**
 * Determines if an error is retryable
 * @param {number} status - HTTP status code
 * @returns {boolean} Whether the request should be retried
 */
export function isRetryable(status) {
    // Network errors (status 0)
    if (!status) return true;
    
    // 429 Too Many Requests
    if (status === 429) return true;
    
    // 5xx Server errors
    if (status >= 500 && status < 600) return true;
    
    return false;
}

/**
 * Determines if an error indicates an authentication issue
 * @param {number} status - HTTP status code
 * @param {object} payload - Optional response payload
 * @returns {boolean} Whether the error is auth-related
 */
export function isAuthError(status, payload = null) {
    if (status === 401 || status === 403) return true;
    
    if (payload && payload.code) {
        const authCodes = ['AUTH_SESSION_EXPIRED', 'AUTH_INVALID_TOKEN', 'AUTH_INVALID_OTP'];
        return authCodes.includes(payload.code);
    }
    
    return false;
}

/**
 * Determines if an error is a validation error
 * @param {number} status - HTTP status code
 * @param {object} payload - Optional response payload
 * @returns {boolean} Whether the error is validation-related
 */
export function isValidationError(status, payload = null) {
    if (status === 400 || status === 422) return true;
    
    if (payload && payload.code) {
        return payload.code.startsWith('VALIDATION_');
    }
    
    return false;
}

/**
 * Extracts error information from various error formats
 * @param {Error|object} error - The error object
 * @returns {object} Normalized error information
 */
export function extractErrorInfo(error) {
    if (!error) {
        return {
            message: ERROR_CODE_MAP.UNKNOWN_ERROR,
            status: null,
            code: null,
            retryable: false,
            isAuth: false,
            isValidation: false
        };
    }

    const status = error.status || error.response?.status || null;
    const payload = error.payload || error.response?.data || null;
    const code = payload?.code || error.code || null;
    
    // Get user-friendly message
    let message;
    if (code) {
        message = mapErrorCode(code);
    } else if (status) {
        message = mapHttpStatus(status, payload);
    } else {
        message = error.message || ERROR_CODE_MAP.UNKNOWN_ERROR;
    }

    return {
        message,
        status,
        code,
        retryable: isRetryable(status),
        isAuth: isAuthError(status, payload),
        isValidation: isValidationError(status, payload)
    };
}

/**
 * Creates a standardized API error handler
 * @param {function} showError - Function to display errors
 * @param {function} showNetworkError - Function to display network errors
 * @param {function} showAuthError - Function to display auth errors
 * @returns {function} Handler function for API errors
 */
export function createErrorHandler(showError, showNetworkError, showAuthError) {
    return (error, options = {}) => {
        const { 
            onRetry = null, 
            useBanner = true, 
            customMessage = null 
        } = options;
        
        const errorInfo = extractErrorInfo(error);
        
        // Handle auth errors specially
        if (errorInfo.isAuth) {
            if (showAuthError) {
                showAuthError(customMessage || errorInfo.message);
            } else if (showError) {
                showError(customMessage || errorInfo.message, useBanner, null, { 
                    requiresAuth: true 
                });
            }
            return;
        }
        
        // Handle network errors
        if (!errorInfo.status || errorInfo.status === 0) {
            if (showNetworkError) {
                showNetworkError(onRetry);
            } else if (showError) {
                showError(
                    { 
                        message: customMessage || mapErrorCode('NETWORK_ERROR'),
                        status: 0,
                        category: 'network',
                        severity: 'critical'
                    }, 
                    useBanner, 
                    onRetry
                );
            }
            return;
        }
        
        // Handle other errors
        if (showError) {
            showError(
                {
                    message: customMessage || errorInfo.message,
                    status: errorInfo.status,
                    code: errorInfo.code
                },
                useBanner,
                errorInfo.retryable ? onRetry : null
            );
        }
    };
}

export default {
    mapErrorCode,
    mapHttpStatus,
    isRetryable,
    isAuthError,
    isValidationError,
    extractErrorInfo,
    createErrorHandler,
    ERROR_CODE_MAP,
    HTTP_STATUS_MAP
};
