import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
export { ErrorSeverity, ErrorCategory } from '../constants/errorTypes.js';
import { ErrorSeverity, ErrorCategory } from '../constants/errorTypes.js';

const ErrorContext = createContext();

function getCategoryFromStatus(status) {
    if (!status) return ErrorCategory.UNKNOWN;
    if (status === 401 || status === 403) return ErrorCategory.AUTH;
    if (status === 400 || status === 422) return ErrorCategory.VALIDATION;
    if (status >= 500 || status === 0) return ErrorCategory.NETWORK;
    return ErrorCategory.API;
}

function getSeverityFromStatus(status) {
    if (!status || status === 0) return ErrorSeverity.CRITICAL;
    if (status === 401) return ErrorSeverity.WARNING;
    if (status >= 500) return ErrorSeverity.CRITICAL;
    return ErrorSeverity.ERROR;
}

export function useError() {
    return useContext(ErrorContext);
}

export function ErrorProvider({ children }) {
    const [error, setError] = useState(null);

    const showError = useCallback((message, isGlobal = false, onRetry = null, metadata = {}) => {
        let errorMessage = message;
        let status = null;
        let category = ErrorCategory.UNKNOWN;
        let severity = ErrorSeverity.ERROR;

        if (message instanceof Error) {
            errorMessage = message.message;
            status = message.status || message.response?.status;
            category = getCategoryFromStatus(status);
            severity = getSeverityFromStatus(status);
        } else if (message && typeof message === 'object') {
            errorMessage = message.message || message.error || JSON.stringify(message);
            status = message.status;
            category = message.category || getCategoryFromStatus(status);
            severity = message.severity || getSeverityFromStatus(status);
        }

        const errorObject = {
            message: errorMessage,
            isGlobal,
            onRetry,
            metadata: { ...metadata, status, category, severity, timestamp: Date.now() }
        };

        setError(errorObject);

        // Auto-dismiss non-critical errors after 10 seconds
        if (severity !== ErrorSeverity.CRITICAL) {
            setTimeout(() => {
                setError((current) => {
                    if (current?.metadata.timestamp === errorObject.metadata.timestamp) return null;
                    return current;
                });
            }, 10000);
        }

        return errorObject;
    }, []);

    const clearError = useCallback(() => setError(null), []);

    // dismissError kept as alias since pages destructure it directly
    const value = useMemo(() => ({
        error,
        showError,
        clearError,
        dismissError: clearError
    }), [error, showError, clearError]);

    return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
}

export function useGlobalError() {
    const { showError, clearError, dismissError, error } = useError();

    const showGlobalError = useCallback((message, onRetry) => {
        return showError(message, true, onRetry);
    }, [showError]);

    return useMemo(() => ({
        error,
        showError: showGlobalError,
        clearError,
        dismissError
    }), [error, showGlobalError, clearError, dismissError]);
}
