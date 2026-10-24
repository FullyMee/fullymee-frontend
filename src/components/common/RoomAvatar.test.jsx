import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RoomAvatar from "./RoomAvatar.jsx";

describe("<RoomAvatar />", () => {
    it("renders circle image when room has ambienceId", () => {
        const room = {
            roomId: 101,
            title: "Floating Clouds Perspective",
            ambienceId: "floating_clouds"
        };

        render(<RoomAvatar room={room} alt="Floating Clouds" />);

        const img = screen.getByRole("img", { name: "Floating Clouds" });
        expect(img).toBeInTheDocument();
        expect(img.getAttribute("src")).toContain("floating_clouds.png");
        expect(img.className).toContain("room-avatar__img");
    });

    it("renders circle image when room provides direct image or coverImage URL", () => {
        const roomWithImage = {
            roomId: 102,
            title: "Custom Sunset Room",
            image: "https://example.com/custom-sunset.jpg"
        };

        render(<RoomAvatar room={roomWithImage} alt="Custom Sunset" />);

        const img = screen.getByRole("img", { name: "Custom Sunset" });
        expect(img).toBeInTheDocument();
        expect(img.getAttribute("src")).toBe("https://example.com/custom-sunset.jpg");
    });

    it("renders circle image based on category when ambienceId is omitted", () => {
        const room = {
            roomId: 103,
            title: "Friendly Advice Room",
            category: "relationships"
        };

        render(<RoomAvatar room={room} alt="Advice" />);

        const img = screen.getByRole("img", { name: "Advice" });
        expect(img).toBeInTheDocument();
        expect(img.getAttribute("src")).toContain("cherry_blossoms.png");
    });

    it("renders circle image based on title keyword matching heuristic", () => {
        const room = {
            roomId: 104,
            title: "Northern Lights Memories"
        };

        render(<RoomAvatar room={room} alt="Northern Lights" />);

        const img = screen.getByRole("img", { name: "Northern Lights" });
        expect(img).toBeInTheDocument();
        expect(img.getAttribute("src")).toContain("northern_sky.png");
    });

    it("falls back to default ambience image when room is empty or unknown", () => {
        render(<RoomAvatar room={null} alt="Fallback Circle" />);

        const img = screen.getByRole("img", { name: "Fallback Circle" });
        expect(img).toBeInTheDocument();
        expect(img.getAttribute("src")).toContain("moonlit_window.png");
    });

    it("renders fallback glyph when the image encounters an error", () => {
        const room = {
            roomId: 105,
            title: "Broken Image Room",
            image: "https://example.com/non-existent.png",
            category: "career"
        };

        render(<RoomAvatar room={room} alt="Broken Room" />);

        const img = screen.getByRole("img", { name: "Broken Room" });
        expect(img).toBeInTheDocument();

        // Trigger onError
        fireEvent.error(img);

        // Image should be removed and fallback glyph rendered
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
        const fallback = screen.getByTestId("room-avatar-fallback");
        expect(fallback).toBeInTheDocument();
        expect(fallback.className).toContain("room-avatar--fallback");
    });

    it("applies custom size and className props", () => {
        const room = {
            roomId: 106,
            title: "Sized Room",
            ambienceId: "calm_lake"
        };

        render(
            <RoomAvatar
                room={room}
                size="2.5rem"
                className="custom-circle-class"
                alt="Sized"
            />
        );

        const container = screen.getByTestId("room-avatar");
        expect(container.className).toContain("custom-circle-class");
        expect(container.style.width).toBe("2.5rem");
        expect(container.style.height).toBe("2.5rem");
    });
});
