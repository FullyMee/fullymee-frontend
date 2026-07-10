import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getJoinedRooms, getPublicRooms } from "../../../services/confession.service";

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
    const [roomResults, setRoomResults] = useState([]);
    const [peopleResults, setPeopleResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMoreRooms, setLoadingMoreRooms] = useState(false);
    const [loadingMorePeople] = useState(false);
    const [roomHasMore, setRoomHasMore] = useState(false);
    const [peopleHasMore, setPeopleHasMore] = useState(false);
    const [error, setError] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState(String(query || ""));
    const activeQueryRef = useRef("");

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedQuery(String(query || ""));
        }, 250);

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
            setRoomResults([]);
            setPeopleResults([]);
            setRoomHasMore(false);
            setPeopleHasMore(false);

            try {
                const roomsPayload = await getPublicRooms({
                    limit: PAGE_SIZE,
                    offset: 0,
                    sortBy: "discover",
                    search: term,
                    paginate: true
                });

                if (cancelled || activeQueryRef.current !== term) return;

                const roomsPage = normalizePagedResult(roomsPayload, PAGE_SIZE);
                setRoomResults(uniqueRooms(roomsPage.items));
                setRoomHasMore(roomsPage.hasMore);
                setPeopleResults([]);
                setPeopleHasMore(false);
            } catch (err) {
                if (cancelled || activeQueryRef.current !== term) return;
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
            setRoomResults((prev) => uniqueRooms([...prev, ...page.items]));
            setRoomHasMore(page.hasMore);
        } catch (err) {
            setError(err && err.message ? err.message : "Unable to load more rooms.");
        } finally {
            setLoadingMoreRooms(false);
        }
    }, [loadingMoreRooms, roomHasMore, roomResults.length]);

    const loadMorePeople = useCallback(async () => {
        setPeopleHasMore(false);
    }, []);

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
        loadMorePeople
    };
}
