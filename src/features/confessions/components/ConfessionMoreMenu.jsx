import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";

export default function ConfessionMoreMenu({ onDelete }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [open]);

    return (
        <div className="confession-more-menu-wrap" ref={menuRef} style={{ position: "relative" }}>
            <button
                type="button"
                className="confession-more-btn"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen((prev) => !prev);
                }}
                aria-label="More options"
            >
                <MoreHorizontal size={18} />
            </button>
            {open && (
                <div
                    className="confession-more-dropdown"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        className="confession-more-dropdown__item confession-more-dropdown__item--danger"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpen(false);
                            onDelete?.();
                        }}
                    >
                        <Trash2 size={15} />
                        <span>Delete confession</span>
                    </button>
                </div>
            )}
        </div>
    );
}
