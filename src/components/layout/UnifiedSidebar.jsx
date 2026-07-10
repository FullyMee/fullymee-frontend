import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import { RoomGlyphIcon, getRoomTone } from "../../components/common/MobileRoomVisuals.jsx";
import { getInitial } from "../../utils/presentation.js";
import { CircleUser, Home, MessageCircle, MessageSquareQuote, Search } from "lucide-react";

const DEFAULT_NAV_ITEMS = [
    { key: "home", label: "Home", to: "/" },
    { key: "confessions", label: "Confessions", to: "/confessions" },
    { key: "messages", label: "Messages", to: "/chats" },
    { key: "search", label: "Search", to: "/search" },
    { key: "profile", label: "Profile", to: "/profile" }
];

function getNavIcon(key) {
    if (key === "home") return Home;
    if (key === "confessions") return MessageSquareQuote;
    if (key === "messages") return MessageCircle;
    if (key === "search") return Search;
    return CircleUser;
}

function isNavActive(pathname, item) {
    if (item.to === "/") return pathname === "/";
    return pathname === item.to || pathname.startsWith(`${item.to}?`) || pathname.startsWith(`${item.to}/`);
}

export default function UnifiedSidebar({
    navItems = DEFAULT_NAV_ITEMS,
    rooms = [],
    selectedRoomId = 0,
    onSelectRoom = null,
    pendingMessageCount = 0,
    browsingAsLabel = "Browsing as",
    identityActionLabel = "Shuffle Identity",
    identityProfileTo = "/profile"
}) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const displayName = String((user && user.username) || "Quiet Fox").trim() || "Quiet Fox";
    const displayAvatar = String((user && user.avatar) || "").trim() || getInitial(displayName, "Q");

    return (
        <aside className="home-desktop-sidebar desktop-app-shell__sidebar">
            <div className="home-brand">
                <div className="home-brand__mark" aria-hidden="true">
                    <MessageSquareQuote size={20} strokeWidth={2} />
                </div>
                <div className="home-brand__copy">
                    <strong>FullyMe</strong>
                    
                </div>
            </div>

            <nav className="home-nav" aria-label="Primary navigation">
                {navItems.map((item) => {
                    const Icon = getNavIcon(item.key);
                    const active = isNavActive(location.pathname, item);

                    return (
                        <Link
                            key={item.key}
                            to={item.key === "messages" ? "/chats?requests=1" : item.to}
                            className={`home-nav__item${active ? " is-active" : ""}`}
                            aria-current={active ? "page" : undefined}
                        >
                            <span className="home-nav__icon">
                                <Icon size={20} strokeWidth={2} />
                            </span>
                            <span>{item.label}</span>
                            {item.key === "messages" && pendingMessageCount > 0 && (
                                <span className="home-nav__badge">{pendingMessageCount > 9 ? "9+" : pendingMessageCount}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <section className="home-sidebar-section">
                <div className="home-sidebar-section__head">
                    <h2>My Rooms</h2>
                </div>
                <div className="home-room-stack">
                    {rooms.length > 0 ? rooms.map((room) => {
                        const tone = getRoomTone(room);
                        return (
                            <button
                                key={room.roomId}
                                type="button"
                                className="home-room-pill"
                                onClick={() => typeof onSelectRoom === "function" && onSelectRoom(room)}
                            >
                                <span className={`home-room-pill__icon home-room-pill__icon--${tone}`} aria-hidden="true">
                                    <RoomGlyphIcon tone={tone} />
                                </span>
                                <span className="home-room-pill__copy">{room.title || "Untitled room"}</span>
                                <span className="home-room-pill__dot" aria-hidden="true" />
                            </button>
                        );
                    }) : (
                        <div className="home-room-empty">Join rooms to see them here.</div>
                    )}
                </div>
            </section>

            <button
                type="button"
                className="home-identity-card"
                onClick={() => navigate(identityProfileTo)}
            >
                <span className="home-identity-card__avatar" aria-hidden="true">{displayAvatar}</span>
                <span className="home-identity-card__copy">
                    <span className="home-identity-card__eyebrow">{browsingAsLabel}</span>
                    <strong>{displayName}</strong>
                    <span className="home-identity-card__action">{identityActionLabel}</span>
                </span>
            </button>
        </aside>
    );
}
