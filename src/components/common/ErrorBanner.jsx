import React, { useState } from 'react';
import { useError } from '../../context/ErrorContext';
import { ErrorSeverity, ErrorCategory } from '../../constants/errorTypes.js';
import { CircleAlert, Info, RefreshCcw, TriangleAlert, X } from "lucide-react";

function getSeverityStyles(severity, category) {
    if (category === ErrorCategory.AUTH) {
        return { bg: '#e3f2fd', color: '#1565c0', accent: '#1976d2', icon: <Info size={18} strokeWidth={2} /> };
    }
    if (severity === ErrorSeverity.WARNING) {
        return { bg: '#fff3e0', color: '#ef6c00', accent: '#f57c00', icon: <TriangleAlert size={18} strokeWidth={2} /> };
    }
    if (severity === ErrorSeverity.INFO) {
        return { bg: '#e1f5fe', color: '#0277bd', accent: '#0288d1', icon: <Info size={18} strokeWidth={2} /> };
    }
    // ERROR + CRITICAL
    return { bg: '#ffebee', color: '#c62828', accent: '#d32f2f', icon: <CircleAlert size={18} strokeWidth={2} /> };
}

export default function ErrorBanner() {
    const { error, clearError } = useError();
    const [isRetrying, setIsRetrying] = useState(false);

    if (!error?.isGlobal) return null;

    const { message, onRetry, metadata } = error;
    const severity = metadata?.severity || ErrorSeverity.ERROR;
    const category = metadata?.category || ErrorCategory.UNKNOWN;
    const { bg, color, accent, icon } = getSeverityStyles(severity, category);
    const hasRetry = typeof onRetry === 'function';

    const handleRetry = async () => {
        if (!hasRetry || isRetrying) return;
        setIsRetrying(true);
        try { await onRetry(); } catch { /* ignore */ } finally { setIsRetrying(false); }
    };

    return (
        <div
            className="error-banner"
            role="alert"
            style={{
                position: 'fixed', top: '12px', left: '50%',
                transform: 'translateX(-50%)',
                width: 'min(calc(100% - 24px), 480px)',
                backgroundColor: bg, color,
                padding: '14px 16px', zIndex: 9999,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                gap: '12px', borderRadius: '18px',
                border: `1px solid ${accent}22`,
                boxShadow: '0 18px 40px rgba(17, 36, 89, 0.14)',
                fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
                animation: 'errorBannerSlideDown 0.3s ease-out'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: accent }}>{icon}</span>
                <span style={{ flex: 1, lineHeight: 1.45, fontWeight: 600 }}>{message}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {hasRetry && (
                    <button
                        onClick={handleRetry}
                        disabled={isRetrying}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            background: 'rgba(255,255,255,0.7)',
                            border: `1px solid ${accent}33`, color: accent,
                            padding: '6px 12px', borderRadius: '999px',
                            cursor: isRetrying ? 'not-allowed' : 'pointer',
                            fontSize: '13px', fontWeight: 700,
                            transition: 'all 0.2s ease', opacity: isRetrying ? 0.7 : 1
                        }}
                        aria-label={isRetrying ? 'Retrying...' : 'Retry'}
                    >
                        <span style={{ display: 'inline-flex', animation: isRetrying ? 'spin 1s linear infinite' : 'none' }}>
                            <RefreshCcw size={16} strokeWidth={2.25} />
                        </span>
                        {isRetrying ? 'Retrying...' : 'Retry'}
                    </button>
                )}
                <button
                    onClick={clearError}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'none', border: 'none', color: accent,
                        padding: '4px', borderRadius: '999px', cursor: 'pointer',
                        opacity: 0.8, transition: 'opacity 0.2s ease'
                    }}
                    aria-label="Dismiss error"
                >
                    <X size={16} strokeWidth={2.25} />
                </button>
            </div>
        </div>
    );
}
