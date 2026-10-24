import React, { useId } from 'react';
import './Input.css';

/**
 * Shared Input Component
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.error
 * @param {string} props.success
 * @param {string} props.helperText
 * @param {React.ReactNode} props.startIcon
 * @param {string} props.className
 */
export default function Input({
    label,
    error,
    success,
    helperText,
    startIcon,
    className = '',
    id,
    ...props
}) {
    const generatedId = useId();
    const inputId = id || generatedId;

    let statusClass = '';
    if (error) statusClass = 'shared-input--error';
    if (success) statusClass = 'shared-input--success';

    return (
        <div className={`shared-input-group ${className}`.trim()}>
            {label && (
                <label className="shared-input-group__label" htmlFor={inputId}>
                    {label}
                </label>
            )}
            <div className={`shared-input-shell ${statusClass}`}>
                {startIcon && <span className="shared-input-shell__icon">{startIcon}</span>}
                <input id={inputId} className="shared-input-shell__element" {...props} />
            </div>
            {error && <p className="shared-input-group__message shared-input-group__message--error">{error}</p>}
            {success && <p className="shared-input-group__message shared-input-group__message--success">{success}</p>}
            {helperText && !error && !success && (
                <small className="shared-input-group__helper">{helperText}</small>
            )}
        </div>
    );
}
