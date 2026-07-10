import { useMemo } from "react";
import { Activity, Heart, Shield, Sparkles, Users } from "lucide-react";

function formatCompactPulseCount(value) {
    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(Number(value) || 0);
}

export default function CommunityHubRail({
    activeRooms = 0,
    confessionsToday = 0,
    supportGiven = 0,
    activeRoomsLabel = "Active Rooms",
    suggestionsLabel = "Suggested for you",
    rooms = [],
    fallbackRooms = [],
    onJoinRoom = null,
    showFooter = false,
    emptyMessage = ""
}) {
    const suggestions = useMemo(() => {
        const base = Array.isArray(rooms) ? rooms.slice(0, 4) : [];
        if (base.length >= 4) return base;

        const next = [...base];
        for (const room of (Array.isArray(fallbackRooms) ? fallbackRooms : [])) {
            if (next.length >= 4) break;
            next.push(room);
        }
        return next;
    }, [fallbackRooms, rooms]);

    return (
        <aside className="home-right-rail" aria-label="Community stats and suggestions">
            <section className="home-rail-card home-rail-card--pulse">
                <h2>Community Pulse</h2>
                <div className="home-pulse-list">
                    <div className="home-pulse-item">
                        <span className="home-pulse-item__icon home-pulse-item__icon--peach"><Activity size={18} strokeWidth={2} /></span>
                        <div>
                            <strong>{formatCompactPulseCount(activeRooms)}</strong>
                            <span>{activeRoomsLabel}</span>
                        </div>
                    </div>
                    <div className="home-pulse-item">
                        <span className="home-pulse-item__icon home-pulse-item__icon--violet"><Users size={18} strokeWidth={2} /></span>
                        <div>
                            <strong>{formatCompactPulseCount(confessionsToday)}</strong>
                            <span>Confessions Today</span>
                        </div>
                    </div>
                    <div className="home-pulse-item">
                        <span className="home-pulse-item__icon home-pulse-item__icon--rose"><Heart size={18} strokeWidth={2} /></span>
                        <div>
                            <strong>{formatCompactPulseCount(supportGiven)}</strong>
                            <span>Support Given</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="home-rail-card">
                <div className="home-rail-card__head">
                    <h2>{suggestionsLabel}</h2>
                </div>
                <div className="home-suggestion-list">
                    {suggestions.length > 0 ? suggestions.map((room, index) => (
                        <div key={room.roomId || `${room.title}-${index}`} className="home-suggestion-item">
                            <div className="home-suggestion-item__icon home-suggestion-item__icon--general" aria-hidden="true">
                                <Sparkles size={18} strokeWidth={2} />
                            </div>
                            <div className="home-suggestion-item__copy">
                                <strong>{room.title || "Untitled room"}</strong>
                                <span>{`${(Number(room && room.currentUserCount) || 0).toLocaleString()} members`}</span>
                            </div>
                            {onJoinRoom ? (
                                <button
                                    type="button"
                                    className="home-suggestion-item__join"
                                    onClick={() => onJoinRoom(room)}
                                >
                                    Join
                                </button>
                            ) : (
                                <button type="button" className="home-suggestion-item__join">
                                    Join
                                </button>
                            )}
                        </div>
                    )) : (
                        <div className="home-rail-empty">
                            {emptyMessage || "Join more rooms to unlock better suggestions."}
                        </div>
                    )}
                </div>
            </section>

            <section className="home-rail-card home-rail-card--safety">
                <div className="home-safety-card__icon" aria-hidden="true">
                    <Shield size={18} strokeWidth={2} />
                </div>
                <h2>Safety First</h2>
                <p>Your identity stays yours. Always. We never share your data, and direct messages are opt-in only.</p>
            </section>

            {showFooter && (
                <footer className="home-rail-footer">
                    <span>&copy; 2026 Confide App</span>
                    <div>
                        <a href="#privacy">Privacy</a>
                        <a href="#terms">Terms</a>
                        <a href="#guidelines">Guidelines</a>
                    </div>
                </footer>
            )}
        </aside>
    );
}
