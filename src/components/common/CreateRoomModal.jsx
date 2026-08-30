import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import InlineError from "./InlineError.jsx";
import { InlineSpinner } from "../loaders";
import { ArrowLeft, Check, ChevronDown, Globe, Lock, RefreshCcw, ImageIcon } from "lucide-react";
import { getAmbiencesForCategory } from "../../config/ambienceLibrary.js";

const ROOM_CATEGORIES = [
    "Late Night",
    "Heartbreak",
    "Anxiety",
    "Relationships",
    "Family",
    "College",
    "Career",
    "Tech and Coding",
    "Casual Chats",
    "Confessions",
    "Gaming",
    "Entertainment",
    "Fitness",
    "Finance",
    "Politics",
    "Startup",
    "Travel",
    "Books",
    "Advice"
];

export default function CreateRoomModal({
    open,
    roomType,
    roomTitle,
    roomDescription,
    roomCategory,
    joinCode,
    createErrors,
    submitting,
    createDisabled,
    roomTitleLimit = 50,
    roomDescriptionLimit = 50,
    onClose,
    onSubmit,
    onRoomTitleChange,
    onRoomDescriptionChange,
    onRoomCategoryChange,
    onRoomTypeChange,
    onJoinCodeChange,
    onGenerateJoinCode
}) {
    const [selectedAmbienceId, setSelectedAmbienceId] = useState(null);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Auto pre-select the first image when category changes or modal opens
    useEffect(() => {
        if (!open) return;
        const images = getAmbiencesForCategory(roomCategory);
        if (images.length > 0) {
            setSelectedAmbienceId((prev) => {
                const stillValid = images.some((img) => img.id === prev);
                return stillValid ? prev : images[0].id;
            });
        } else {
            setSelectedAmbienceId(null);
        }
    }, [open, roomCategory]);

    // Click-outside closes category dropdown
    useEffect(() => {
        if (!categoryOpen) return undefined;
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setCategoryOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [categoryOpen]);

    // Lock body scroll while modal is open
    useEffect(() => {
        if (!open || typeof document === "undefined") return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    if (!open || typeof document === "undefined") return null;

    const handleSubmitForm = (event) => {
        event.preventDefault();
        onSubmit(event, selectedAmbienceId);
    };

    const categoryImages = getAmbiencesForCategory(roomCategory);

    return createPortal(
        <div className="discover-create-screen" role="dialog" aria-modal="true" aria-labelledby="create-room-title">
            <form className="discover-create-screen__shell" onSubmit={handleSubmitForm}>
                <header className="discover-create-screen__header">
                    <button type="button" className="discover-create-screen__back" onClick={onClose}>
                        <ArrowLeft size={20} strokeWidth={2} />
                    </button>
                    <h2 id="create-room-title">Create Room</h2>
                    <button
                        type="submit"
                        className="discover-create-screen__submit"
                        disabled={createDisabled}
                    >
                        {submitting ? (
                            <>
                                <InlineSpinner size="sm" tone="light" label="Creating room" />
                                <span>Creating...</span>
                            </>
                        ) : "Create"}
                    </button>
                </header>

                <div className="discover-create-screen__content">
                    <section className="discover-create-screen__intro">
                        <span className="discover-create-screen__eyebrow">Create Circle</span>
                        <h3>
                            Start a new <em>anonymous</em> space
                        </h3>
                    </section>

                    {/* Room Title */}
                    <label className="discover-create-screen__field">
                        <div className="discover-create-screen__field-head">
                            <span>Circle title</span>
                            <small>Name</small>
                        </div>
                        <input
                            type="text"
                            value={roomTitle}
                            onChange={(event) => onRoomTitleChange(event.target.value)}
                            placeholder="Late Night Musings"
                            maxLength={roomTitleLimit}
                            aria-invalid={createErrors.roomTitle ? "true" : "false"}
                        />
                        <InlineError error={createErrors.roomTitle} className="discover-create-screen__error" />
                        <div className="discover-create-screen__field-meta">
                            <small>Keep it short and clear.</small>
                            <small>{String(roomTitle || "").length}/{roomTitleLimit}</small>
                        </div>
                    </label>

                    {/* Description */}
                    <label className="discover-create-screen__field">
                        <div className="discover-create-screen__field-head">
                            <span>Description</span>
                            <small>Optional</small>
                        </div>
                        <textarea
                            value={roomDescription}
                            onChange={(event) => onRoomDescriptionChange(event.target.value)}
                            placeholder="What is this room about?"
                            maxLength={roomDescriptionLimit}
                        />
                        <div className="discover-create-screen__field-meta">
                            <small>Add a short context line.</small>
                            <small>{String(roomDescription || "").length}/{roomDescriptionLimit}</small>
                        </div>
                    </label>

                    {/* Category */}
                    <div className="discover-create-screen__field" ref={dropdownRef}>
                        <div className="discover-create-screen__field-head">
                            <span>Category</span>
                            <small>Choose one</small>
                        </div>
                        <div className="discover-create-screen__custom-select">
                            <button
                                type="button"
                                className={`discover-create-screen__select-trigger${categoryOpen ? " is-open" : ""}`}
                                onClick={() => setCategoryOpen((prev) => !prev)}
                                aria-haspopup="listbox"
                                aria-expanded={categoryOpen}
                            >
                                <span className={roomCategory ? "is-selected" : "is-placeholder"}>
                                    {roomCategory || "Select a category"}
                                </span>
                                <ChevronDown size={18} className={`discover-create-screen__chevron${categoryOpen ? " is-open" : ""}`} />
                            </button>

                            {categoryOpen && (
                                <div className="discover-create-screen__dropdown" role="listbox">
                                    {ROOM_CATEGORIES.map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            role="option"
                                            aria-selected={roomCategory === category}
                                            className={`discover-create-screen__dropdown-item${roomCategory === category ? " is-active" : ""}`}
                                            onClick={() => {
                                                onRoomCategoryChange(category);
                                                setCategoryOpen(false);
                                            }}
                                        >
                                            <span>{category}</span>
                                            {roomCategory === category && <Check size={16} strokeWidth={2.5} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <InlineError error={createErrors.roomCategory} className="discover-create-screen__error" />
                    </div>

                    {/* Cover Image Picker — appears after category is chosen */}
                    {roomCategory && categoryImages.length > 0 && (
                        <div className="discover-create-screen__image-picker">
                            <div className="discover-create-screen__image-picker-head">
                                <ImageIcon size={14} className="discover-create-screen__image-picker-icon" />
                                <span>Pick a cover image</span>
                                {selectedAmbienceId && (
                                    <span className="discover-create-screen__image-picker-badge">Selected</span>
                                )}
                            </div>
                            <div className="discover-create-screen__image-strip">
                                {categoryImages.map((item) => {
                                    const isSelected = selectedAmbienceId === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`discover-create-screen__image-tile${isSelected ? " is-selected" : ""}`}
                                            onClick={() => setSelectedAmbienceId(item.id)}
                                            aria-label={`Select ${item.label}`}
                                            aria-pressed={isSelected}
                                        >
                                            <img
                                                src={item.image}
                                                alt={item.label}
                                                className="discover-create-screen__image-tile-img"
                                                loading="lazy"
                                            />
                                            {isSelected && (
                                                <span className="discover-create-screen__image-tile-check">
                                                    <Check size={14} strokeWidth={3} />
                                                </span>
                                            )}
                                            <span className="discover-create-screen__image-tile-label">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Privacy */}
                    <section className="discover-create-screen__section">
                        <div className="discover-create-screen__section-head">
                            <h3>Privacy</h3>
                        </div>
                        <div className="discover-create-screen__privacy-list">
                            <button
                                type="button"
                                className={`discover-create-screen__option${roomType === "public" ? " is-selected" : ""}`}
                                onClick={() => onRoomTypeChange("public")}
                            >
                                <span className="discover-create-screen__option-icon">
                                    <Globe size={20} strokeWidth={2} />
                                </span>
                                <span className="discover-create-screen__option-copy">
                                    <strong>Fume Circle</strong>
                                    <small>Anyone can join.</small>
                                </span>
                                {roomType === "public" && (
                                    <span className="discover-create-screen__option-check">
                                        <Check size={18} strokeWidth={2.5} />
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                className={`discover-create-screen__option${roomType === "private" ? " is-selected" : ""}`}
                                onClick={() => onRoomTypeChange("private")}
                            >
                                <span className="discover-create-screen__option-icon">
                                    <Lock size={20} strokeWidth={2} />
                                </span>
                                <span className="discover-create-screen__option-copy">
                                    <strong>Inner Circle</strong>
                                    <small>Join with a code.</small>
                                </span>
                                {roomType === "private" && (
                                    <span className="discover-create-screen__option-check">
                                        <Check size={18} strokeWidth={2.5} />
                                    </span>
                                )}
                            </button>
                        </div>
                    </section>

                    {/* Join Code (private only) */}
                    {roomType === "private" && (
                        <label className="discover-create-screen__field">
                            <div className="discover-create-screen__field-head">
                                <span>Join code</span>
                                <small>6 digits</small>
                            </div>
                            <div className="discover-create-screen__code-row">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={joinCode}
                                    onChange={(event) => onJoinCodeChange(event.target.value)}
                                    placeholder="Enter a 6 digit code"
                                    maxLength={6}
                                    aria-invalid={createErrors.joinCode ? "true" : "false"}
                                />
                                <button
                                    type="button"
                                    className="discover-create-screen__code-generate"
                                    onClick={onGenerateJoinCode}
                                    aria-label="Generate join code"
                                >
                                    <RefreshCcw size={18} strokeWidth={2} />
                                    <span>Generate</span>
                                </button>
                            </div>
                            <InlineError error={createErrors.joinCode} className="discover-create-screen__error" />
                            <div className="discover-create-screen__field-meta">
                                <small>Enter or generate a code.</small>
                                <small>{String(joinCode || "").length}/6</small>
                            </div>
                        </label>
                    )}

                    <div className="discover-create-screen__footer">
                        <p className="discover-create-screen__footer-note">
                            {roomType === "private"
                                ? "Only invited people can join."
                                : "This room will appear in Discover."}
                        </p>
                        <button
                            type="submit"
                            className="discover-create-screen__submit discover-create-screen__submit--primary"
                            disabled={createDisabled}
                        >
                            {submitting ? (
                                <>
                                    <InlineSpinner size="sm" tone="light" label="Creating room" />
                                    <span>Creating room...</span>
                                </>
                            ) : "Create room"}
                        </button>
                    </div>
                </div>
            </form>
        </div>,
        document.body
    );
}
