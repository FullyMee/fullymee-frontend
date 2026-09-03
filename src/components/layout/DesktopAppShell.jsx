import UnifiedSidebar from "./UnifiedSidebar.jsx";
import { useUnread } from "../../context/UnreadContext.jsx";

export default function DesktopAppShell({
    title,
    subtitle,
    primaryAction = null,
    topBar = null,
    children,
    rightRail = null,
    hideStageHeader = false,
    contentClassName = "",
    sidebarRooms = [],
    selectedSidebarRoomId = 0,
    onSelectSidebarRoom = null,
    pendingMessageCount = 0
}) {
    const { totalUnreadCount } = useUnread();
    const effectivePendingMessageCount = Number.isFinite(pendingMessageCount) && pendingMessageCount > 0
        ? pendingMessageCount
        : totalUnreadCount;

    return (
        <div className="desktop-app-shell">
            <UnifiedSidebar
                rooms={sidebarRooms}
                selectedRoomId={selectedSidebarRoomId}
                onSelectRoom={onSelectSidebarRoom}
                pendingMessageCount={effectivePendingMessageCount}
            />

            <div className="desktop-app-shell__stage">
                {topBar && (
                    <div className="desktop-app-shell__topbar">
                        {topBar}
                    </div>
                )}

                {!hideStageHeader && (
                    <header className="desktop-stage__header">
                        <div className="desktop-stage__heading">
                            <h1>{title}</h1>
                            {subtitle ? <p>{subtitle}</p> : null}
                        </div>
                        {primaryAction && <div className="desktop-stage__action">{primaryAction}</div>}
                    </header>
                )}

                <div className={`desktop-stage__content${hideStageHeader ? " is-headerless" : ""}${rightRail ? " has-rail" : ""}${topBar ? " has-topbar" : ""}${contentClassName ? ` ${contentClassName}` : ""}`}>
                    <main className="desktop-stage__main">{children}</main>
                    {rightRail}
                </div>
            </div>
        </div>
    );
}
