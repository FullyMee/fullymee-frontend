import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { MessageSquareQuote, Plus, Search, UserRoundPlus } from "lucide-react";
import fullymeLogo from "../assets/fullyme-logo.png";
import useAuth from "../hooks/useAuth.js";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import { AppLoader, PageLoader } from "../components/loaders";
import AppBottomNav from "../components/navigation/AppBottomNav.jsx";
import { connectSocket, disconnectSocket } from "../services/socket.js";
import useIsDesktop from "../hooks/useIsDesktop.js";

// Lazy-loaded pages to split the massive bundle and improve TTI
const LoginPage = lazy(() => import("../pages/LoginPage.jsx"));
const HomeDiscoverPage = lazy(() => import("../pages/HomeDiscoverPage.jsx"));
const ConfessionRoomPage = lazy(() => import("../pages/ConfessionRoomPage.jsx"));
const ChatPage = lazy(() => import("../pages/ChatPage.jsx"));
const SearchPage = lazy(() => import("../pages/SearchPage.jsx"));
const ProfilePage = lazy(() => import("../pages/ProfilePage.jsx"));
const UserProfilePage = lazy(() => import("../pages/UserProfilePage.jsx"));
const SettingsPage = lazy(() => import("../pages/SettingsPage.jsx"));
const PRIMARY_TAB_ROUTES = ["/", "/confessions", "/chats", "/search", "/profile", "/settings"];
const PRIMARY_TAB_TRANSITION_MS = 280;

function AppRouteSet({ isAuthenticated, user, locationOverride }) {
    return (
        <Routes location={locationOverride}>
            <Route
                path="/login"
                element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />}
            />

            <Route
                path="/"
                element={isAuthenticated ? <HomeDiscoverPage /> : <Navigate to="/login" />}
            />

            <Route
                path="/create-room"
                element={isAuthenticated ? <HomeDiscoverPage /> : <Navigate to="/login" />}
            />

            <Route
                path="/confessions"
                element={isAuthenticated ? <ConfessionRoomPage user={user} /> : <Navigate to="/login" />}
            />

            <Route
                path="/chats"
                element={isAuthenticated ? <ChatPage user={user} /> : <Navigate to="/login" />}
            />

            <Route
                path="/search"
                element={isAuthenticated ? <SearchPage user={user} /> : <Navigate to="/login" />}
            />

            <Route
                path="/profile"
                element={isAuthenticated ? <ProfilePage user={user} /> : <Navigate to="/login" />}
            />

            <Route
                path="/settings"
                element={isAuthenticated ? <SettingsPage user={user} /> : <Navigate to="/login" />}
            />

            <Route
                path="/user/:userId"
                element={isAuthenticated ? <UserProfilePage user={user} /> : <Navigate to="/login" />}
            />

            <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
        </Routes>
    );
}

function MobileGlobalHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const isSearchActive = searchParams.get("search") === "1";

    const handleSearchClick = () => {
        if (location.pathname === "/") {
            if (isSearchActive) {
                navigate("/", { replace: true });
            } else {
                navigate("/?search=1", { replace: true });
            }
        } else if (location.pathname === "/confessions") {
            if (isSearchActive) {
                navigate("/confessions", { replace: true });
            } else {
                navigate("/confessions?search=1", { replace: true });
            }
        } else if (location.pathname === "/search") {
            if (isSearchActive) {
                navigate("/search", { replace: true });
            } else {
                navigate("/search?search=1", { replace: true });
            }
        } else {
            navigate("/search?search=1");
        }
    };

    return (
        <header className="home-mobile-header">
            <div className="home-mobile-brand">
                <div className="home-mobile-brand__mark" aria-hidden="true">
                    <img src={fullymeLogo} alt="FullyMee logo" className="home-brand__logo-img" />
                </div>
                <div className="home-mobile-brand__copy">
                    <strong>FullyMee</strong>
                    <span></span>
                </div>
            </div>

            <div className="home-mobile-header__actions">
                <button
                    type="button"
                    className={`home-mobile-header__action${isSearchActive ? " is-active" : ""}`}
                    onClick={handleSearchClick}
                    aria-label="Search rooms"
                >
                    <Search size={19} strokeWidth={2} />
                </button>
                <button
                    type="button"
                    className="home-mobile-header__action home-mobile-header__action--create"
                    onClick={() => navigate("/create-room", { state: { openCreateRoom: true } })}
                    aria-label="Create room"
                >
                    <Plus size={19} strokeWidth={2} />
                </button>
                <button
                    type="button"
                    className="home-mobile-header__action"
                    onClick={() => navigate("/chats?requests=1")}
                    aria-label="Open notifications"
                >
                    <UserRoundPlus size={19} strokeWidth={2} />
                    <span className="home-mobile-header__dot" aria-hidden="true" />
                </button>
            </div>
        </header>
    );
}

