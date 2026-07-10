import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ErrorContext = createContext();

/**
 * Error severity levels for different types of errors
 */
export const ErrorSeverity = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
};

/**
 * Error categories for better handling
 */
export const ErrorCategory = {
    NETWORK: 'network',
    AUTH: 'auth',
    VALIDATION: 'validation',
    API: 'api',
    UNKNOWN: 'unknown'
};

/**
 * Maps HTTP status codes to error categories
 */
function getCategoryFromStatus(status) {
    if (!status) return ErrorCategory.UNKNOWN;
    if (status === 401 || status === 403) return ErrorCategory.AUTH;
    if (status === 400 || status === 422) return ErrorCategory.VALIDATION;
    if (status >= 500 || status === 0) return ErrorCategory.NETWORK;
    return ErrorCategory.API;
}

/**
 * Maps HTTP status codes to severity
 */
function getSeverityFromStatus(status) {
    if (!status || status === 0) return ErrorSeverity.CRITICAL;
    if (status === 401) return ErrorSeverity.WARNING;
    if (status >= 500) return ErrorSeverity.CRITICAL;
    if (status >= 400) return ErrorSeverity.ERROR;
    return ErrorSeverity.ERROR;
}

export function useError() {
    return useContext(ErrorContext);
}

/**
 * Enhanced Error Provider with retry capability and comprehensive error management
 */
export function ErrorProvider({ children }) {
    const [error, setError] = useState(null);
    const [errorHistory, setErrorHistory] = useState([]);

    /**
     * Show an error with full metadata
     * @param {string|object} message - Error message or error object
     * @param {boolean} isGlobal - Whether this is a global error (for banner)
     * @param {function} onRetry - Optional retry callback
     * @param {object} metadata - Additional error metadata
     */
    const showError = useCallback((message, isGlobal = false, onRetry = null, metadata = {}) => {
        // Handle Error objects
        let errorMessage = message;
        let status = null;
        let category = ErrorCategory.UNKNOWN;
        let severity = ErrorSeverity.ERROR;

        if (message instanceof Error) {
            errorMessage = message.message;
            status = message.status || message.response?.status;
            category = getCategoryFromStatus(status);
            severity = getSeverityFromStatus(status);
        } else if (typeof message === 'object' && message !== null) {
            errorMessage = message.message || message.error || JSON.stringify(message);
            status = message.status;
            category = message.category || getCategoryFromStatus(status);
            severity = message.severity || getSeverityFromStatus(status);
        }

        const errorObject = {
            message: errorMessage,
            isGlobal,
            onRetry,
            metadata: {
                ...metadata,
                status,
                category,
                severity,
                timestamp: Date.now()
            }
        };

        setError(errorObject);

        // Add to history for debugging (keep last 10)
        setErrorHistory(prev => {
            const newHistory = [...prev, errorObject];
            return newHistory.slice(-10);
        });

        // Auto-dismiss non-critical errors after 10 seconds
        if (severity !== ErrorSeverity.CRITICAL) {
            setTimeout(() => {
                setError(current => {
                    if (current && current.metadata.timestamp === errorObject.metadata.timestamp) {
                        return null;
                    }
                    return current;
                });
            }, 10000);
        }

        return errorObject;
    }, []);

    /**
     * Show a network error (no connection or server unreachable)
     */
    const showNetworkError = useCallback((onRetry = null) => {
        return showError(
            {
                message: 'Unable to connect to the server. Please check your internet connection.',
                status: 0,
                category: ErrorCategory.NETWORK,
                severity: ErrorSeverity.CRITICAL
            },
            true,
            onRetry
        );
    }, [showError]);

    /**
     * Show an authentication error
     */
    const showAuthError = useCallback((message = 'Your session has expired. Please sign in again.') => {
        return showError(
            {
                message,
                status: 401,
                category: ErrorCategory.AUTH,
                severity: ErrorSeverity.WARNING
            },
            true,
            null,
            { requiresAuth: true }
        );
    }, [showError]);

    /**
     * Show a validation error (typically for forms)
     */
    const showValidationError = useCallback((message) => {
        return showError(
            {
                message,
                status: 400,
                category: ErrorCategory.VALIDATION,
                severity: ErrorSeverity.ERROR
            },
            false
        );
    }, [showError]);

    /**
     * Clear the current error
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Clear error history
     */
    const clearErrorHistory = useCallback(() => {
        setErrorHistory([]);
    }, []);

    /**
     * Dismiss error (alias for clearError for clarity)
     */
    const dismissError = useCallback(() => {
        setError(null);
    }, []);

    const value = useMemo(() => ({
        error,
        errorHistory,
        showError,
        showNetworkError,
        showAuthError,
        showValidationError,
        clearError,
        dismissError,
        clearErrorHistory,
        ErrorSeverity,
        ErrorCategory
    }), [
        error,
        errorHistory,
        showError,
        showNetworkError,
        showAuthError,
        showValidationError,
        clearError,
        dismissError,
        clearErrorHistory
    ]);

    return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
}

/**
 * Hook for using global error functions with retry support
 */
export function useGlobalError() {
    const { showError, showNetworkError, showAuthError, clearError, dismissError, error } = useError();

    const showGlobalError = useCallback((message, onRetry) => {
        return showError(message, true, onRetry);
    }, [showError]);

    return useMemo(() => ({
        error,
        showError: showGlobalError,
        showNetworkError,
        showAuthError,
        clearError,
        dismissError
    }), [clearError, dismissError, error, showAuthError, showGlobalError, showNetworkError]);
}

/**
 * Hook for local form error handling
 */
export function useFormError() {
    const { showError, clearError } = useError();

    const [formError, setFormError] = useState(null);

    const setError = useCallback((message) => {
        const errorObj = showError(message, false);
        setFormError(errorObj.message);
        return errorObj;
    }, [showError]);

    const clearFormError = useCallback(() => {
        clearError();
        setFormError(null);
    }, [clearError]);

    return {
        error: formError,
        setError,
        clearError: clearFormError
    };
}
