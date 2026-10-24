import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HomeHeroSection from "./HomeHeroSection.jsx";

describe("<HomeHeroSection />", () => {
    it("renders the hero banner with accessible label and background", () => {
        render(<HomeHeroSection pulsePeople={35} onShare={vi.fn()} />);

        const section = screen.getByRole("region", { name: /welcome banner/i });
        expect(section).toBeInTheDocument();

        const bgImage = screen.getByAltText(/warm sunset over mountains/i);
        expect(bgImage).toBeInTheDocument();
    });

    it("displays the live pulse badge with the dynamic people count", () => {
        render(<HomeHeroSection pulsePeople={42} onShare={vi.fn()} />);

        expect(screen.getByText(/42 people are sharing right now/i)).toBeInTheDocument();
    });

    it("renders the 2-line headline with styled emphasis on alone", () => {
        render(<HomeHeroSection pulsePeople={28} onShare={vi.fn()} />);

        expect(screen.getByText(/you don’t have/i)).toBeInTheDocument();
        expect(screen.getByText(/to carry it/i)).toBeInTheDocument();
        const emphasized = screen.getByText(/alone\./i);
        expect(emphasized).toBeInTheDocument();
        expect(emphasized.tagName.toLowerCase()).toBe("em");
    });

    it("renders the inspirational subtitle", () => {
        render(<HomeHeroSection pulsePeople={28} onShare={vi.fn()} />);

        expect(
            screen.getByText(/find your people\. share anonymously\. feel a little lighter\./i)
        ).toBeInTheDocument();
    });

    it("renders the artistic handwritten quote in the sky overlay", () => {
        render(<HomeHeroSection pulsePeople={28} onShare={vi.fn()} />);

        expect(screen.getByText("Real people.")).toBeInTheDocument();
        expect(screen.getByText("Real feelings.")).toBeInTheDocument();
        expect(screen.getByText("Always anonymous.")).toBeInTheDocument();
    });

    it("renders the CTA button and calls onShare when clicked", () => {
        const handleShare = vi.fn();
        render(<HomeHeroSection pulsePeople={28} onShare={handleShare} />);

        const button = screen.getByRole("button", { name: /share anonymously/i });
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(handleShare).toHaveBeenCalledTimes(1);
    });

    it("renders default dynamic user avatars when users prop is not provided", () => {
        render(<HomeHeroSection pulsePeople={28} onShare={vi.fn()} />);

        const avatars = screen.getAllByRole("img", { name: "User" });
        expect(avatars).toHaveLength(3);
        avatars.forEach((avatar) => {
            expect(avatar).toHaveClass("home-hero__avatar");
            expect(avatar).toHaveClass("user-avatar");
            expect(avatar.getAttribute("src")).toBeTruthy();
        });
    });

    it("renders dynamic user-based avatars when custom users prop is provided", () => {
        const customUsers = [
            { avatarId: "cracked_mirror", name: "Alice" },
            { avatarId: "empty_swing", name: "Bob" },
            { avatarId: "locked_diary", name: "Charlie" },
            { avatarId: "silent_forest", name: "Dave" } // 4th should be capped at 3
        ];
        render(<HomeHeroSection pulsePeople={50} users={customUsers} onShare={vi.fn()} />);

        expect(screen.getByRole("img", { name: "Alice" })).toBeInTheDocument();
        expect(screen.getByRole("img", { name: "Bob" })).toBeInTheDocument();
        expect(screen.getByRole("img", { name: "Charlie" })).toBeInTheDocument();
        expect(screen.queryByRole("img", { name: "Dave" })).not.toBeInTheDocument();
    });

    it("handles string-based users array seamlessly", () => {
        const stringUsers = ["silent_forest", "broken_constellation"];
        render(<HomeHeroSection pulsePeople={12} users={stringUsers} onShare={vi.fn()} />);

        expect(screen.getByRole("img", { name: "silent_forest" })).toBeInTheDocument();
        expect(screen.getByRole("img", { name: "broken_constellation" })).toBeInTheDocument();
    });
});
