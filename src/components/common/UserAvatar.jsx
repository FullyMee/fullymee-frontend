import React from 'react';
import { getAvatarById } from '../../constants/avatars';
import './UserAvatar.css';

/**
 * Renders a user's avatar image.
 * 
 * @param {Object} props
 * @param {string} props.avatarId The avatar identifier (e.g. 'flowing_waterfall')
 * @param {string} [props.className] Additional CSS classes
 * @param {string} [props.alt] Alt text for accessibility
 */
export default function UserAvatar({ avatarId, className = '', alt = 'User avatar', ...props }) {
    const avatarSrc = getAvatarById(avatarId);

    return (
        <img 
            src={avatarSrc} 
            alt={alt} 
            className={`user-avatar ${className}`.trim()} 
            draggable="false"
            {...props}
        />
    );
}
