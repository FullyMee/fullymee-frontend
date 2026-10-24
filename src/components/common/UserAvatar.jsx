import React, { useState } from 'react';
import { getAvatarById, getDeterministicAvatarId, AVATAR_OPTIONS } from '../../constants/avatars';
import './UserAvatar.css';

/**
 * Renders a user's avatar image from the 7 curated avatars.
 * 
 * @param {Object} props
 * @param {string} [props.avatarId] The avatar identifier (e.g. 'flowing_waterfall', 'cracked_mirror')
 * @param {string|number} [props.seed] Fallback seed (e.g. alias or userId) to pick deterministically among the 7 avatars
 * @param {string} [props.className] Additional CSS classes
 * @param {string} [props.alt] Alt text for accessibility
 */
export default function UserAvatar({ avatarId, seed, className = '', alt = 'User avatar', onError, ...props }) {
    const isValidOption = avatarId && AVATAR_OPTIONS.some(a => a.id === avatarId);
    const resolvedId = isValidOption
        ? avatarId
        : (avatarId && (typeof avatarId === 'string') && (avatarId.startsWith('http') || avatarId.startsWith('/'))
            ? avatarId
            : (seed ? getDeterministicAvatarId(seed) : (avatarId || 'flowing_waterfall')));

    const [hasError, setHasError] = useState(false);
    const avatarSrc = hasError ? getAvatarById('flowing_waterfall') : getAvatarById(resolvedId);

    return (
        <img 
            src={avatarSrc} 
            alt={alt} 
            className={`user-avatar ${className}`.trim()} 
            draggable="false"
            onError={(e) => {
                if (!hasError) setHasError(true);
                if (onError) onError(e);
            }}
            {...props}
        />
    );
}

