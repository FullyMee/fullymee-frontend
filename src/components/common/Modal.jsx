import React, { useEffect } from 'react';
import { X } from "lucide-react";
import './Modal.css';

/**
 * Shared Modal Wrapper
 * @param {Object} props 
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} props.title
 * @param {string} props.description
 * @param {React.ReactNode} props.children
 * @param {string} props.className
 */
export default function Modal({ isOpen, onClose, title, description, children, className = '' }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="shared-modal" role="dialog" aria-modal="true" aria-labelledby="shared-modal-title">
            <div className="shared-modal__backdrop" onClick={onClose} />
            <div className={`shared-modal__card ${className}`.trim()}>
                {(title || onClose) && (
                    <div className="shared-modal__header">
                        <div>
                            {title && <h2 id="shared-modal-title">{title}</h2>}
                            {description && <p>{description}</p>}
                        </div>
                        {onClose && (
                            <button
                                type="button"
                                className="shared-modal__close"
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                <X size={18} strokeWidth={2.25} />
                            </button>
                        )}
                    </div>
                )}
                <div className="shared-modal__body">
                    {children}
                </div>
            </div>
        </div>
    );
}
