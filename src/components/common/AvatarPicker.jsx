import React from 'react';
import './AvatarPicker.css';

/**
 * Shared AvatarPicker Component
 * @param {Object} props
 * @param {string} props.selectedAvatar
 * @param {Function} props.onSelect
 * @param {string[]} props.options
 * @param {string} props.className
 */
export default function AvatarPicker({
    selectedAvatar,
    onSelect,
    options = ['🌙', '⭐', '🌸', '🦋', '🌊', '🔮', '💫', '🌺'],
    className = ''
}) {
    return (
        <div className={`shared-avatar-picker ${className}`.trim()}>
            <div className="shared-avatar-picker__list">
                {options.map((avatar) => (
                    <button
                        key={avatar}
                        type="button"
                        className={`shared-avatar-picker__btn ${selectedAvatar === avatar ? 'is-selected' : ''}`}
                        onClick={() => onSelect(avatar)}
                        title={`Select ${avatar} as avatar`}
                        aria-label={`Select ${avatar} as avatar`}
                        aria-pressed={selectedAvatar === avatar}
                    >
                        {avatar}
                    </button>
                ))}
            </div>
        </div>
    );
}