function AnimatedAppRoutes({ isAuthenticated, user }) {
    const location = useLocation();
    const isDesktop = useIsDesktop();
    const [settledLocation, setSettledLocation] = useState(location);
    const [transitionState, setTransitionState] = useState(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const sameRoute =
            settledLocation.pathname === location.pathname &&
            settledLocation.search === location.search &&
            settledLocation.hash === location.hash;

        if (sameRoute) return;

        const shouldAnimate =
            Boolean(location.state && location.state.primaryTabSwipe) &&
            PRIMARY_TAB_ROUTES.includes(settledLocation.pathname) &&
            PRIMARY_TAB_ROUTES.includes(location.pathname);

        if (!shouldAnimate) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            setTransitionState(null);
            setSettledLocation(location);
            return;
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        const direction = location.state && location.state.tabSwipeDirection === "backward" ? "backward" : "forward";
        setTransitionState({
            direction,
            from: settledLocation,
            to: location
        });

        timeoutRef.current = setTimeout(() => {
            setSettledLocation(location);
            setTransitionState(null);
            timeoutRef.current = null;
        }, PRIMARY_TAB_TRANSITION_MS);
    }, [location, settledLocation]);

    const currentLoc = transitionState ? transitionState.to : location;
    const searchParams = new URLSearchParams(currentLoc.search);
    const isLobby = (
        currentLoc.pathname === "/" ||
        (currentLoc.pathname === "/confessions" && !searchParams.get("roomId")) ||
        (currentLoc.pathname === "/chats" && !searchParams.get("conversationId") && searchParams.get("requests") !== "1") ||
        currentLoc.pathname === "/search"
    );
    const showGlobalHeader = !isDesktop && isAuthenticated && isLobby;
    const showGlobalFooter = !isDesktop && isAuthenticated && (
        currentLoc.pathname === "/" ||
        currentLoc.pathname === "/create-room" ||
        (currentLoc.pathname === "/confessions" && !searchParams.get("roomId")) ||
        (currentLoc.pathname === "/chats" && !searchParams.get("conversationId")) ||
        currentLoc.pathname === "/search" ||
        currentLoc.pathname === "/profile"
    );

    const routesNode = transitionState ? (
        <div className={`primary-tab-transition primary-tab-transition--${transitionState.direction}`}>
            <div className="primary-tab-transition__scene primary-tab-transition__scene--outgoing">
                <AppRouteSet
                    isAuthenticated={isAuthenticated}
                    user={user}
                    locationOverride={transitionState.from}
                />
            </div>
            <div className="primary-tab-transition__scene primary-tab-transition__scene--incoming">
                <AppRouteSet
                    isAuthenticated={isAuthenticated}
                    user={user}
                    locationOverride={transitionState.to}
                />
            </div>
        </div>
    ) : (
        <AppRouteSet isAuthenticated={isAuthenticated} user={user} locationOverride={settledLocation} />
    );

    if (showGlobalHeader || showGlobalFooter) {
        return (
            <div className="home-mobile-shell" style={{ width: "100%", maxWidth: "520px", margin: "0 auto", display: "flex", flexDirection: "column" }}>
                {showGlobalHeader && <MobileGlobalHeader />}
                {routesNode}
                {showGlobalFooter && <AppBottomNav />}
            </div>
        );
    }

    return routesNode;
}

export default function Router() {
    const { loading, isAuthenticated, user } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            disconnectSocket();
            return;
        }

        connectSocket().catch(() => { });
    }, [isAuthenticated]);

    if (loading) return <AppLoader />;

    return (
        <BrowserRouter>
            <ErrorBanner />
            <Suspense fallback={<PageLoader />}>
                <AnimatedAppRoutes isAuthenticated={isAuthenticated} user={user} />
            </Suspense>
        </BrowserRouter>
    );
}
