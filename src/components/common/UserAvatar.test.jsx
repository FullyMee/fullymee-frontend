import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UserAvatar from "./UserAvatar.jsx";
import { AVATAR_OPTIONS, getDeterministicAvatarId } from "../../constants/avatars";

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

    it("renders each of the 7 avatar options correctly", () => {
        AVATAR_OPTIONS.forEach((opt) => {
            const { unmount } = render(<UserAvatar avatarId={opt.id} alt={opt.name} />);
            const img = screen.getByRole("img", { name: opt.name });
            expect(img).toBeInTheDocument();
            expect(img.getAttribute("src")).toBe(opt.image);
            unmount();
        });
    });

    it("resolves deterministically using seed when avatarId is absent", () => {
        const seedAlias = "silentsparrow85";
        const expectedId = getDeterministicAvatarId(seedAlias);
        const expectedOption = AVATAR_OPTIONS.find(a => a.id === expectedId);

        render(<UserAvatar seed={seedAlias} alt="Seeded Avatar" />);
        const img = screen.getByRole("img", { name: "Seeded Avatar" });
        expect(img).toBeInTheDocument();
        expect(img.getAttribute("src")).toBe(expectedOption.image);
    });

    it("supports direct URL avatar strings", () => {
        const customUrl = "https://example.com/custom-avatar.png";
        render(<UserAvatar avatarId={customUrl} alt="URL Avatar" />);
        const img = screen.getByRole("img", { name: "URL Avatar" });
        expect(img.getAttribute("src")).toBe(customUrl);
    });

    it("renders fallback image for unknown or undefined avatarId", () => {
        render(<UserAvatar avatarId="unknown_id_123" />);
        const img = screen.getByRole("img");
        expect(img).toBeInTheDocument();
        expect(img.getAttribute("src")).toBeTruthy();
    });

    it("handles image load errors with onError and falls back to default avatar", () => {
        const onErrorMock = vi.fn();
        render(<UserAvatar avatarId="https://example.com/broken.png" onError={onErrorMock} />);
        const img = screen.getByRole("img");
        
        fireEvent.error(img);
        expect(onErrorMock).toHaveBeenCalledTimes(1);
        expect(img.getAttribute("src")).toBeTruthy();
    });
});

