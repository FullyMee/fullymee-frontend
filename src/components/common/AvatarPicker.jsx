import React from 'react';
import { AVATAR_OPTIONS } from '../../constants/avatars';
import UserAvatar from './UserAvatar';
import './AvatarPicker.css';

/**
 * Shared AvatarPicker Component
 * @param {Object} props
 * @param {string} props.selectedAvatar
 * @param {Function} props.onSelect
 * @param {string} props.className
 */
export default function AvatarPicker({
    selectedAvatar,
    onSelect,
    className = ''
}) {
    return (
        <div className={`shared-avatar-picker ${className}`.trim()}>
            <div className="shared-avatar-picker__list">
                {AVATAR_OPTIONS.map((avatarObj) => {
                    const isSelected = selectedAvatar === avatarObj.id;
                    return (
                        <button
                            key={avatarObj.id}
                            type="button"
                            className={`shared-avatar-picker__btn ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => onSelect(avatarObj.id)}
                            title={`Select ${avatarObj.name}`}
                            aria-label={`Select ${avatarObj.name}`}
                            aria-pressed={isSelected}
                        >
                            <div className="shared-avatar-picker__img-wrapper">
                                <UserAvatar avatarId={avatarObj.id} />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
