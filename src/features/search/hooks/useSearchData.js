import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getJoinedRooms, getPublicRooms } from "../../../services/confession.service";
import { getAllUsers } from "../../../services/auth.service";

export function getRecentPeople(userId) {
    if (!userId) return [];
    try {
        const stored = localStorage.getItem(`recent_people_${userId}`);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function removeRecentPerson(userId, personId) {
    if (!userId) return [];
    try {
        let people = getRecentPeople(userId);
        people = people.filter(p => p.id !== personId && p.userId !== personId);
        localStorage.setItem(`recent_people_${userId}`, JSON.stringify(people));
        return people;
    } catch {
        return [];
    }
}

export function addRecentPerson(userId, person) {
    if (!userId || !person) return [];
    try {
        let people = getRecentPeople(userId);
        const pid = person.id || person.userId;
        people = people.filter(p => p.id !== pid && p.userId !== pid);
        people.unshift(person);
        if (people.length > 50) people = people.slice(0, 50);
        localStorage.setItem(`recent_people_${userId}`, JSON.stringify(people));
        return people;
    } catch {
        return [];
    }
}

const PAGE_SIZE = 10;

function uniqueRooms(items) {
    const seen = new Set();
    const next = [];

    for (const item of Array.isArray(items) ? items : []) {
        const roomId = Number(item && item.roomId);
        if (!roomId || Number.isNaN(roomId) || seen.has(roomId)) continue;
        seen.add(roomId);
        next.push(item);
    }

    return next;
}

function normalizePagedResult(payload, limit) {
    if (Array.isArray(payload)) {
        return {
            items: payload,
            hasMore: payload.length >= limit
        };
    }

    const items = Array.isArray(payload && payload.items) ? payload.items : [];
    return {
        items,
        hasMore: !!(payload && payload.hasMore)
    };
}

export function useSearchData(user, query) {
    const [joinedRooms, setJoinedRooms] = useState([]);
    const [roomResults, setRoomResults] = useState(() => {
        try {
            const cached = sessionStorage.getItem("fm_cached_search_rooms");
            const parsed = cached ? JSON.parse(cached) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });
    const [peopleResults, setPeopleResults] = useState(() => {
        try {
            const cached = sessionStorage.getItem("fm_cached_search_people");
            const parsed = cached ? JSON.parse(cached) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(true);
    const [loadingMoreRooms, setLoadingMoreRooms] = useState(false);
    const [loadingMorePeople, setLoadingMorePeople] = useState(false);
    const [roomHasMore, setRoomHasMore] = useState(false);
    const [peopleHasMore, setPeopleHasMore] = useState(false);
    const [error, setError] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState(String(query || ""));
    const activeQueryRef = useRef("");

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedQuery(String(query || ""));
        }, 300);

        return () => window.clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        let cancelled = false;

        async function loadJoinedRooms() {
            try {
                const joined = await getJoinedRooms();
                if (cancelled) return;
                setJoinedRooms(Array.isArray(joined) ? joined : []);
            } catch {
                if (!cancelled) {
                    setJoinedRooms([]);
                }
            }
        }

        loadJoinedRooms();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const term = String(debouncedQuery || "").trim();
        activeQueryRef.current = term;

        async function loadSearchPage() {
            setLoading(true);
            setError("");
            setRoomHasMore(false);
            setPeopleHasMore(false);

            try {
                let roomsPayload, peoplePayload;
                
                if (!term) {
                    const userId = user && (user.id || user.userId);
                    const allRecent = getRecentPeople(userId);
                    roomsPayload = await getPublicRooms({
                        limit: PAGE_SIZE,
                        offset: 0,
                        sortBy: "discover",
                        search: term,
                        paginate: true
                    });
                    peoplePayload = { items: allRecent, hasMore: false };
                } else {
                    [roomsPayload, peoplePayload] = await Promise.all([
                        getPublicRooms({
                            limit: PAGE_SIZE,
                            offset: 0,
                            sortBy: "discover",
                            search: term,
                            paginate: true
                        }),
                        getAllUsers({
                            limit: PAGE_SIZE,
                            offset: 0,
                            search: term,
                            paginate: true
                        })
                    ]);
                }

                if (cancelled || activeQueryRef.current !== term) return;

                const roomsPage = normalizePagedResult(roomsPayload, PAGE_SIZE);
                const publicOnlyRooms = (roomsPage.items || []).filter(room => String(room && room.roomType || "").toLowerCase() === "public");
                const uniqueR = uniqueRooms(publicOnlyRooms);
                setRoomResults(uniqueR);
                try { sessionStorage.setItem("fm_cached_search_rooms", JSON.stringify(uniqueR)); } catch {}
                setRoomHasMore(roomsPage.hasMore);
                
                const peoplePage = normalizePagedResult(peoplePayload, PAGE_SIZE);
                const peopleList = peoplePage.items || [];
                setPeopleResults(peopleList);
                try { sessionStorage.setItem("fm_cached_search_people", JSON.stringify(peopleList)); } catch {}
                setPeopleHasMore(peoplePage.hasMore);
            } catch (err) {
                if (cancelled || activeQueryRef.current !== term) return;
                setRoomResults([]);
                setPeopleResults([]);
                setRoomHasMore(false);
                setPeopleHasMore(false);
                setError(err && err.message ? err.message : "Unable to load search right now.");
            } finally {
                if (!cancelled && activeQueryRef.current === term) {
                    setLoading(false);
                }
            }
        }

        loadSearchPage();
        return () => {
            cancelled = true;
        };
    }, [debouncedQuery]);

    const joinedRoomIds = useMemo(
        () => new Set((joinedRooms || []).map((room) => Number(room && room.roomId))),
        [joinedRooms]
    );

    const loadMoreRooms = useCallback(async () => {
        if (loadingMoreRooms || !roomHasMore) return;
        const term = activeQueryRef.current;
        const offset = roomResults.length;

        setLoadingMoreRooms(true);
        try {
            const payload = await getPublicRooms({
                limit: PAGE_SIZE,
                offset,
                sortBy: "discover",
                search: term,
                paginate: true
            });
            const page = normalizePagedResult(payload, PAGE_SIZE);
            const publicOnlyMore = (page.items || []).filter(room => String(room && room.roomType || "").toLowerCase() === "public");
            setRoomResults((prev) => uniqueRooms([...prev, ...publicOnlyMore]));
            setRoomHasMore(page.hasMore);
        } catch (err) {
            setError(err && err.message ? err.message : "Unable to load more rooms.");
        } finally {
            setLoadingMoreRooms(false);
        }
    }, [loadingMoreRooms, roomHasMore, roomResults.length]);

    const loadMorePeople = useCallback(async () => {
        if (loadingMorePeople || !peopleHasMore) return;
        const term = activeQueryRef.current;
        if (!term) return; // No more people to load for local history
        
        const offset = peopleResults.length;

        setLoadingMorePeople(true);
        try {
            const payload = await getAllUsers({
                limit: PAGE_SIZE,
                offset,
                search: term,
                paginate: true
            });
            const page = normalizePagedResult(payload, PAGE_SIZE);
            setPeopleResults((prev) => {
                const seen = new Set(prev.map(p => Number(p.id)));
                const next = [...prev];
                for (const item of (page.items || [])) {
                    const id = Number(item.id);
                    if (!seen.has(id)) {
                        seen.add(id);
                        next.push(item);
                    }
                }
                return next;
            });
            setPeopleHasMore(page.hasMore);
        } catch (err) {
            setError(err && err.message ? err.message : "Unable to load more people.");
        } finally {
            setLoadingMorePeople(false);
        }
    }, [loadingMorePeople, peopleHasMore, peopleResults.length]);

    const removePerson = useCallback((personId) => {
        const userId = user && (user.id || user.userId);
        if (!userId) return;
        removeRecentPerson(userId, personId);
        setPeopleResults(prev => prev.filter(p => p.id !== personId && p.userId !== personId));
    }, [user]);

    const addPersonToHistory = useCallback((person) => {
        const userId = user && (user.id || user.userId);
        if (!userId || !person) return;
        const updated = addRecentPerson(userId, person);
        // If no active search query, immediately reflect the new history in the list
        if (!activeQueryRef.current) {
            setPeopleResults(updated);
        }
    }, [user]);

    return {
        joinedRooms,
        setJoinedRooms,
        roomResults,
        peopleResults,
        loading,
        loadingMoreRooms,
        loadingMorePeople,
        roomHasMore,
        peopleHasMore,
        error,
        retryLoad: () => setDebouncedQuery(String(query || "")),
        joinedRoomIds,
        loadMoreRooms,
        loadMorePeople,
        removePerson,
        addPersonToHistory
    };
}
