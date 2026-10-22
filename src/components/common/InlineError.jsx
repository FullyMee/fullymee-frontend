import React from 'react';

export default function InlineError({ error, className = '', style = {} }) {
    if (!error) return null;
    return (
        <span
            className={`inline-error ${className}`}
            role="alert"
            style={{ display: 'block', color: '#d32f2f', fontSize: '12px', marginTop: '4px', lineHeight: 1.4, ...style }}
        >
            {error}
        </span>
    );
}
