import React, { useState, useCallback } from 'react';
import { useError, ErrorSeverity, ErrorCategory } from '../../context/ErrorContext';
import { CircleAlert, Info, RefreshCcw, TriangleAlert, X } from "lucide-react";

/**
 * Icons for different error types
 */
/**
 * Get styling based on severity
 */
function getSeverityStyles(severity, category) {
    // Auth errors get a special blue styling
    if (category === ErrorCategory.AUTH) {
        return {
            backgroundColor: '#1976d2',
            lightBackground: '#e3f2fd',
            lightColor: '#1565c0',
            icon: <Info size={18} strokeWidth={2} />
        };
    }

    switch (severity) {
        case ErrorSeverity.CRITICAL:
            return {
                backgroundColor: '#d32f2f',
                lightBackground: '#ffebee',
                lightColor: '#c62828',
                icon: <CircleAlert size={18} strokeWidth={2} />
            };
        case ErrorSeverity.WARNING:
            return {
                backgroundColor: '#f57c00',
                lightBackground: '#fff3e0',
                lightColor: '#ef6c00',
                icon: <TriangleAlert size={18} strokeWidth={2} />
            };
        case ErrorSeverity.INFO:
            return {
                backgroundColor: '#0288d1',
                lightBackground: '#e1f5fe',
                lightColor: '#0277bd',
                icon: <Info size={18} strokeWidth={2} />
            };
        case ErrorSeverity.ERROR:
        default:
            return {
                backgroundColor: '#d32f2f',
                lightBackground: '#ffebee',
                lightColor: '#c62828',
                icon: <CircleAlert size={18} strokeWidth={2} />
            };
    }
}

/**
 * Enhanced Error Banner Component with retry functionality
 */
export default function ErrorBanner() {
    const { error, clearError } = useError();
    const [isRetrying, setIsRetrying] = useState(false);

    // Move hooks before early return
    const handleRetry = useCallback(async () => {
        if (!error?.onRetry || isRetrying) return;
        
        setIsRetrying(true);
        try {
            await error.onRetry();
        } catch (retryError) {
            console.error('Retry failed:', retryError);
        } finally {
            setIsRetrying(false);
        }
    }, [error, isRetrying]);

    const handleDismiss = useCallback(() => {
        clearError();
    }, [clearError]);

    if (!error || !error.isGlobal) {
        return null;
    }

    const { message, onRetry, metadata } = error;
    const severity = metadata?.severity || ErrorSeverity.ERROR;
    const category = metadata?.category || ErrorCategory.UNKNOWN;
    const styles = getSeverityStyles(severity, category);
    const hasRetry = typeof onRetry === 'function';

    return (
        <div 
            className="error-banner"
            role="alert"
            style={{
                position: 'fixed',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'min(calc(100% - 24px), 480px)',
                backgroundColor: styles.lightBackground,
                color: styles.lightColor,
                padding: '14px 16px',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                borderRadius: '18px',
                border: `1px solid ${styles.backgroundColor}22`,
                boxShadow: '0 18px 40px rgba(17, 36, 89, 0.14)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                animation: 'slideDown 0.3s ease-out'
            }}
        >
            <style>{`
                @keyframes slideDown {
                    from {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: styles.backgroundColor }}>
                    {styles.icon}
                </span>
                <span style={{ flex: 1, lineHeight: 1.45, fontWeight: 600 }}>{message}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {hasRetry && (
                    <button
                        onClick={handleRetry}
                        disabled={isRetrying}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(255,255,255,0.7)',
                            border: `1px solid ${styles.backgroundColor}33`,
                            color: styles.backgroundColor,
                            padding: '6px 12px',
                            borderRadius: '999px',
                            cursor: isRetrying ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: 700,
                            transition: 'all 0.2s ease',
                            opacity: isRetrying ? 0.7 : 1
                        }}
                        aria-label={isRetrying ? 'Retrying...' : 'Retry'}
                    >
                        <span style={{
                            display: 'inline-flex',
                            animation: isRetrying ? 'spin 1s linear infinite' : 'none'
                        }}>
                            <RefreshCcw size={16} strokeWidth={2.25} />
                        </span>
                        {isRetrying ? 'Retrying...' : 'Retry'}
                    </button>
                )}
                
                <button
                    onClick={handleDismiss}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'none',
                        border: 'none',
                        color: styles.backgroundColor,
                        padding: '4px',
                        borderRadius: '999px',
                        cursor: 'pointer',
                        opacity: 0.8,
                        transition: 'opacity 0.2s ease'
                    }}
                    aria-label="Dismiss error"
                >
                    <X size={16} strokeWidth={2.25} />
                </button>
            </div>
        </div>
    );
}

/**
 * Compact error banner for smaller spaces
 */
export function CompactErrorBanner() {
    const { error, clearError } = useError();

    const handleDismiss = useCallback(() => {
        clearError();
    }, [clearError]);

    if (!error || !error.isGlobal) {
        return null;
    }

    const { message } = error;

    return (
        <div 
            role="alert"
            style={{
                backgroundColor: '#d32f2f',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                fontSize: '13px',
                marginBottom: '12px'
            }}
        >
            <span>{message}</span>
            <button
                onClick={handleDismiss}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    opacity: 0.8
                }}
                aria-label="Dismiss"
            >
                <CloseIcon />
            </button>
        </div>
    );
}
