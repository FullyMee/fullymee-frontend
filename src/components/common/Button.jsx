import React from 'react';
import './Button.css';

/**
 * Shared Button Component
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'danger' | 'ghost' | 'text'} props.variant
 * @param {boolean} props.fullWidth
 * @param {boolean} props.isLoading
 */
export default function Button({ 
    children, 
    variant = 'primary', 
    size = 'md',
    fullWidth = false, 
    isLoading = false,
    className = '', 
    disabled,
    type = 'button',
    ...props 
}) {
    const baseClass = 'shared-btn';
    const variantClass = `${baseClass}--${variant}`;
    const sizeClass = `${baseClass}--${size}`;
    const widthClass = fullWidth ? `${baseClass}--full-width` : '';
    const loadingClass = isLoading ? 'is-loading' : '';

    return (
        <button 
            type={type}
            className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${loadingClass} ${className}`.trim()} 
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="shared-btn__loader" aria-hidden="true" />
            ) : null}
            <span className="shared-btn__content">{children}</span>
        </button>
    );
}
