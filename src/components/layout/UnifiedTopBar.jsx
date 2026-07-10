import { Bell, Plus, Search } from "lucide-react";

export default function UnifiedTopBar({
    value,
    onChange,
    placeholder = "Search rooms, people, or feelings...",
    onSubmit,
    onNotificationsClick,
    onPrimaryClick,
    primaryLabel = "Create Room",
    className = ""
}) {
    return (
        <header className={`home-topbar${className ? ` ${className}` : ""}`}>
            <form className="home-searchbar" onSubmit={onSubmit}>
                <span className="home-searchbar__icon" aria-hidden="true">
                    <Search size={18} strokeWidth={2} />
                </span>
                <input
                    type="search"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                />
            </form>

            <button
                type="button"
                className="home-topbar__icon-button"
                onClick={onNotificationsClick}
                aria-label="Open notifications"
            >
                <Bell size={18} strokeWidth={2} />
                <span className="home-topbar__dot" aria-hidden="true" />
            </button>

            <button
                type="button"
                className="home-topbar__primary"
                onClick={onPrimaryClick}
            >
                <Plus size={18} strokeWidth={2} />
                <span>{primaryLabel}</span>
            </button>
        </header>
    );
}
