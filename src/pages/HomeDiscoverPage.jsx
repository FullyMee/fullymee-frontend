import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CreateRoomModal from "../components/common/CreateRoomModal.jsx";
import CommunityHubRail from "../components/common/CommunityHubRail.jsx";
import { InfiniteScrollLoader, InlineSpinner, RoomCardSkeletonList } from "../components/common/LoadingStates.jsx";
import UnifiedSidebar from "../components/layout/UnifiedSidebar.jsx";
import UnifiedTopBar from "../components/layout/UnifiedTopBar.jsx";
import {
    getRoomTone,
    RoomGlyphIcon
} from "../components/common/MobileRoomVisuals.jsx";
import { useGlobalError } from "../context/ErrorContext.jsx";
import usePrimaryTabSwipeNavigation from "../hooks/usePrimaryTabSwipeNavigation.js";
import {
    createConfessionRoom,
    getJoinedRooms,
    getRecommendedRooms,
    getPublicRooms,
    listConfessions,
    joinConfessionRoom,
    reactToConfessionTarget,
    likeConfession,
    sendConfessionChatRequest
} from "../services/confession.service";
import { listChatRequests } from "../services/chat.service";
import useIsDesktop from "../hooks/useIsDesktop";
import useBodyClass from "../hooks/useBodyClass.js";
import useSocket from "../hooks/useSocket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useTimedNotice from "../hooks/useTimedNotice.js";
import { formatRelativeTime } from "../utils/time.js";
import { getAliasTone } from "../utils/presentation.js";
import { subscribeConfessionRoom, unsubscribeConfessionRoom } from "../services/confession.service";
import {
    JoinRoomsIcon,
    TrendingIcon,
    ArrowRightIcon,
    MobileSearchIcon,
    MobileBellIcon,
    MobileMenuIcon,
    ConfideMarkIcon,
    PulseIcon,
    GroupIcon,
    HomeIcon,
    ConfessionIcon,
    MessagesIcon,
    ProfileIcon,
    HeartIcon,
    CommentIcon,
    ShieldIcon,
    SparkIcon,
    MoreIcon
} from "../components/common/Icons.jsx";
import {
    uniqueByRoomId,
    getHomeFilterLabel,
    matchesHomeSearch,
    matchesHomeConfessionSearch,
    formatRoomAccess,
    formatCompactPulseCount,
    getLatestConfessionScore
} from "../features/confessions/utils/feedSorting.js";

const CREATE_MODAL = "create";
const DISCOVER_PAGE_SIZE = 8;
const TRENDING_PAGE_SIZE = 6;
const ROOM_TITLE_LIMIT = 50;
const ROOM_DESCRIPTION_LIMIT = 50;
const HOME_FEED_PAGE_SIZE = 4;
const HOME_TOP_ROOMS_LIMIT = 4;
const HOME_SUGGESTION_LIMIT = 4;
const HOME_PULSE_ACTIVITY_WINDOW_MS = 5 * 60 * 1000;
const EMPTY_ROOMS = [];
const EMPTY_FEED_CARDS = [];
const EMPTY_CHAT_REQUESTS = { pendingIncomingCount: 0, pending: [], outgoingPending: [], accepted: [] };

const HOME_FEED_FILTERS = [
    { key: "all", label: "All" },
    { key: "late night", label: "Late Night" },
    { key: "heartbreak", label: "Heartbreak" },
    { key: "anxiety", label: "Anxiety" },
    { key: "wins", label: "Wins" },
    { key: "family", label: "Family" },
    { key: "work", label: "Work" },
    { key: "relationships", label: "Relationships" },
    { key: "random", label: "Random" }
];

const SECTION_META = {
    trending: {
        icon: "flame",
        title: "Trending Rooms",
        description: "Public rooms with the highest live activity right now"
    },
    daily: {
        icon: "sun",
        title: "Daily Rooms",
        description: "Visit frequently for relatable content"
    },
    advice: {
        icon: "bulb",
        title: "Advice Rooms",
        description: "Get support and meaningful conversations"
    },
    chill: {
        icon: "smile",
        title: "Chill Rooms",
        description: "Relax with light and fun content"
    },
    general: {
        icon: "spark",
        title: "Fresh Rooms",
        description: "Explore public rooms created by the community"
    }
};


