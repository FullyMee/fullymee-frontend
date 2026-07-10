import React from 'react';

/**
 * Inline Error Component for form validation errors
 * Displays error message below form fields
 */
export default function InlineError({ error, className = '', style = {} }) {
    if (!error) {
        return null;
    }

    return (
        <span
            className={`inline-error ${className}`}
            role="alert"
            style={{
                display: 'block',
                color: '#d32f2f',
                fontSize: '12px',
                marginTop: '4px',
                lineHeight: 1.4,
                ...style
            }}
        >
            {error}
        </span>
    );
}

/**
 * Form Field wrapper component with inline error display
 * Wraps input fields with label, input, and error message
 */
export function FormField({ 
    label,
    error,
    children,
    required = false,
    className = '',
    style = {} 
}) {
    return (
        <div 
            className={`form-field ${className}`}
            style={{
                marginBottom: '16px',
                ...style
            }}
        >
            {label && (
                <label 
                    style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#333',
                        marginBottom: '6px'
                    }}
                >
                    {label}
                    {required && <span style={{ color: '#d32f2f', marginLeft: '2px' }}> *</span>}
                </label>
            )}
            {children}
            {error && <InlineError error={error} />}
        </div>
    );
}

/**
 * Input with inline error styling
 * A combined component for quick form field creation
 */
export function InputField({ 
    id,
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    required = false,
    disabled = false,
    className = '',
    style = {},
    inputStyle = {},
    ...props 
}) {
    return (
        <FormField 
            label={label} 
            error={error} 
            required={required}
            className={className}
            style={style}
        >
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: `1px solid ${error ? '#d32f2f' : '#ddd'}`,
                    borderRadius: '4px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    backgroundColor: disabled ? '#f5f5f5' : '#fff',
                    ...inputStyle
                }}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                {...props}
            />
        </FormField>
    );
}

/**
 * Textarea with inline error styling
 */
export function TextareaField({
    id,
    label,
    value,
    onChange,
    placeholder,
    error,
    required = false,
    disabled = false,
    rows = 4,
    className = '',
    style = {},
    ...props
}) {
    return (
        <FormField
            label={label}
            error={error}
            required={required}
            className={className}
            style={style}
        >
            <textarea
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: `1px solid ${error ? '#d32f2f' : '#ddd'}`,
                    borderRadius: '4px',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '80px',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    backgroundColor: disabled ? '#f5f5f5' : '#fff',
                }}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                {...props}
            />
        </FormField>
    );
}

/**
 * Select with inline error styling
 */
export function SelectField({
    id,
    label,
    value,
    onChange,
    options = [],
    error,
    required = false,
    disabled = false,
    placeholder = 'Select an option',
    className = '',
    style = {},
    ...props
}) {
    return (
        <FormField
            label={label}
            error={error}
            required={required}
            className={className}
            style={style}
        >
            <select
                id={id}
                value={value}
                onChange={onChange}
                disabled={disabled}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: `1px solid ${error ? '#d32f2f' : '#ddd'}`,
                    borderRadius: '4px',
                    outline: 'none',
                    backgroundColor: disabled ? '#f5f5f5' : '#fff',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </FormField>
    );
}

/**
 * Checkbox with inline error styling
 */
export function CheckboxField({
    id,
    label,
    checked,
    onChange,
    error,
    disabled = false,
    className = '',
    style = {},
    ...props
}) {
    return (
        <div 
            className={`checkbox-field ${className}`}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: error ? '16px' : '0',
                ...style
            }}
        >
            <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                style={{
                    width: '18px',
                    height: '18px',
                    marginTop: '2px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    accentColor: error ? '#d32f2f' : '#1976d2',
                }}
                aria-invalid={!!error}
                {...props}
            />
            <label 
                htmlFor={id}
                style={{
                    fontSize: '14px',
                    color: '#333',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    lineHeight: 1.4,
                    flex: 1
                }}
            >
                {label}
            </label>
            {error && (
                <span style={{ 
                    color: '#d32f2f', 
                    fontSize: '12px',
                    display: 'block',
                    width: '100%'
                }}>
                    {error}
                </span>
            )}
        </div>
    );
}
