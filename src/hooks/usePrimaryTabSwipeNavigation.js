import { useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PRIMARY_TAB_ROUTES = ["/", "/confessions", "/chats", "/search", "/profile"];
const MIN_HORIZONTAL_SWIPE_PX = 72;
const DIRECTION_LOCK_THRESHOLD_PX = 10;
const HORIZONTAL_INTENT_RATIO = 1.15;
const SUPPRESS_CLICK_AFTER_SWIPE_MS = 320;
const SWIPE_IGNORE_SELECTOR = "input, textarea, select, [contenteditable='true'], .discover-bottom-nav";

function getRouteIndex(pathname) {
    return PRIMARY_TAB_ROUTES.findIndex((route) => route === pathname);
}

export default function usePrimaryTabSwipeNavigation({ enabled = true } = {}) {
    const navigate = useNavigate();
    const location = useLocation();
    const suppressClickUntilRef = useRef(0);
    const gestureRef = useRef({
        active: false,
        ignore: false,
        lock: null,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0
    });

    const currentIndex = getRouteIndex(location.pathname);
    const canSwipe = enabled && currentIndex !== -1;

    const resetGesture = useCallback(() => {
        gestureRef.current = {
            active: false,
            ignore: false,
            lock: null,
            startX: 0,
            startY: 0,
            lastX: 0,
            lastY: 0
        };
    }, []);

    const onTouchStart = useCallback((event) => {
        if (!canSwipe || event.touches.length !== 1) {
            resetGesture();
            return;
        }

        const target = event.target;
        const shouldIgnore = Boolean(
            target &&
            typeof target.closest === "function" &&
            target.closest(SWIPE_IGNORE_SELECTOR)
        );

        const touch = event.touches[0];
        gestureRef.current = {
            active: true,
            ignore: shouldIgnore,
            lock: null,
            startX: touch.clientX,
            startY: touch.clientY,
            lastX: touch.clientX,
            lastY: touch.clientY
        };
    }, [canSwipe, resetGesture]);

    const onTouchMove = useCallback((event) => {
        const gesture = gestureRef.current;
        if (!gesture.active || gesture.ignore || event.touches.length !== 1) return;

        const touch = event.touches[0];
        gesture.lastX = touch.clientX;
        gesture.lastY = touch.clientY;

        if (gesture.lock === "x") {
            if (event.cancelable) {
                event.preventDefault();
            }
            return;
        }

        if (gesture.lock) return;

        const deltaX = touch.clientX - gesture.startX;
        const deltaY = touch.clientY - gesture.startY;

        if (
            Math.abs(deltaX) < DIRECTION_LOCK_THRESHOLD_PX &&
            Math.abs(deltaY) < DIRECTION_LOCK_THRESHOLD_PX
        ) {
            return;
        }

        gesture.lock = Math.abs(deltaX) > Math.abs(deltaY) * HORIZONTAL_INTENT_RATIO ? "x" : "y";

        if (gesture.lock === "x" && event.cancelable) {
            event.preventDefault();
        }
    }, []);

    const onTouchEnd = useCallback(() => {
        const gesture = gestureRef.current;

        if (!canSwipe || !gesture.active || gesture.ignore) {
            resetGesture();
            return;
        }

        const deltaX = gesture.lastX - gesture.startX;
        const deltaY = gesture.lastY - gesture.startY;
        const isHorizontalSwipe =
            gesture.lock === "x" &&
            Math.abs(deltaX) >= MIN_HORIZONTAL_SWIPE_PX &&
            Math.abs(deltaX) > Math.abs(deltaY) * HORIZONTAL_INTENT_RATIO;

        if (!isHorizontalSwipe) {
            resetGesture();
            return;
        }

        const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex >= 0 && nextIndex < PRIMARY_TAB_ROUTES.length) {
            suppressClickUntilRef.current = Date.now() + SUPPRESS_CLICK_AFTER_SWIPE_MS;
            navigate(PRIMARY_TAB_ROUTES[nextIndex], {
                state: {
                    primaryTabSwipe: true,
                    tabSwipeDirection: deltaX < 0 ? "forward" : "backward",
                    tabSwipeAt: Date.now()
                }
            });
        }

        resetGesture();
    }, [canSwipe, currentIndex, navigate, resetGesture]);

    const onTouchCancel = useCallback(() => {
        resetGesture();
    }, [resetGesture]);

    const onClickCapture = useCallback((event) => {
        if (Date.now() < suppressClickUntilRef.current) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, []);

    return useMemo(() => ({
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onTouchCancel,
        onClickCapture
    }), [onClickCapture, onTouchCancel, onTouchEnd, onTouchMove, onTouchStart]);
}