export default function HomeDiscoverPage() {
    const isDesktop = useIsDesktop();
    const navigate = useNavigate();
    const location = useLocation();
    const { socket, connected } = useSocket();
    const { showError, dismissError } = useGlobalError();
    const queryClient = useQueryClient();
    const [desktopFilter, setDesktopFilter] = useState("all");
    const [homeFeedSort, setHomeFeedSort] = useState("recent");
    const [homeSearch, setHomeSearch] = useState("");
    const [notice, setNotice] = useTimedNotice("", 2600);
    const [busyRoomId, setBusyRoomId] = useState(null);
    const [modal, setModal] = useState("");
    const [roomType, setRoomType] = useState("public");
    const [roomTitle, setRoomTitle] = useState("");
    const [roomDescription, setRoomDescription] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [createErrors, setCreateErrors] = useState({ roomTitle: "", joinCode: "" });
    const [submitting, setSubmitting] = useState(false);
    const [pulseRoomCounts, setPulseRoomCounts] = useState(new Map());
    const [pulseActivityActors, setPulseActivityActors] = useState([]);
    const [likedFeedConfessionIds, setLikedFeedConfessionIds] = useState(() => new Set());
    const [reactingFeedConfessionIds, setReactingFeedConfessionIds] = useState(() => new Set());
    const [sentFeedChatRequestIds, setSentFeedChatRequestIds] = useState(() => new Set());
    const [sendingFeedChatRequestIds, setSendingFeedChatRequestIds] = useState(() => new Set());
    const isCreateRoomRoute = location.pathname === "/create-room";
    const isCreateRoomOpen = modal === CREATE_MODAL || isCreateRoomRoute || location.state?.openCreateRoom;

    const { data: queryData, isLoading: loading, error } = useQuery({
        queryKey: ['homeRooms', DISCOVER_PAGE_SIZE, TRENDING_PAGE_SIZE],
        queryFn: async () => {
            const [discoverRows, trendingRows, joinedRows, recommendedRows, chatRequestsRows] = await Promise.all([
                getPublicRooms({ limit: DISCOVER_PAGE_SIZE, sortBy: "discover" }),
                getPublicRooms({ limit: TRENDING_PAGE_SIZE, sortBy: "trending" }),
                getJoinedRooms(),
                getRecommendedRooms({ limit: HOME_SUGGESTION_LIMIT }),
                listChatRequests().catch(() => ({ pendingIncomingCount: 0, pending: [], outgoingPending: [], accepted: [] }))
            ]);

            const publicRooms = Array.isArray(discoverRows) ? discoverRows : [];
            const trendingRooms = Array.isArray(trendingRows) ? trendingRows : [];
            const joinedRooms = Array.isArray(joinedRows) ? joinedRows : [];
            const recommendedRooms = Array.isArray(recommendedRows) ? recommendedRows : [];
            const chatRequests = chatRequestsRows && typeof chatRequestsRows === "object"
                ? chatRequestsRows
                : { pendingIncomingCount: 0, pending: [], outgoingPending: [], accepted: [] };
            const chatRequestStateByConfessionId = new Map();
            const rememberedRequests = [
                ...(Array.isArray(chatRequests.outgoingPending) ? chatRequests.outgoingPending : []),
                ...(Array.isArray(chatRequests.accepted) ? chatRequests.accepted : [])
            ];

            for (const request of rememberedRequests) {
                const confessionId = Number(request && request.confessionId);
                const status = String(request && request.status ? request.status : "").trim();
                if (!confessionId || (status !== "pending" && status !== "accepted")) continue;
                if (!chatRequestStateByConfessionId.has(confessionId) || status === "accepted") {
                    chatRequestStateByConfessionId.set(confessionId, status);
                }
            }

            const roomPool = [];
            for (const room of joinedRooms.slice(0, HOME_TOP_ROOMS_LIMIT)) {
                const roomId = Number(room && room.roomId);
                if (!roomId || roomPool.some((item) => Number(item.roomId) === roomId)) continue;
                roomPool.push(room);
            }

            const confessionGroups = await Promise.all(
                roomPool.map(async (room) => {
                    try {
                        const rows = await listConfessions(room.roomId, { limit: HOME_FEED_PAGE_SIZE, sortBy: "latest" });
                        return { room, rows: Array.isArray(rows) ? rows : [] };
                    } catch {
                        return { room, rows: [] };
                    }
                })
            );

            const feedCards = confessionGroups.flatMap(({ room, rows }) => {
                if (!Array.isArray(rows) || rows.length === 0) return [];
                return rows.slice(0, 1).map((confession, index) => ({
                    ...confession,
                    roomId: Number(confession.roomId || room.roomId),
                    roomTitle: room.title || "Room",
                    roomCategory: room.category || "general",
                    roomType: room.roomType || "public",
                    roomMemberCount: Number(room.currentUserCount) || 0,
                    roomDescription: room.description || "",
                    feedIndex: index,
                    tone: getRoomTone(room),
                    viewerChatRequestStatus: confession.viewerChatRequestStatus || chatRequestStateByConfessionId.get(Number(confession.confessionId || confession.id)) || null
                }));
            });

            return {
                publicRooms,
                trendingRooms,
                joinedRooms,
                recommendedRooms,
                chatRequests,
                feedCards
            };
        },
        staleTime: 30000,
        refetchOnWindowFocus: false
    });

    useEffect(() => {
        if (error) {
            showError(error.message || "Unable to load rooms right now.");
        } else {
            dismissError();
        }
    }, [error, dismissError, showError]);

    useEffect(() => {
        if (isCreateRoomRoute || location.state?.openCreateRoom) {
            setModal(CREATE_MODAL);
        }
    }, [isCreateRoomRoute, location.state]);

    const desktopTopBar = (
        <UnifiedTopBar
            className="desktop-page-topbar"
            value={homeSearch}
            onChange={(event) => setHomeSearch(event.target.value)}
            onSubmit={(event) => event.preventDefault()}
            onNotificationsClick={() => navigate("/chats?requests=1")}
            onPrimaryClick={() => navigate("/create-room", { state: { openCreateRoom: true } })}
        />
    );

    const publicRooms = queryData?.publicRooms || EMPTY_ROOMS;
    const trendingRooms = queryData?.trendingRooms || EMPTY_ROOMS;
    const joinedRooms = queryData?.joinedRooms || EMPTY_ROOMS;
    const recommendedRooms = queryData?.recommendedRooms || EMPTY_ROOMS;
    const chatRequests = queryData?.chatRequests || EMPTY_CHAT_REQUESTS;
    const feedCards = queryData?.feedCards || EMPTY_FEED_CARDS;
    const pendingMessageCount = Number(chatRequests.pendingIncomingCount || 0);

    useEffect(() => {
        const nextLikedIds = feedCards
            .filter((card) => card && card.likedByViewer)
            .map((card) => Number(card.confessionId))
            .filter(Boolean);

        setLikedFeedConfessionIds(new Set(nextLikedIds));

        const outgoingPending = Array.isArray(chatRequests.outgoingPending) ? chatRequests.outgoingPending : [];
        const acceptedRequests = Array.isArray(chatRequests.accepted) ? chatRequests.accepted : [];
        const sentIds = [
            ...feedCards
                .filter((card) => ["pending", "accepted"].includes(String(card && card.viewerChatRequestStatus || "").trim()))
                .map((card) => Number(card.confessionId)),
            ...outgoingPending.map((request) => Number(request && request.confessionId)),
            ...acceptedRequests.map((request) => Number(request && request.confessionId))
        ].filter(Boolean);

        setSentFeedChatRequestIds(new Set(sentIds));
    }, [chatRequests.accepted, chatRequests.outgoingPending, feedCards]);

    useBodyClass("confessions-scroll-unlocked");

    const swipeNavigationHandlers = usePrimaryTabSwipeNavigation({
        enabled: !isDesktop && modal !== CREATE_MODAL
    });

    const joinedRoomIds = useMemo(
        () => new Set((joinedRooms || []).map((room) => Number(room && room.roomId))),
        [joinedRooms]
    );
    const homeRooms = useMemo(() => uniqueByRoomId([
        ...joinedRooms,
        ...recommendedRooms,
        ...trendingRooms,
        ...publicRooms
    ]), [joinedRooms, recommendedRooms, trendingRooms, publicRooms]);

    useEffect(() => {
        const nextCounts = new Map();
        homeRooms.forEach((room) => {
            const roomId = Number(room && room.roomId);
            if (!roomId) return;
            nextCounts.set(roomId, Number(room && room.currentUserCount) || 0);
        });
        setPulseRoomCounts((current) => {
            if (current.size === nextCounts.size) {
                let unchanged = true;
                nextCounts.forEach((count, roomId) => {
                    if (current.get(roomId) !== count) {
                        unchanged = false;
                    }
                });
                if (unchanged) return current;
            }
            return nextCounts;
        });
    }, [homeRooms]);

    useEffect(() => {
        if (!connected || !socket || !homeRooms.length) return undefined;

        const roomIds = Array.from(new Set(homeRooms.map((room) => Number(room && room.roomId)).filter(Boolean)));
        roomIds.forEach((roomId) => {
            subscribeConfessionRoom(roomId).catch(() => {});
        });

        const recordActivity = (payload) => {
            const roomId = Number(payload && payload.roomId);
            const alias = String(payload && payload.alias ? payload.alias : "").trim();
            if (!roomId || !alias) return;

            const key = `${roomId}:${alias}`;
            const timestamp = Date.now();
            setPulseActivityActors((current) => {
                const next = current.filter((item) => item.key !== key);
                next.push({ key, timestamp });
                return next;
            });
        };

        const handleRoomStats = (payload) => {
            const roomId = Number(payload && payload.roomId);
            const currentUserCount = Number(payload && payload.currentUserCount);
            if (!roomId || Number.isNaN(currentUserCount)) return;

            setPulseRoomCounts((current) => {
                const next = new Map(current);
                next.set(roomId, currentUserCount);
                return next;
            });
        };

        const handleConfessionCreated = (payload) => recordActivity(payload);
        const handleReplyCreated = (payload) => recordActivity(payload && payload.reply ? payload.reply : payload);
        
        const handleLikesUpdated = (payload) => {
            const confessionId = Number(payload && payload.confessionId);
            const likesCount = Number(payload && payload.likesCount);
            if (!confessionId || Number.isNaN(likesCount)) return;

            updateHomeFeedCard(confessionId, (existing) => ({
                ...existing,
                reactionCount: likesCount,
                likesCount
            }));
        };

        socket.on("confession_room_stats", handleRoomStats);
        socket.on("confession_created", handleConfessionCreated);
        socket.on("confession_reply_created", handleReplyCreated);
        socket.on("confession:likesUpdated", handleLikesUpdated);

        const cleanupTimer = setInterval(() => {
            const cutoff = Date.now() - HOME_PULSE_ACTIVITY_WINDOW_MS;
            setPulseActivityActors((current) => current.filter((item) => item.timestamp >= cutoff));
        }, 15000);

        return () => {
            roomIds.forEach((roomId) => {
                unsubscribeConfessionRoom(roomId).catch(() => {});
            });
            socket.off("confession_room_stats", handleRoomStats);
            socket.off("confession_created", handleConfessionCreated);
            socket.off("confession_reply_created", handleReplyCreated);
            socket.off("confession:likesUpdated", handleLikesUpdated);
            clearInterval(cleanupTimer);
        };
    }, [connected, homeRooms, socket]);

    const desktopStats = useMemo(() => {
        const memberTotal = homeRooms.reduce((sum, room) => {
            const roomId = Number(room && room.roomId);
            const liveCount = roomId ? pulseRoomCounts.get(roomId) : null;
            const memberCount = Number.isFinite(liveCount)
                ? Number(liveCount)
                : (Number(room && room.currentUserCount) || 0);
            return sum + memberCount;
        }, 0);
        const activeRooms = homeRooms.length;
        const recentActivityPeople = new Set(pulseActivityActors.map((item) => item.key)).size;
        const peopleSharing = Math.max(1, memberTotal + recentActivityPeople);
        const confessionsToday = Math.max(8432, activeRooms * 766);
        const supportGiven = Math.max(45200, activeRooms * 4109);

        return {
            activeRooms,
            peopleSharing,
            confessionsToday,
            supportGiven,
            joinedRooms: joinedRooms.length,
            members: memberTotal
        };
    }, [homeRooms, joinedRooms.length, pulseActivityActors, pulseRoomCounts]);

    const homeSearchTerm = String(homeSearch || "").trim();

    const feedCardsSorted = useMemo(() => {
        const items = Array.isArray(feedCards) ? [...feedCards] : [];

        function getLatestConfessionScore(item) {
            const createdAtMs = new Date((item && item.createdAt) || 0).getTime();
            const ageMinutes = Math.max(1, (Date.now() - createdAtMs) / (1000 * 60));
            const reactionCount = Number(item && item.reactionCount) || 0;
            const replyCount = Number(item && item.replyCount) || 0;
            const freshnessScore = 12 / Math.pow(ageMinutes + 12, 1.15);
            const engagementScore = Math.log1p(reactionCount * 2 + replyCount * 3) * 2.4;
            return freshnessScore + engagementScore;
        }

        const filtered = desktopFilter === "all"
            ? items
            : items.filter((item) => {
                const tone = getRoomTone(item);
                const label = getHomeFilterLabel(tone).toLowerCase();
                const haystack = `${item.alias || ""} ${item.roomTitle || ""} ${item.roomDescription || ""} ${item.content || ""} ${tone} ${label}`.toLowerCase();
                return haystack.includes(String(desktopFilter).toLowerCase()) || label.includes(String(desktopFilter).toLowerCase()) || tone === desktopFilter;
            });

        const sorted = [...filtered];
        sorted.sort((a, b) => {
            if (homeFeedSort === "top") {
                const aScore = (Number(a && a.reactionCount) || 0) + (Number(a && a.replyCount) || 0);
                const bScore = (Number(b && b.reactionCount) || 0) + (Number(b && b.replyCount) || 0);
                if (bScore !== aScore) return bScore - aScore;
                const aLatest = getLatestConfessionScore(a);
                const bLatest = getLatestConfessionScore(b);
                if (bLatest !== aLatest) return bLatest - aLatest;
            } else {
                const aLatest = getLatestConfessionScore(a);
                const bLatest = getLatestConfessionScore(b);
                if (bLatest !== aLatest) return bLatest - aLatest;
            }

            const aTime = new Date((a && a.createdAt) || 0).getTime();
            const bTime = new Date((b && b.createdAt) || 0).getTime();
            return bTime - aTime;
        });

        return sorted;
    }, [desktopFilter, feedCards, homeFeedSort]);

    const homeSuggestionRooms = useMemo(() => {
        const rooms = uniqueByRoomId([
            ...recommendedRooms,
            ...publicRooms,
            ...trendingRooms
        ]).filter((room) => !joinedRoomIds.has(Number(room.roomId)));

        return rooms.slice(0, HOME_SUGGESTION_LIMIT);
    }, [joinedRoomIds, publicRooms, recommendedRooms, trendingRooms]);

    const homeTrendingRooms = useMemo(() => {
        const rooms = uniqueByRoomId([
            ...trendingRooms,
            ...publicRooms
        ]).filter((room) => !joinedRoomIds.has(Number(room.roomId)));

        return rooms.slice(0, 3);
    }, [joinedRoomIds, publicRooms, trendingRooms]);

    const filteredTrendingRooms = useMemo(
        () => homeTrendingRooms.filter((room) => matchesHomeSearch(room, homeSearchTerm)),
        [homeSearchTerm, homeTrendingRooms]
    );

    const filteredFeedCardsSorted = useMemo(
        () => feedCardsSorted.filter((card) => matchesHomeConfessionSearch(card, homeSearchTerm)),
        [feedCardsSorted, homeSearchTerm]
    );

    const hasFeedItems = filteredFeedCardsSorted.length > 0;
    const mobilePulsePeople = desktopStats.peopleSharing;
    const mobilePulseConfessions = formatCompactPulseCount(desktopStats.confessionsToday);
    const mobilePulseSupport = formatCompactPulseCount(desktopStats.supportGiven);

    const createDisabled = submitting || String(roomTitle || "").trim().length < 3;

    async function handleOpenRoom(room) {
        const roomId = Number(room && room.roomId);
        if (!roomId) return;

        try {
            setBusyRoomId(roomId);
            dismissError();

            if (!joinedRoomIds.has(roomId)) {
                const joinedRoom = await joinConfessionRoom({ roomId, joinSource: "home_discovery" });
                queryClient.setQueryData(['homeRooms', DISCOVER_PAGE_SIZE, TRENDING_PAGE_SIZE], (oldData) => {
                    if (!oldData) return oldData;
                    const exists = oldData.joinedRooms.some(entry => Number(entry.roomId) === roomId);
                    if (exists) return oldData;
                    return {
                        ...oldData,
                        joinedRooms: [joinedRoom || room, ...oldData.joinedRooms]
                    };
                });
                setNotice(`Joined ${room.title}`);
            }

            navigate(`/confessions?roomId=${roomId}`);
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to open room.");
        } finally {
            setBusyRoomId(null);
        }
    }

    function updateHomeFeedCard(confessionId, updater) {
        queryClient.setQueryData(['homeRooms', DISCOVER_PAGE_SIZE, TRENDING_PAGE_SIZE], (oldData) => {
            if (!oldData || !Array.isArray(oldData.feedCards)) return oldData;
            return {
                ...oldData,
                feedCards: oldData.feedCards.map((card) => (
                    Number(card && card.confessionId) === Number(confessionId)
                        ? updater(card)
                        : card
                ))
            };
        });
    }

    function openHomeConfession(roomId, confessionId) {
        if (!roomId || !confessionId) return;
        navigate(`/confessions?roomId=${roomId}&confessionId=${confessionId}`);
    }

    async function handleLikeHomeConfession(card) {
        const confessionId = Number(card && card.confessionId);
        if (!confessionId) return;

        // 1. Keep snapshot of the current state for rollback
        const originalLikedIds = new Set(likedFeedConfessionIds);
        let originalCardState = null;
        
        // Find existing card in queryData to back up its state
        queryClient.setQueryData(['homeRooms', DISCOVER_PAGE_SIZE, TRENDING_PAGE_SIZE], (oldData) => {
            if (!oldData || !Array.isArray(oldData.feedCards)) return oldData;
            const target = oldData.feedCards.find(c => Number(c && c.confessionId) === confessionId);
            if (target) {
                originalCardState = { ...target };
            }
            return oldData;
        });

        // 2. Perform Optimistic Update
        const currentlyLiked = likedFeedConfessionIds.has(confessionId);
        const nextLiked = !currentlyLiked;

        setLikedFeedConfessionIds((current) => {
            const next = new Set(current);
            if (nextLiked) next.add(confessionId);
            else next.delete(confessionId);
            return next;
        });

        updateHomeFeedCard(confessionId, (existing) => ({
            ...existing,
            reactionCount: Math.max(0, (Number(existing.reactionCount) || 0) + (nextLiked ? 1 : -1)),
            likesCount: Math.max(0, (Number(existing.likesCount) || 0) + (nextLiked ? 1 : -1)),
            likedByViewer: nextLiked
        }));

        try {
            // 3. Make API call
            const result = await likeConfession(confessionId);
            const likesCount = Number(result && result.likesCount);
            const liked = !!(result && result.liked);

            updateHomeFeedCard(confessionId, (existing) => ({
                ...existing,
                reactionCount: likesCount,
                likesCount,
                likedByViewer: liked
            }));
            
            setLikedFeedConfessionIds((current) => {
                const next = new Set(current);
                if (liked) next.add(confessionId);
                else next.delete(confessionId);
                return next;
            });
        } catch (err) {
            // 4. Rollback on failure
            setLikedFeedConfessionIds(originalLikedIds);
            if (originalCardState) {
                updateHomeFeedCard(confessionId, () => originalCardState);
            }
            showError(err && err.message ? err.message : "Unable to toggle like on confession.");
        }
    }

    async function handleSendHomeChatRequest(card) {
        const roomId = Number(card && card.roomId);
        const confessionId = Number(card && card.confessionId);
        const alias = String(card && card.alias ? card.alias : "this user").trim();
        if (!roomId || !confessionId || sentFeedChatRequestIds.has(confessionId) || sendingFeedChatRequestIds.has(confessionId)) {
            return;
        }

        try {
            setSendingFeedChatRequestIds((current) => new Set(current).add(confessionId));
            const result = await sendConfessionChatRequest(roomId, confessionId);
            const requestState = String((result && result.requestState) || "").trim();

            if ((requestState === "already_connected" || requestState === "accepted") && Number(result && result.conversationId)) {
                setSentFeedChatRequestIds((current) => new Set(current).add(confessionId));
                updateHomeFeedCard(confessionId, (existing) => ({
                    ...existing,
                    viewerChatRequestStatus: "accepted"
                }));
                setNotice(`You are already connected with ${alias}.`);
                navigate(`/chats?conversationId=${result.conversationId}`);
                return;
            }

            if (requestState === "already_pending") {
                setSentFeedChatRequestIds((current) => new Set(current).add(confessionId));
                updateHomeFeedCard(confessionId, (existing) => ({
                    ...existing,
                    viewerChatRequestStatus: "pending"
                }));
                setNotice(`Chat request already pending for ${alias}.`);
                return;
            }

            setSentFeedChatRequestIds((current) => new Set(current).add(confessionId));
            updateHomeFeedCard(confessionId, (existing) => ({
                ...existing,
                viewerChatRequestStatus: "pending"
            }));
            queryClient.invalidateQueries(['homeRooms', DISCOVER_PAGE_SIZE, TRENDING_PAGE_SIZE]);
            setNotice(`Chat request sent to ${alias}.`);
        } catch (err) {
            showError(err && err.message ? err.message : "Unable to send a chat request right now.");
        } finally {
            setSendingFeedChatRequestIds((current) => {
                const next = new Set(current);
                next.delete(confessionId);
                return next;
            });
        }
    }

    function resetModalState() {
        setSubmitting(false);
        setRoomType("public");
        setRoomTitle("");
        setRoomDescription("");
        setJoinCode("");
        setCreateErrors({ roomTitle: "", joinCode: "" });
        setModal("");
        if (isCreateRoomRoute) {
            navigate("/", { replace: true });
        }
    }

    function generateJoinCode() {
        const code = String(Math.floor(100000 + Math.random() * 900000));
        setJoinCode(code);
        setCreateErrors((prev) => ({ ...prev, joinCode: "" }));
    }

    async function handleCreateRoom(event) {
        event.preventDefault();

        const title = String(roomTitle || "").trim();
        const description = String(roomDescription || "").trim().slice(0, ROOM_DESCRIPTION_LIMIT);

        if (!title) {
            setCreateErrors((prev) => ({ ...prev, roomTitle: "Enter the room name." }));
            return;
        }

        const code = String(joinCode || "").trim();
        if (roomType === "private" && code && !/^\d{6}$/.test(code)) {
            setCreateErrors((prev) => ({ ...prev, joinCode: "Enter a valid 6 digit join code." }));
            return;
        }

        try {
            setSubmitting(true);
            setCreateErrors({ roomTitle: "", joinCode: "" });
            dismissError();
            const createdRoom = await createConfessionRoom({
                title,
                description,
                roomType,
                category: "general",
                joinCode: roomType === "private" && code ? code : undefined
            });

            setNotice(roomType === "private" ? "Private room created successfully." : "Public room created successfully.");
            resetModalState();
            
            // Invalidate queries to fetch fresh lists, but immediately optimistic insert
            const roomId = Number(createdRoom && createdRoom.roomId);
            if (roomId) {
                queryClient.setQueryData(['homeRooms', DISCOVER_PAGE_SIZE, TRENDING_PAGE_SIZE], (oldData) => {
                    if (!oldData) return oldData;
                    const exists = oldData.joinedRooms.some(entry => Number(entry.roomId) === roomId);
                    if (exists) return oldData;
                    return {
                        ...oldData,
                        joinedRooms: [createdRoom, ...oldData.joinedRooms]
                    };
                });
            }
            queryClient.invalidateQueries(['homeRooms']);
            navigate(`/confessions?roomId=${createdRoom.roomId}`);
        } catch (err) {
            const message = err && err.message ? err.message : "Unable to create the room.";
            if (err && [400, 409, 422].includes(Number(err.status))) {
                if (/code/i.test(message)) {
                    setCreateErrors((prev) => ({ ...prev, joinCode: message }));
                } else {
                    setCreateErrors((prev) => ({ ...prev, roomTitle: message }));
                }
            } else {
                showError(message);
            }
        } finally {
            setSubmitting(false);
        }
    }

    const createRoomModal = (
        <CreateRoomModal
            open={isCreateRoomOpen}
            roomType={roomType}
            roomTitle={roomTitle}
            roomDescription={roomDescription}
            joinCode={joinCode}
            createErrors={createErrors}
            submitting={submitting}
            createDisabled={createDisabled}
            roomTitleLimit={ROOM_TITLE_LIMIT}
            roomDescriptionLimit={ROOM_DESCRIPTION_LIMIT}
            onClose={resetModalState}
            onSubmit={handleCreateRoom}
            onRoomTitleChange={(value) => {
                setRoomTitle(String(value || "").slice(0, ROOM_TITLE_LIMIT));
                if (createErrors.roomTitle) {
                    setCreateErrors((prev) => ({ ...prev, roomTitle: "" }));
                }
            }}
            onRoomDescriptionChange={(value) => setRoomDescription(String(value || "").slice(0, ROOM_DESCRIPTION_LIMIT))}
            onRoomTypeChange={setRoomType}
            onJoinCodeChange={(value) => {
                setJoinCode(String(value || "").replace(/\D+/g, "").slice(0, 6));
                if (createErrors.joinCode) {
                    setCreateErrors((prev) => ({ ...prev, joinCode: "" }));
                }
            }}
            onGenerateJoinCode={generateJoinCode}
        />
    );

    if (isDesktop) {
        const sidebarRooms = uniqueByRoomId(joinedRooms);
        const pulsePeople = formatCompactPulseCount(desktopStats.peopleSharing);
        const pulseConfessions = formatCompactPulseCount(desktopStats.confessionsToday);
        const pulseSupport = formatCompactPulseCount(desktopStats.supportGiven);

        return (
            <div className="home-desktop-page">
                {notice && <p className="home-desktop-page__notice">{notice}</p>}
                <div className="home-desktop-shell">
                    <UnifiedSidebar
                        rooms={sidebarRooms}
                        selectedRoomId={0}
                        onSelectRoom={handleOpenRoom}
                        pendingMessageCount={pendingMessageCount}
                    />

                    <section className="home-desktop-main desktop-confessions-hub">
                        {desktopTopBar}

                        <div className="home-content-grid">
                            <main className="home-feed-column">
                                <section className="home-hero">
                                    <div className="home-hero__badge">
                                        <span aria-hidden="true" />
                                        <span>{pulsePeople} people are sharing right now</span>
                                    </div>
                                    <h1>
                                        Tonight, somebody needs to
                                        <em>hear what you have to say.</em>
                                    </h1>
                                    <p>Find your community. Share your truth. Stay completely anonymous.</p>
                                </section>

                                <section className="home-filter-bar" aria-label="Conversation filters">
                                    {HOME_FEED_FILTERS.map((filter) => (
                                        <button
                                            key={filter.key}
                                            type="button"
                                            className={`home-filter-bar__item${desktopFilter === filter.key ? " is-active" : ""}`}
                                            onClick={() => setDesktopFilter(filter.key)}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </section>

                                <section className="home-trending-section" aria-label="Trending rooms">
                                    <div className="home-trending-section__head">
                                        <h2>Trending Rooms</h2>
                                        <button type="button" className="home-trending-section__link" onClick={() => navigate("/search")}>
                                            View all
                                        </button>
                                    </div>

                                    <div className="home-trending-grid">
                                        {filteredTrendingRooms.length > 0 ? filteredTrendingRooms.map((room, index) => {
                                            const tone = getRoomTone(room);
                                            const title = room.title || "Untitled room";
                                            const description = String(room.description || "Anonymous conversations start here.").trim();
                                            const quote = String(room.previewText || room.highlight || "").trim();
                                            const normalizedDescription = description.toLowerCase();
                                            const normalizedQuote = quote.toLowerCase();
                                            const showQuote = Boolean(quote) && normalizedQuote !== normalizedDescription;
                                            const memberCount = Number(room.currentUserCount) || 0;
                                            const isActive = memberCount > 0;
                                            const accentTone = tone === "advice" ? "advice" : tone === "chill" ? "chill" : tone === "general" ? "general" : "daily";

                                            return (
                                                <article
                                                    key={room.roomId || `${room.title}-${index}`}
                                                    className={`home-trending-card home-trending-card--${accentTone}`}
                                                    role="link"
                                                    tabIndex={0}
                                                    aria-label={`Open ${title}`}
                                                    onClick={() => handleOpenRoom(room)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === "Enter" || event.key === " ") {
                                                            event.preventDefault();
                                                            handleOpenRoom(room);
                                                        }
                                                    }}
                                                >
                                                    <div className="home-trending-card__top">
                                                        <div className="home-trending-card__title-wrap">
                                                            <h3>{title}</h3>
                                                            <span className="home-trending-card__tag">Public</span>
                                                        </div>
                                                        <p className="home-trending-card__description">{description}</p>
                                                    </div>

                                                    {showQuote && (
                                                        <div className="home-trending-card__quote">
                                                            <p>{quote}</p>
                                                        </div>
                                                    )}

                                                    <div className="home-trending-card__footer">
                                                        <div className="home-trending-card__icons" aria-hidden="true">
                                                            <span className="home-trending-card__icon home-trending-card__icon--one"><RoomGlyphIcon tone={tone} /></span>
                                                            <span className="home-trending-card__icon home-trending-card__icon--two"><SparkIcon /></span>
                                                            <span className="home-trending-card__icon home-trending-card__icon--three"><TrendingIcon /></span>
                                                        </div>
                                                        <div className="home-trending-card__meta">
                                                            <span>{formatCompactPulseCount(memberCount)} members</span>
                                                            <i aria-hidden="true">•</i>
                                                            <span className={isActive ? "is-active" : ""}>{isActive ? "active" : "quiet"}</span>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        }) : (
                                            <div className="home-trending-empty">
                                                {homeSearchTerm
                                                    ? "No trending rooms match your search."
                                                    : "Join a few rooms to see trending highlights here."}
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section className="home-feed-section">
                                    <div className="home-feed-section__head">
                                        <h2>Latest Confessions</h2>
                                        <div className="home-feed-toggle" role="tablist" aria-label="Feed sort">
                                            <button
                                                type="button"
                                                className={`home-feed-toggle__item${homeFeedSort === "recent" ? " is-active" : ""}`}
                                                onClick={() => setHomeFeedSort("recent")}
                                            >
                                                Recent
                                            </button>
                                            <button
                                                type="button"
                                                className={`home-feed-toggle__item${homeFeedSort === "top" ? " is-active" : ""}`}
                                                onClick={() => setHomeFeedSort("top")}
                                            >
                                                Top
                                            </button>
                                        </div>
                                    </div>

                                    {loading && (
                                        <div className="home-feed-skeleton-list">
                                            <RoomCardSkeletonList count={3} />
                                        </div>
                                    )}

                                    {!loading && !hasFeedItems && (
                                        <div className="home-feed-empty">
                                            <h3>{homeSearchTerm ? "No confessions match your search" : "No confession feed yet"}</h3>
                                            <p>
                                                {homeSearchTerm
                                                    ? "Try a different keyword or clear the search bar to see more confessions."
                                                    : "Join a room to start seeing real conversations here."}
                                            </p>
                                        </div>
                                    )}

                                    {!loading && hasFeedItems && filteredFeedCardsSorted.map((card) => {
                                        const roomId = Number(card.roomId);
                                        const confessionId = Number(card.confessionId);
                                        const tone = getRoomTone(card);
                                        const isLiked = likedFeedConfessionIds.has(confessionId) || !!card.likedByViewer;
                                        const isReacting = reactingFeedConfessionIds.has(confessionId);
                                        const isSentRequest = sentFeedChatRequestIds.has(confessionId) || ["pending", "accepted"].includes(String(card.viewerChatRequestStatus || "").trim());
                                        const isSendingRequest = sendingFeedChatRequestIds.has(confessionId);
                                        return (
                                            <article
                                                key={`${roomId}-${confessionId}`}
                                                className={`home-feed-card home-feed-card--${tone}`}
                                            >
                                                <button
                                                    type="button"
                                                    className="home-feed-card__main"
                                                    onClick={() => openHomeConfession(roomId, confessionId)}
                                                >
                                                    <div className="home-feed-card__header">
                                                        <div className={`home-feed-card__avatar home-feed-card__avatar--${getAliasTone(card.alias || card.roomTitle || tone)}`}>
                                                            <RoomGlyphIcon tone={tone} />
                                                        </div>
                                                        <div className="home-feed-card__author">
                                                            <strong>{card.alias || "Wandering Soul"}</strong>
                                                            <span>
                                                                <em>in {card.roomTitle || "Anonymous Room"}</em>
                                                                <i>&bull;</i>
                                                                <time>{formatRelativeTime(card.createdAt, { short: true, nowLabel: "now" })}</time>
                                                            </span>
                                                        </div>
                                                        <span className="home-feed-card__menu" aria-hidden="true">
                                                            <MoreIcon />
                                                        </span>
                                                    </div>

                                                    <p className="home-feed-card__content">
                                                        {card.content || "Share freely. Your identity stays anonymous."}
                                                    </p>
                                                </button>

                                                <div className="room-confession-card__actions home-feed-card__actions">
                                                        <button
                                                            type="button"
                                                            className={`room-confession-card__stat home-feed-card__action${isLiked ? " is-liked" : ""}`}
                                                            onClick={() => handleLikeHomeConfession(card)}
                                                            disabled={isReacting}
                                                        >
                                                            <HeartIcon filled={isLiked} />
                                                            <span>{Number(card.reactionCount) || 0}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="room-confession-card__stat home-feed-card__action"
                                                            onClick={() => openHomeConfession(roomId, confessionId)}
                                                        >
                                                            <CommentIcon />
                                                            <span>{Number(card.replyCount) || 0}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`room-confession-card__request home-feed-card__action home-feed-card__action--accent${isSentRequest ? " is-sent" : ""}`}
                                                            onClick={() => handleSendHomeChatRequest(card)}
                                                            disabled={isSentRequest || isSendingRequest}
                                                        >
                                                            <span>{isSendingRequest ? "Sending..." : isSentRequest ? "Sent" : "Send request"}</span>
                                                        </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </section>
                            </main>

                            <CommunityHubRail
                                activeRooms={desktopStats.activeRooms}
                                confessionsToday={pulseConfessions}
                                supportGiven={pulseSupport}
                                rooms={homeSuggestionRooms}
                                onJoinRoom={handleOpenRoom}
                                emptyMessage="Join more rooms to unlock better suggestions."
                                showFooter
                            />
                        </div>
                        {createRoomModal}
                    </section>
                </div>
            </div>
        );
    }

    const mobileTrendingRooms = filteredTrendingRooms;

    return (
        <div className="home-mobile-page" {...swipeNavigationHandlers}>
            <div className="home-mobile-shell">
                <main className="home-mobile-content">
                    <form className="home-searchbar home-mobile-searchbar" onSubmit={(event) => event.preventDefault()}>
                        <span className="home-searchbar__icon" aria-hidden="true">
                            <MobileSearchIcon />
                        </span>
                        <input
                            type="search"
                            value={homeSearch}
                            onChange={(event) => setHomeSearch(event.target.value)}
                            placeholder="Search rooms, people, or feelings..."
                        />
                    </form>

                    <div className="home-mobile-badge">
                        <span aria-hidden="true" />
                        <span>{mobilePulsePeople} people are sharing right now</span>
                    </div>

                    <section className="home-mobile-hero">
                        <h1>
                            Tonight, somebody needs to
                            <em>hear what you have to say.</em>
                        </h1>
                        <p>Find your community. Share your truth. Stay completely anonymous.</p>
                    </section>

                    <section className="home-mobile-filters" aria-label="Conversation filters">
                        {HOME_FEED_FILTERS.map((filter) => (
                            <button
                                key={filter.key}
                                type="button"
                                className={`home-mobile-filter${desktopFilter === filter.key ? " is-active" : ""}`}
                                onClick={() => setDesktopFilter(filter.key)}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </section>

                    <section className="home-mobile-section" aria-label="Trending rooms">
                        <div className="home-mobile-section__head">
                            <h2>Trending Rooms</h2>
                            <button type="button" className="home-mobile-section__link" onClick={() => navigate("/search")}>
                                View all
                            </button>
                        </div>

                        {mobileTrendingRooms.length > 0 ? (
                            <div className="home-mobile-trending-grid">
                                {mobileTrendingRooms.map((room, index) => {
                                    const tone = getRoomTone(room);
                                    const title = room.title || "Untitled room";
                                    const description = String(room.description || "Anonymous conversations start here.").trim();
                                    const memberCount = Number(room.currentUserCount) || 0;
                                    const accentTone = tone === "advice" ? "advice" : tone === "chill" ? "chill" : tone === "general" ? "general" : "daily";
                                    const roomId = Number(room.roomId);
                                    const alreadyJoined = joinedRoomIds.has(roomId);

                                    return (
                                        <button
                                            key={room.roomId || `${room.title}-${index}`}
                                            type="button"
                                            className={`home-trending-card home-trending-card--${accentTone} home-mobile-trending-card`}
                                            onClick={() => handleOpenRoom(room)}
                                            disabled={busyRoomId === roomId}
                                            aria-label={`${alreadyJoined ? "Open" : "Join"} ${title}`}
                                        >
                                            <div className="home-trending-card__top">
                                                <div className="home-trending-card__title-wrap">
                                                    <h3>{title}</h3>
                                                    <span className="home-trending-card__tag">{formatRoomAccess(room)}</span>
                                                </div>
                                                <p className="home-trending-card__description">{description}</p>
                                            </div>

                                            <div className="home-trending-card__footer">
                                                <div className="home-trending-card__meta">
                                                    <span>{`${memberCount.toLocaleString()} members`}</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="home-trending-empty">
                                {homeSearchTerm
                                    ? "No trending rooms match your search."
                                    : "Join a few rooms to see trending highlights here."}
                            </div>
                        )}
                    </section>

                    <section className="home-mobile-section">
                        <div className="home-mobile-section__head home-mobile-section__head--feed">
                            <h2>Latest Confessions</h2>
                            <div className="home-feed-toggle" role="tablist" aria-label="Feed sort">
                                <button
                                    type="button"
                                    className={`home-feed-toggle__item${homeFeedSort === "recent" ? " is-active" : ""}`}
                                    onClick={() => setHomeFeedSort("recent")}
                                >
                                    Recent
                                </button>
                                <button
                                    type="button"
                                    className={`home-feed-toggle__item${homeFeedSort === "top" ? " is-active" : ""}`}
                                    onClick={() => setHomeFeedSort("top")}
                                >
                                    Top
                                </button>
                            </div>
                        </div>

                        {loading && (
                            <div className="home-feed-skeleton-list">
                                <RoomCardSkeletonList count={2} />
                            </div>
                        )}

                        {!loading && !hasFeedItems && (
                            <div className="home-feed-empty">
                                <h3>{homeSearchTerm ? "No confessions match your search" : "No confession feed yet"}</h3>
                                <p>
                                    {homeSearchTerm
                                        ? "Try a different keyword or clear the search bar to see more confessions."
                                        : "Join a room to start seeing real conversations here."}
                                </p>
                            </div>
                        )}

                        {!loading && hasFeedItems && filteredFeedCardsSorted.map((card) => {
                            const roomId = Number(card.roomId);
                            const confessionId = Number(card.confessionId);
                            const tone = getRoomTone(card);
                            const isLiked = likedFeedConfessionIds.has(confessionId) || !!card.likedByViewer;
                            const isReacting = reactingFeedConfessionIds.has(confessionId);
                            const isSentRequest = sentFeedChatRequestIds.has(confessionId) || ["pending", "accepted"].includes(String(card.viewerChatRequestStatus || "").trim());
                            const isSendingRequest = sendingFeedChatRequestIds.has(confessionId);
                            return (
                                <article key={`${roomId}-${confessionId}`} className={`home-feed-card home-feed-card--${tone} home-mobile-feed-card`}>
                                    <button
                                        type="button"
                                        className="home-feed-card__main"
                                        onClick={() => openHomeConfession(roomId, confessionId)}
                                    >
                                        <div className="home-feed-card__header">
                                            <div className={`home-feed-card__avatar home-feed-card__avatar--${getAliasTone(card.alias || card.roomTitle || tone)}`}>
                                                <RoomGlyphIcon tone={tone} />
                                            </div>
                                            <div className="home-feed-card__author">
                                                <strong>{card.alias || "Wandering Soul"}</strong>
                                                <span>
                                                    <em>in {card.roomTitle || "Anonymous Room"}</em>
                                                    <i>&bull;</i>
                                                    <time>{formatRelativeTime(card.createdAt, { short: true, nowLabel: "now" })}</time>
                                                </span>
                                            </div>
                                            <span className="home-feed-card__menu" aria-hidden="true">
                                                <MoreIcon />
                                            </span>
                                        </div>

                                        <p className="home-feed-card__content">
                                            {card.content || "Share freely. Your identity stays anonymous."}
                                        </p>
                                    </button>

                                    <div className="room-confession-card__actions home-feed-card__actions">
                                            <button
                                                type="button"
                                                className={`room-confession-card__stat home-feed-card__action${isLiked ? " is-liked" : ""}`}
                                                onClick={() => handleLikeHomeConfession(card)}
                                                disabled={isReacting}
                                            >
                                                <HeartIcon filled={isLiked} />
                                                <span>{Number(card.reactionCount) || 0}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="room-confession-card__stat home-feed-card__action"
                                                onClick={() => openHomeConfession(roomId, confessionId)}
                                            >
                                                <CommentIcon />
                                                <span>{Number(card.replyCount) || 0}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={`room-confession-card__request home-feed-card__action home-feed-card__action--accent${isSentRequest ? " is-sent" : ""}`}
                                                onClick={() => handleSendHomeChatRequest(card)}
                                                disabled={isSentRequest || isSendingRequest}
                                            >
                                                <span>{isSendingRequest ? "Sending..." : isSentRequest ? "Sent" : "Send request"}</span>
                                            </button>
                                    </div>
                                </article>
                            );
                        })}
                    </section>

                    <section className="home-mobile-section">
                        <section className="home-rail-card home-mobile-rail-card">
                            <div className="home-rail-card__head">
                                <h2>Suggested for you</h2>
                            </div>
                            <div className="home-suggestion-list">
                                {homeSuggestionRooms.length > 0 ? homeSuggestionRooms.map((room, index) => (
                                    <div key={room.roomId || `${room.title}-${index}`} className="home-suggestion-item">
                                        <div className="home-suggestion-item__icon home-suggestion-item__icon--general" aria-hidden="true">
                                            <SparkIcon />
                                        </div>
                                        <div className="home-suggestion-item__copy">
                                            <strong>{room.title || "Untitled room"}</strong>
                                            <span>{`${(Number(room && room.currentUserCount) || 0).toLocaleString()} members`}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="home-suggestion-item__join"
                                            onClick={() => handleOpenRoom(room)}
                                        >
                                            Join
                                        </button>
                                    </div>
                                )) : (
                                    <div className="home-rail-empty">
                                        Join more rooms to unlock better suggestions.
                                    </div>
                                )}
                            </div>
                        </section>
                    </section>

                    <section className="home-mobile-section">
                        <section className="home-rail-card home-rail-card--safety home-mobile-rail-card home-mobile-safety-card">
                            <div className="home-safety-card__icon" aria-hidden="true">
                                <ShieldIcon />
                            </div>
                            <h2>Safety First</h2>
                            <p>Your identity is protected. Share freely, knowing you're in a safe space designed for authentic connection.</p>
                        </section>
                    </section>
                </main>

                {createRoomModal}

            </div>
        </div>
    );
}
