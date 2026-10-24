import React from "react";
import { PenSquare, ArrowRight } from "lucide-react";
import heroSunset from "../../assets/hero-sunset.png";
import heroAvatar1 from "../../assets/hero-avatar-1.png";
import heroAvatar2 from "../../assets/hero-avatar-2.png";
import heroAvatar3 from "../../assets/hero-avatar-3.png";

export default function HomeHeroSection({ pulsePeople = 28, onShare }) {
    return (
        <section className="home-hero" aria-label="Welcome banner">
            <div className="home-hero__bg">
                <img
                    src={heroSunset}
                    alt="Warm sunset over mountains"
                    className="home-hero__bg-img"
                />
                <div className="home-hero__bg-gradient" aria-hidden="true" />
                <div className="home-hero__quote" aria-hidden="true">
                    <span className="home-hero__quote-line">Real people.</span>
                    <span className="home-hero__quote-line">Real feelings.</span>
                    <span className="home-hero__quote-line">Always anonymous.</span>
                    <svg
                        className="home-hero__quote-heart"
                        viewBox="0 0 24 24"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                </div>
            </div>

            <div className="home-hero__content">
                <div className="home-hero__badge">
                    <div className="home-hero__badge-avatars" aria-hidden="true">
                        <img src={heroAvatar1} alt="" className="home-hero__avatar" />
                        <img src={heroAvatar2} alt="" className="home-hero__avatar" />
                        <img src={heroAvatar3} alt="" className="home-hero__avatar" />
                    </div>
                    <span className="home-hero__badge-dot" aria-hidden="true" />
                    <span className="home-hero__badge-text">{pulsePeople} people are sharing right now</span>
                </div>

                <h1>
                    <span className="home-hero__title-line">You don’t have</span>
                    <span className="home-hero__title-line">to carry it <em>alone.</em></span>
                </h1>

                <p>Find your people. Share anonymously. Feel a little lighter.</p>

                <button
                    type="button"
                    className="home-hero__cta"
                    onClick={onShare}
                    id="home-hero-share-btn"
                >
                    <PenSquare size={16} aria-hidden="true" />
                    <span>Share anonymously</span>
                    <ArrowRight size={16} aria-hidden="true" />
                </button>
            </div>
        </section>
    );
}
