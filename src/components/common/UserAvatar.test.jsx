import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import UserAvatar from "./UserAvatar.jsx";

describe("<UserAvatar />", () => {
    it("renders image with default alt text and user-avatar class", () => {
        render(<UserAvatar avatarId="flowing_waterfall" />);
        const img = screen.getByRole("img", { name: /user avatar/i });
        expect(img).toBeInTheDocument();
        expect(img).toHaveClass("user-avatar");
        expect(img).toHaveAttribute("draggable", "false");
    });

    it("applies custom alt text when provided", () => {
        render(<UserAvatar avatarId="cracked_mirror" alt="Profile of User" />);
        const img = screen.getByRole("img", { name: "Profile of User" });
        expect(img).toBeInTheDocument();
    });

    it("appends custom className cleanly", () => {
        render(<UserAvatar avatarId="empty_swing" className="custom-avatar-ring" />);
        const img = screen.getByRole("img");
        expect(img).toHaveClass("user-avatar");
        expect(img).toHaveClass("custom-avatar-ring");
    });

    it("renders fallback image for unknown or undefined avatarId", () => {
        render(<UserAvatar avatarId="unknown_id_123" />);
        const img = screen.getByRole("img");
        expect(img).toBeInTheDocument();
        expect(img.getAttribute("src")).toBeTruthy();
    });
});
