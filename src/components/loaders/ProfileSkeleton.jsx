import React from "react";
import Skeleton from "./Skeleton.jsx";

/**
 * Profile page skeleton — matches actual profile page layout on desktop and mobile.
 *
 * @param {Object} props
 * @param {boolean} [props.isDesktop=false] - Whether to render desktop profile grid layout
 * @param {number} [props.roomCount=5] - Dynamic number of joined rooms / story bubbles / cards
 * @param {string} [props.className=""] - Extra CSS class
 */
export default function ProfileSkeleton({ isDesktop = false, roomCount = 5, className = "" }) {
    const dynamicCount = Math.max(1, Number(roomCount) || 5);

    if (isDesktop) {
        return (
            <div className={`desktop-profile-grid fm-profile-skeleton--desktop ${className}`.trim()} aria-hidden="true">
                {/* 1. Hero Banner Card */}
                <section className="desktop-profile-banner-card" style={{ width: "100%" }}>
                    <div className="desktop-profile-banner-card__gradient" />
                    <div className="desktop-profile-banner-card__bottom">
                        <div className="desktop-profile-banner-card__avatar-shell">
                            <div className="desktop-profile-banner-card__avatar" style={{ background: "transparent" }}>
                                <Skeleton variant="circle" width="100%" height="100%" />
                            </div>
                        </div>
                        <div className="desktop-profile-banner-card__info" style={{ display: "flex", flexDirection: "column", gap: "0.45rem", flex: 1 }}>
                            <Skeleton width="40%" height="1.8rem" />
                            <Skeleton width="20%" height="0.95rem" />
                        </div>
                        <div className="desktop-profile-banner-card__actions">
                            <Skeleton width="6.8rem" height="2.35rem" borderRadius="999px" />
                        </div>
                    </div>
                </section>

                {/* 2. Stats Row (3 equal-width boxes) */}
                <section className="desktop-profile-stats-row" style={{ width: "100%" }}>
                    {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="desktop-profile-stat-box">
                            <Skeleton variant="circle" width="3rem" height="3rem" style={{ flexShrink: 0 }} />
                            <div className="desktop-profile-stat-box__info">
                                <Skeleton width="2.5rem" height="1.5rem" />
                                <Skeleton width="6.5rem" height="0.85rem" />
                            </div>
                        </div>
                    ))}
                </section>

                {/* 3. Joined Rooms Section Card with Horizontal Scroll Ambience Room Cards */}
                <section className="desktop-profile-section-card" style={{ width: "100%" }}>
                    <div className="desktop-profile-section-card__head" style={{ marginBottom: "1.2rem" }}>
                        <Skeleton width="220px" height="1.5rem" />
                    </div>

                    <div className="uprofile-rooms-scroll-container">
                        {Array.from({ length: dynamicCount }, (_, j) => (
                            <div key={j} className="ambience-room-card-skeleton">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Skeleton width="82px" height="24px" borderRadius="999px" />
                                    <Skeleton variant="circle" width="22px" height="22px" />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <Skeleton width="88%" height="1.35rem" borderRadius="6px" />
                                    <Skeleton width="55%" height="0.9rem" borderRadius="4px" />
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.6rem" }}>
                                        <Skeleton width="65px" height="0.75rem" borderRadius="4px" />
                                        <Skeleton width="70px" height="26px" borderRadius="999px" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. Privacy Banner */}
                <section className="desktop-privacy-banner" style={{ width: "100%", opacity: 0.9 }}>
                    <Skeleton width="220px" height="1.35rem" style={{ marginBottom: "0.7rem", background: "rgba(255,255,255,0.18)" }} />
                    <Skeleton width="95%" height="0.95rem" style={{ marginBottom: "0.4rem", background: "rgba(255,255,255,0.12)" }} />
                    <Skeleton width="70%" height="0.95rem" style={{ background: "rgba(255,255,255,0.12)" }} />
                </section>
            </div>
        );
    }

    return (
        <main className={`profile-mobile-redesign__content fm-profile-skeleton--mobile ${className}`.trim()} aria-hidden="true">
            {/* 1. Top Header Card: Avatar + Stats + Bio + Action */}
            <section className="profile-redesign__header-card">
                <div className="profile-redesign__top-row">
                    <div className="profile-redesign__avatar-wrapper">
                        <Skeleton variant="circle" width="76px" height="76px" />
                    </div>
                    <div className="profile-redesign__stats-group">
                        <div className="profile-redesign__stat-item" style={{ gap: "0.25rem" }}>
                            <Skeleton width="2rem" height="1.35rem" />
                            <Skeleton width="3.5rem" height="0.75rem" />
                        </div>
                        <div className="profile-redesign__stat-item" style={{ gap: "0.25rem" }}>
                            <Skeleton width="1.8rem" height="1.35rem" />
                            <Skeleton width="2.5rem" height="0.75rem" />
                        </div>
                        <div className="profile-redesign__stat-item" style={{ gap: "0.25rem" }}>
                            <Skeleton width="1.5rem" height="1.35rem" />
                            <Skeleton width="2.5rem" height="0.75rem" />
                        </div>
                    </div>
                </div>

                <div className="profile-redesign__bio-block">
                    <Skeleton width="55%" height="1.25rem" />
                    <Skeleton width="72%" height="0.85rem" />
                    <div className="profile-redesign__badges-row">
                        <Skeleton width="5.2rem" height="1.35rem" borderRadius="999px" />
                    </div>
                </div>

                <div className="profile-redesign__actions-row">
                    <Skeleton width="100%" height="2.75rem" borderRadius="12px" />
                </div>
            </section>

            {/* 2. Story Bubbles Row (Dynamic based on roomCount) */}
            <section className="profile-redesign__bubbles-section">
                <div className="profile-redesign__bubbles-scroll">
                    {Array.from({ length: dynamicCount }, (_, idx) => (
                        <div key={idx} className="profile-story-bubble">
                            <Skeleton variant="circle" width="58px" height="58px" />
                            <Skeleton width="48px" height="0.7rem" borderRadius="4px" />
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Section Tabs Bar */}
            <nav className="profile-redesign__tabs-nav">
                <div className="profile-tab-btn">
                    <Skeleton width="22px" height="22px" borderRadius="4px" />
                </div>
                <div className="profile-tab-btn">
                    <Skeleton width="22px" height="22px" borderRadius="4px" />
                </div>
                <div className="profile-tab-btn">
                    <Skeleton width="22px" height="22px" borderRadius="4px" />
                </div>
            </nav>

            {/* 4. Emotional Weather Card */}
            <section className="profile-redesign__card profile-weather-card">
                <div className="profile-weather-card__header">
                    <Skeleton width="38%" height="0.75rem" />
                    <Skeleton variant="circle" width="18px" height="18px" />
                </div>
                <Skeleton width="45%" height="1.35rem" style={{ margin: "0.2rem 0 0.8rem" }} />
                <div className="profile-weather-card__days-row">
                    {Array.from({ length: 7 }, (_, d) => (
                        <div key={d} className="profile-weather-card__day" style={{ alignItems: "center", gap: "0.3rem" }}>
                            <Skeleton width="14px" height="14px" borderRadius="2px" />
                            <Skeleton variant="circle" width="6px" height="6px" />
                        </div>
                    ))}
                </div>
                <Skeleton width="65%" height="0.75rem" style={{ marginTop: "0.6rem" }} />
            </section>

            {/* 5. Expression Section */}
            <section className="profile-redesign__section">
                <div className="profile-redesign__section-title-row">
                    <Skeleton width="30%" height="1.3rem" />
                    <Skeleton variant="circle" width="18px" height="18px" />
                </div>
                <div className="profile-redesign__expression-grid">
                    {Array.from({ length: 3 }, (_, e) => (
                        <div key={e} className="expression-pill-card" style={{ gap: "0.3rem" }}>
                            <Skeleton width="2rem" height="1.6rem" />
                            <Skeleton width="3.5rem" height="0.75rem" />
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
