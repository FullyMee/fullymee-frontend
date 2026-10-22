import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Plus, Search, UserRoundPlus } from "lucide-react";
import fullymeLogo from "../assets/fullyme-logo.png";
import useAuth from "../hooks/useAuth.js";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import { AppLoader, PageLoader } from "../components/loaders";
import AppBottomNav from "../components/navigation/AppBottomNav.jsx";
import { connectSocket, disconnectSocket } from "../services/socket.js";
import useIsDesktop from "../hooks/useIsDesktop.js";
import { UnreadProvider } from "../context/UnreadContext.jsx";

const LoginPage         = lazy(() => import("../pages/LoginPage.jsx"));
const HomeDiscoverPage  = lazy(() => import("../pages/HomeDiscoverPage.jsx"));
const ConfessionRoomPage= lazy(() => import("../pages/ConfessionRoomPage.jsx"));
const ChatPage          = lazy(() => import("../pages/ChatPage.jsx"));
const SearchPage        = lazy(() => import("../pages/SearchPage.jsx"));
const ProfilePage       = lazy(() => import("../pages/ProfilePage.jsx"));
const UserProfilePage   = lazy(() => import("../pages/UserProfilePage.jsx"));
const SettingsPage      = lazy(() => import("../pages/SettingsPage.jsx"));

const PRIMARY_TAB_ROUTES = ["/", "/confessions", "/chats", "/search", "/profile", "/settings"];
const PRIMARY_TAB_TRANSITION_MS = 280;

function PrivateRoute({ isAuthenticated, element }) {
    return isAuthenticated ? element : <Navigate to="/login" />;
}

function AppRouteSet({ isAuthenticated, user, locationOverride }) {
    return (
        <Routes location={locationOverride}>
            <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/"            element={<PrivateRoute isAuthenticated={isAuthenticated} element={<HomeDiscoverPage />} />} />
            <Route path="/create-room" element={<PrivateRoute isAuthenticated={isAuthenticated} element={<HomeDiscoverPage />} />} />
            <Route path="/confessions" element={<PrivateRoute isAuthenticated={isAuthenticated} element={<ConfessionRoomPage user={user} />} />} />
            <Route path="/chats"       element={<PrivateRoute isAuthenticated={isAuthenticated} element={<ChatPage user={user} />} />} />
            <Route path="/search"      element={<PrivateRoute isAuthenticated={isAuthenticated} element={<SearchPage user={user} />} />} />
            <Route path="/profile"     element={<PrivateRoute isAuthenticated={isAuthenticated} element={<ProfilePage user={user} />} />} />
            <Route path="/settings"    element={<PrivateRoute isAuthenticated={isAuthenticated} element={<SettingsPage user={user} />} />} />
            <Route path="/user/:userId" element={<PrivateRoute isAuthenticated={isAuthenticated} element={<UserProfilePage user={user} />} />} />
            <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
        </Routes>
    );
}

function MobileGlobalHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const isSearchActive = new URLSearchParams(location.search).get("search") === "1";
    const knownPaths = ["/", "/confessions", "/search"];

    function handleSearchClick() {
        const base = knownPaths.includes(location.pathname) ? location.pathname : "/search";
        const isKnown = knownPaths.includes(location.pathname);
        navigate(isSearchActive ? base : `${base}?search=1`, { replace: isKnown });
    }

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
                <button type="button" className={`home-mobile-header__action${isSearchActive ? " is-active" : ""}`} onClick={handleSearchClick} aria-label="Search rooms">
                    <Search size={19} strokeWidth={2} />
                </button>
                <button type="button" className="home-mobile-header__action home-mobile-header__action--create" onClick={() => navigate("/create-room", { state: { openCreateRoom: true } })} aria-label="Create room">
                    <Plus size={19} strokeWidth={2} />
                </button>
                <button type="button" className="home-mobile-header__action" onClick={() => navigate("/chats?requests=1")} aria-label="Open notifications">
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
    const [transition, setTransition] = useState(null);
    const timeoutRef = useRef(null);

    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

    useEffect(() => {
        const isSame = settledLocation.pathname === location.pathname &&
            settledLocation.search === location.search &&
            settledLocation.hash === location.hash;
        if (isSame) return;

        const shouldAnimate =
            location.state?.primaryTabSwipe &&
            PRIMARY_TAB_ROUTES.includes(settledLocation.pathname) &&
            PRIMARY_TAB_ROUTES.includes(location.pathname);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (!shouldAnimate) {
            setTransition(null);
            setSettledLocation(location);
            return;
        }

        const direction = location.state?.tabSwipeDirection === "backward" ? "backward" : "forward";
        setTransition({ direction, from: settledLocation, to: location });
        timeoutRef.current = setTimeout(() => {
            setSettledLocation(location);
            setTransition(null);
            timeoutRef.current = null;
        }, PRIMARY_TAB_TRANSITION_MS);
    }, [location, settledLocation]);

    const currentLoc = transition ? transition.to : location;
    const sp = new URLSearchParams(currentLoc.search);

    const isLobby = (
        currentLoc.pathname === "/" ||
        (currentLoc.pathname === "/confessions" && !sp.get("roomId")) ||
        (currentLoc.pathname === "/chats" && !sp.get("conversationId") && sp.get("requests") !== "1") ||
        currentLoc.pathname === "/search"
    );
    const isFooter = (
        currentLoc.pathname === "/" ||
        currentLoc.pathname === "/create-room" ||
        (currentLoc.pathname === "/confessions" && !sp.get("roomId")) ||
        (currentLoc.pathname === "/chats" && !sp.get("conversationId")) ||
        currentLoc.pathname === "/search" ||
        currentLoc.pathname === "/profile"
    );

    const showHeader = !isDesktop && isAuthenticated && isLobby;
    const showFooter = !isDesktop && isAuthenticated && isFooter;

    const routesNode = transition ? (
        <div className={`primary-tab-transition primary-tab-transition--${transition.direction}`}>
            <div className="primary-tab-transition__scene primary-tab-transition__scene--outgoing">
                <AppRouteSet isAuthenticated={isAuthenticated} user={user} locationOverride={transition.from} />
            </div>
            <div className="primary-tab-transition__scene primary-tab-transition__scene--incoming">
                <AppRouteSet isAuthenticated={isAuthenticated} user={user} locationOverride={transition.to} />
            </div>
        </div>
    ) : (
        <AppRouteSet isAuthenticated={isAuthenticated} user={user} locationOverride={settledLocation} />
    );

    if (showHeader || showFooter) {
        return (
            <div className="home-mobile-shell" style={{ width: "100%", maxWidth: "520px", margin: "0 auto", display: "flex", flexDirection: "column" }}>
                {showHeader && <MobileGlobalHeader />}
                {routesNode}
                {showFooter && <AppBottomNav />}
            </div>
        );
    }

    return routesNode;
}

export default function Router() {
    const { loading, isAuthenticated, user } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) { disconnectSocket(); return; }
        connectSocket().catch(() => {});
    }, [isAuthenticated]);

    if (loading) return <AppLoader />;

    return (
        <BrowserRouter>
            <UnreadProvider isAuthenticated={isAuthenticated} userId={user?.userId}>
                <ErrorBanner />
                <Suspense fallback={<PageLoader />}>
                    <AnimatedAppRoutes isAuthenticated={isAuthenticated} user={user} />
                </Suspense>
            </UnreadProvider>
        </BrowserRouter>
    );
}
