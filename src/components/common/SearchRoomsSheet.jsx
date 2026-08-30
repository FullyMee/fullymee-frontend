import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, Search, X, User } from "lucide-react";
import { AmbienceRoomCard } from "./MobileRoomVisuals.jsx";
import SearchUserCard from "../../features/search/components/SearchUserCard.jsx";
import { getAllUsers } from "../../services/auth.service.js";
import "../../features/search/search.css";
import "./SearchRoomsSheet.css";

const EMPTY_ARRAY = [];

function SearchRoomsSheetInner({
    onClose,
    rooms = EMPTY_ARRAY,
    people = EMPTY_ARRAY,
    initialTab = "rooms",
    scope = "home", // "home" | "confessions" | "global"
    onSelectRoom,
    onSelectPerson,
    onRemovePerson,
    busyKey = ""
}) {
    const [activeTab, setActiveTab] = useState(initialTab || "rooms");
    const [query, setQuery] = useState("");
    const [livePeople, setLivePeople] = useState(EMPTY_ARRAY);
    const [loadingPeople, setLoadingPeople] = useState(false);
    const searchTimerRef = useRef(null);

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const normalizedQuery = query.trim().toLowerCase();

    // Filter circles by title, description, or category (partial, full, slug, and multi-token matches)
    const filteredRooms = useMemo(() => {
        if (!normalizedQuery) return EMPTY_ARRAY;
        const cleanQuery = normalizedQuery.replace(/[\s_\-]+/g, "");
        const tokens = normalizedQuery.split(/[\s_\-&]+/).filter((t) => t.length > 0 && t !== "and");

        return rooms
            .filter((room) => scope === "confessions" || (room && room.roomType !== "private" && !room.isPrivate))
            .filter((room) => {
                const title = String(room?.title || room?.roomTitle || "").toLowerCase();
                const desc = String(room?.description || "").toLowerCase();
                const category = String(room?.category || "").toLowerCase();
                const categorySpaced = category.replace(/_/g, " ");
                const cleanCategory = category.replace(/[\s_\-]+/g, "");

                const directMatch =
                    title.includes(normalizedQuery) ||
                    desc.includes(normalizedQuery) ||
                    category.includes(normalizedQuery) ||
                    categorySpaced.includes(normalizedQuery) ||
                    cleanCategory.includes(cleanQuery);

                if (directMatch) return true;

                if (tokens.length > 0) {
                    const categoryTokensMatch = tokens.every((token) => cleanCategory.includes(token));
                    if (categoryTokensMatch) return true;

                    const combinedHaystack = `${title} ${desc} ${categorySpaced}`.toLowerCase();
                    const allTokensMatch = tokens.every((token) => combinedHaystack.includes(token));
                    if (allTokensMatch) return true;
                }

                return false;
            });
    }, [rooms, normalizedQuery, scope]);

    // Live search for people when activeTab is "people" and query is present
    useEffect(() => {
        let isCancelled = false;

        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        if (activeTab !== "people" || !normalizedQuery) {
            setLivePeople(EMPTY_ARRAY);
            setLoadingPeople(false);
            return () => {
                isCancelled = true;
            };
        }

        setLoadingPeople(true);
        searchTimerRef.current = setTimeout(async () => {
            try {
                const res = await getAllUsers({ search: normalizedQuery, limit: 20, paginate: true });
                if (isCancelled) return;
                const items = Array.isArray(res) ? res : (res && Array.isArray(res.items) ? res.items : []);
                setLivePeople(items);
            } catch {
                if (isCancelled) return;
                // Fallback to local filter if API fails
                const local = (people || []).filter((p) => {
                    const uname = String(p?.username || "").toLowerCase();
                    return uname.includes(normalizedQuery);
                });
                setLivePeople(local);
            } finally {
                if (!isCancelled) {
                    setLoadingPeople(false);
                }
            }
        }, 300);

        return () => {
            isCancelled = true;
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, [activeTab, normalizedQuery]);

    const isPeopleTab = activeTab === "people";
    const displayedPeople = normalizedQuery ? livePeople : (people || EMPTY_ARRAY);
    const circlesCount = normalizedQuery ? filteredRooms.length : (rooms?.length || 0);
    const peopleCount = displayedPeople.length || 0;

    const placeholderText = isPeopleTab
        ? "Search people by username..."
        : (scope === "confessions"
            ? "Explore your joined circles..."
            : "Explore circles by name, topic or feeling...");

    const headerTitle = isPeopleTab ? "Explore People" : "Explore Circles";

    return (
        <div className="search-sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={headerTitle}>
            <div className="search-sheet-panel" onClick={(e) => e.stopPropagation()}>
                {/* Drag handle */}
                <div className="search-sheet-handle-bar" aria-hidden="true">
                    <span className="search-sheet-handle-pill" />
                </div>

                {/* Header */}
                <header className="search-sheet-header">
                    <button
                        type="button"
                        className="search-sheet-close-btn"
                        onClick={onClose}
                        aria-label="Close explore"
                    >
                        <ChevronDown size={24} strokeWidth={2} />
                    </button>
                    <h2 className="search-sheet-title">{headerTitle}</h2>
                </header>

                {/* Search Bar */}
                <div className="search-sheet-input-wrapper">
                    <div className="search-sheet-input-field">
                        <Search size={19} className="search-sheet-input-icon" aria-hidden="true" />
                        <input
                            type="text"
                            inputMode="search"
                            maxLength={100}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={placeholderText}
                            autoFocus
                        />
                        {query && (
                            <button
                                type="button"
                                className="search-sheet-clear-btn"
                                onClick={() => setQuery("")}
                                aria-label="Clear search"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Tab pills inside sheet when not in confessions-only scope */}
                    {scope !== "confessions" && (
                        <div className="search-pills" style={{ marginTop: "0.75rem", marginBottom: 0, paddingLeft: 0 }}>
                            <button
                                type="button"
                                className={`search-pill${activeTab === "rooms" ? " is-active" : ""}`}
                                onClick={() => setActiveTab("rooms")}
                            >
                                All Circles ({circlesCount})
                            </button>
                            <button
                                type="button"
                                className={`search-pill${activeTab === "people" ? " is-active" : ""}`}
                                onClick={() => setActiveTab("people")}
                            >
                                People ({peopleCount})
                            </button>
                        </div>
                    )}
                </div>

                {/* Body Content */}
                <div className="search-sheet-body">
                    {/* CIRCLES TAB CONTENT */}
                    {!isPeopleTab && (
                        <>
                            {/* Initial State (no query) */}
                            {!normalizedQuery && (
                                <div className="search-sheet-empty-state">
                                    <div className="search-sheet-icon-circle">
                                        <Search size={28} strokeWidth={1.8} />
                                    </div>
                                    <h3>Find a circle</h3>
                                    <p>{scope === "confessions" ? "Start typing to search your joined circles." : "Start typing to search circles across FullyMee."}</p>
                                </div>
                            )}

                            {/* Filtered Rooms List */}
                            {normalizedQuery && filteredRooms.length > 0 && (
                                <div className="search-results-list search-sheet-rooms-grid">
                                    {filteredRooms.map((room) => (
                                        <AmbienceRoomCard
                                            key={room.roomId || room.id}
                                            room={room}
                                            isJoined={scope === "confessions"}
                                            onAction={(targetRoom) => {
                                                if (onSelectRoom) {
                                                    onSelectRoom(targetRoom);
                                                } else {
                                                    onClose();
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* No Matches Found */}
                            {normalizedQuery && filteredRooms.length === 0 && (
                                <div className="search-sheet-empty-state">
                                    <div className="search-sheet-icon-circle">
                                        <Search size={28} strokeWidth={1.8} />
                                    </div>
                                    <h3>No circles found</h3>
                                    <p>No circles match "{query}". Try searching for another topic or feeling.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* PEOPLE TAB CONTENT */}
                    {isPeopleTab && (
                        <>
                            {loadingPeople && (
                                <div className="search-sheet-empty-state" style={{ padding: "2rem 1.5rem" }}>
                                    <p>Searching people...</p>
                                </div>
                            )}

                            {!loadingPeople && !normalizedQuery && displayedPeople.length === 0 && (
                                <div className="search-sheet-empty-state">
                                    <div className="search-sheet-icon-circle">
                                        <User size={28} strokeWidth={1.8} />
                                    </div>
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
                                            onRemove={(p) => onRemovePerson && onRemovePerson(p)}
                                            onClickCard={(p) => {
                                                if (onSelectPerson) {
                                                    onSelectPerson(p);
                                                } else {
                                                    onClose();
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {!loadingPeople && normalizedQuery && displayedPeople.length === 0 && (
                                <div className="search-sheet-empty-state">
                                    <div className="search-sheet-icon-circle">
                                        <User size={28} strokeWidth={1.8} />
                                    </div>
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

export default function SearchRoomsSheet({
    isOpen,
    ...props
}) {
    if (!isOpen) return null;
    return <SearchRoomsSheetInner {...props} />;
}

