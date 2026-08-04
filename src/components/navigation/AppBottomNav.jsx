import { Link, useLocation } from "react-router-dom";
import { CircleUser, Home, MessageCircle, MessageSquareQuote, Search } from "lucide-react";
import useAuth from "../../hooks/useAuth.js";

const NAV_ITEMS = [
    { to: "/", label: "Home", icon: Home },
    { to: "/confessions", label: "Confessions", icon: MessageSquareQuote },
    { to: "/chats", label: "Messages", icon: MessageCircle },
    { to: "/search", label: "Search", icon: Search },
    { to: "/profile", label: "Profile", icon: CircleUser }
];

export default function AppBottomNav() {
    const location = useLocation();
    const { user } = useAuth();
    
    // Check if user has an avatar
    const displayAvatar = String((user && (user.preferences?.avatar || user.avatar)) || "").trim();

    return (
        <nav className="discover-bottom-nav" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                const isProfile = item.to === "/profile";
                const showAvatar = isProfile && displayAvatar;

                return (
                    <Link
                        key={item.to}
                        to={item.to}
                        aria-current={isActive ? "page" : undefined}
                        className={`discover-bottom-nav__item${isActive ? " is-active" : ""}`}
                    >
                        <div className="discover-bottom-nav__icon-wrapper">
                            {showAvatar ? (
                                <span style={{ fontSize: '20px', lineHeight: 1 }}>{displayAvatar}</span>
                            ) : (
                                <Icon size={22} strokeWidth={2} />
                            )}
                        </div>
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
