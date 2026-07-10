import { Link, useLocation } from "react-router-dom";
import { CircleUser, Home, MessageCircle, MessageSquareQuote, Search } from "lucide-react";

const NAV_ITEMS = [
    { to: "/", label: "Home", icon: Home },
    { to: "/confessions", label: "Confessions", icon: MessageSquareQuote },
    { to: "/chats", label: "Messages", icon: MessageCircle },
    { to: "/search", label: "Search", icon: Search },
    { to: "/profile", label: "Profile", icon: CircleUser }
];

export default function AppBottomNav() {
    const location = useLocation();

    return (
        <nav className="discover-bottom-nav" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;

                return (
                    <Link
                        key={item.to}
                        to={item.to}
                        aria-current={isActive ? "page" : undefined}
                        className={`discover-bottom-nav__item${isActive ? " is-active" : ""}`}
                    >
                        <div className="discover-bottom-nav__icon-wrapper">
                            <Icon size={22} strokeWidth={2} />
                        </div>
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
