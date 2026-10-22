import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, Search, User, X } from "lucide-react";
import { AmbienceRoomCard } from "./MobileRoomVisuals.jsx";
import SearchUserCard from "../../features/search/components/SearchUserCard.jsx";
import { getAllUsers } from "../../services/auth.service.js";
import { getPublicRooms } from "../../services/confession.service.js";
import { RoomSkeleton, ConnectionSkeleton } from "../loaders";
import "../../features/search/search.css";
import "./SearchRoomsSheet.css";

const EMPTY = [];

function useDebouncedSearch(enabled, fetchFn, delay = 250) {
    const [results, setResults] = useState(EMPTY);
    const [loading, setLoading] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        clearTimeout(timerRef.current);
        if (!enabled) { setResults(EMPTY); setLoading(false); return; }
        setLoading(true);
        let cancelled = false;
        timerRef.current = setTimeout(async () => {
            try {
                const data = await fetchFn();
                if (!cancelled) setResults(data);
            } catch {
                if (!cancelled) setResults(EMPTY);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, delay);
        return () => { cancelled = true; clearTimeout(timerRef.current); };
    }, [enabled, fetchFn, delay]);

    return { results, loading };
}

function SearchRoomsSheetInner({
    onClose, rooms = EMPTY, people = EMPTY,
    initialTab = "rooms", scope = "home",
    onSelectRoom, onSelectPerson, onRemovePerson, busyKey = ""
}) {
    const [activeTab, setActiveTab] = useState(initialTab || "rooms");
    const [query, setQuery] = useState("");

    useEffect(() => { if (initialTab) setActiveTab(initialTab); }, [initialTab]);
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const normalizedQuery = query.trim().toLowerCase();
    const isPeopleTab = activeTab === "people";

    // Local filter for confessions scope
    const filteredRooms = useMemo(() => {
        if (!normalizedQuery) return EMPTY;
        const cleanQ = normalizedQuery.replace(/[\s_-]+/g, "");
        const tokens = normalizedQuery.split(/[\s_& -]+/).filter((t) => t.length > 0 && t !== "and");
        return rooms
            .filter((r) => scope === "confessions" || (r?.roomType !== "private" && !r?.isPrivate))
            .filter((r) => {
                const title = String(r?.title || r?.roomTitle || "").toLowerCase();
                const desc = String(r?.description || "").toLowerCase();
                const cat = String(r?.category || "").toLowerCase();
                const catSpace = cat.replace(/_/g, " ");
                const catClean = cat.replace(/[\s_-]+/g, "");
                if (title.includes(normalizedQuery) || desc.includes(normalizedQuery) || catSpace.includes(normalizedQuery) || catClean.includes(cleanQ)) return true;
                const hay = `${title} ${desc} ${catSpace}`;
                return tokens.length > 0 && tokens.every((t) => hay.includes(t));
            });
    }, [rooms, normalizedQuery, scope]);

    // Server room search
    const roomFetch = useMemo(() => async () => {
        const res = await getPublicRooms({ search: normalizedQuery, limit: 30, paginate: true, sortBy: "discover" });
        return Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
    }, [normalizedQuery]);
    const { results: liveRooms, loading: loadingRooms } = useDebouncedSearch(
        scope !== "confessions" && Boolean(normalizedQuery), roomFetch
    );

    // Server people search
    const peopleFetch = useMemo(() => async () => {
        const clean = normalizedQuery.replace(/^@+/, "").trim();
        if (!clean) return EMPTY;
        const res = await getAllUsers({ search: clean, limit: 20, paginate: true });
        return Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
    }, [normalizedQuery]);
    const { results: livePeople, loading: loadingPeople } = useDebouncedSearch(
        isPeopleTab && Boolean(normalizedQuery), peopleFetch
    );

    const displayedRooms = scope === "confessions" ? filteredRooms : (normalizedQuery ? liveRooms : rooms);
    const displayedPeople = normalizedQuery ? livePeople : people;
    const circlesCount = loadingRooms ? "..." : displayedRooms.length;
    const peopleCount  = loadingPeople ? "..." : displayedPeople.length;

    const placeholderText = isPeopleTab
        ? "Search people by username..."
        : (scope === "confessions" ? "Explore your joined circles..." : "Explore circles by name, topic or feeling...");
    const headerTitle = isPeopleTab ? "Explore People" : "Explore Circles";

    return (
        <div className="search-sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={headerTitle}>
            <div className="search-sheet-panel" onClick={(e) => e.stopPropagation()}>
                <div className="search-sheet-handle-bar" aria-hidden="true">
                    <span className="search-sheet-handle-pill" />
                </div>

                <header className="search-sheet-header">
                    <button type="button" className="search-sheet-close-btn" onClick={onClose} aria-label="Close explore">
                        <ChevronDown size={24} strokeWidth={2} />
                    </button>
                    <h2 className="search-sheet-title">{headerTitle}</h2>
                </header>

                <div className="search-sheet-input-wrapper">
                    <div className="search-sheet-input-field">
                        <Search size={19} className="search-sheet-input-icon" aria-hidden="true" />
                        <input
                            type="text" inputMode="search" maxLength={100}
                            value={query} onChange={(e) => setQuery(e.target.value)}
                            placeholder={placeholderText} autoFocus
                        />
                        {query && (
                            <button type="button" className="search-sheet-clear-btn" onClick={() => setQuery("")} aria-label="Clear search">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {scope !== "confessions" && (
                        <div className="search-pills" style={{ marginTop: "0.75rem", marginBottom: 0, paddingLeft: 0 }}>
                            <button type="button" className={`search-pill${activeTab === "rooms" ? " is-active" : ""}`} onClick={() => setActiveTab("rooms")}>
                                All Circles ({circlesCount})
                            </button>
                            <button type="button" className={`search-pill${activeTab === "people" ? " is-active" : ""}`} onClick={() => setActiveTab("people")}>
                                People ({peopleCount})
                            </button>
                        </div>
                    )}
                </div>

                <div className="search-sheet-body">
                    {/* CIRCLES TAB */}
                    {!isPeopleTab && (
                        <>
                            {!normalizedQuery && (
                                <div className="search-sheet-empty-state">
                                    <div className="search-sheet-icon-circle"><Search size={28} strokeWidth={1.8} /></div>
                                    <h3>Find a circle</h3>
                                    <p>{scope === "confessions" ? "Start typing to search your joined circles." : "Start typing to search circles across FullyMee."}</p>
                                </div>
                            )}
                            {loadingRooms && <div style={{ padding: "0.5rem 0" }}><RoomSkeleton count={4} /></div>}
                            {!loadingRooms && normalizedQuery && displayedRooms.length > 0 && (
                                <div className="search-results-list search-sheet-rooms-grid">
                                    {displayedRooms.map((room) => (
                                        <AmbienceRoomCard
                                            key={room.roomId || room.id}
                                            room={room}
                                            isJoined={scope === "confessions"}
                                            onAction={(r) => { if (onSelectRoom) onSelectRoom(r); else onClose(); }}
                                        />
                                    ))}
                                </div>
                            )}
                            {!loadingRooms && normalizedQuery && displayedRooms.length === 0 && (
                                <div className="search-sheet-empty-state">
                                    <div className="search-sheet-icon-circle"><Search size={28} strokeWidth={1.8} /></div>
                                    <h3>No circles found</h3>
                                    <p>No circles match "{query}". Try searching for another topic or feeling.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* PEOPLE TAB */}
                    {isPeopleTab && (
                        <>
                            {loadingPeople && <div style={{ padding: "0.5rem 0" }}><ConnectionSkeleton count={4} /></div>}
                            {!loadingPeople && !normalizedQuery && displayedPeople.length === 0 && (
                                <div className="search-sheet-empty-state">
                                    <div className="search-sheet-icon-circle"><User size={28} strokeWidth={1.8} /></div>
                                    <h3>Search people</h3>
                                    <p>Type a username to discover and connect with people.</p>
                                </div>
                            )}
                            {!loadingPeople && displayedPeople.length > 0 && (
                                <div className="search-results-list search-results-list--people">
                                    {displayedPeople.map((person) => (
                                        <SearchUserCard
                                            key={person.id || person.userId}
                                            person={person}
                                            isBusy={busyKey === `person-${person.id || person.userId}`}
                                            onRemove={!normalizedQuery && onRemovePerson ? (p) => onRemovePerson(p) : undefined}
                                            onClickCard={(p) => { if (onSelectPerson) onSelectPerson(p); else onClose(); }}
                                        />
                                    ))}
                                </div>
                            )}
                            {!loadingPeople && normalizedQuery && displayedPeople.length === 0 && (
                                <div className="search-sheet-empty-state">
                                    <div className="search-sheet-icon-circle"><User size={28} strokeWidth={1.8} /></div>
                                    <h3>No people found</h3>
                                    <p>No users match "{query}". Try searching for a different username.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SearchRoomsSheet({ isOpen, ...props }) {
    if (!isOpen) return null;
    return <SearchRoomsSheetInner {...props} />;
}
