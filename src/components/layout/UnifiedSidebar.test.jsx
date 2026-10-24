import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UnifiedSidebar from "./UnifiedSidebar.jsx";

vi.mock("../../hooks/useAuth.js", () => ({
    default: () => ({
        user: { username: "clever.hawk4959", avatar: "broken_constellation" },
        loading: false,
        isAuthenticated: true
    })
}));

describe("<UnifiedSidebar />", () => {
    const mockRooms = [
        { roomId: 1, title: "Northern Lights Memories", ambienceId: "northern_sky" },
        { roomId: 2, title: "Undelivered Goodbye", ambienceId: "broken_letter" }
    ];

    it("renders navigation links and brand logo", () => {
        render(
            <MemoryRouter initialEntries={["/"]}>
                <UnifiedSidebar rooms={mockRooms} />
            </MemoryRouter>
        );

        expect(screen.getByText("FullyMee")).toBeInTheDocument();
        expect(screen.getByText("Home")).toBeInTheDocument();
        expect(screen.getByText("Fumes")).toBeInTheDocument();
        expect(screen.getByText("Messages")).toBeInTheDocument();
        expect(screen.getByText("Explore")).toBeInTheDocument();
    });

    it("renders 'My Circles' section with room avatar images", () => {
        render(
            <MemoryRouter initialEntries={["/"]}>
                <UnifiedSidebar rooms={mockRooms} />
            </MemoryRouter>
        );

        expect(screen.getByText("My Circles")).toBeInTheDocument();
        expect(screen.getByText("Northern Lights Memories")).toBeInTheDocument();
        expect(screen.getByText("Undelivered Goodbye")).toBeInTheDocument();

        // Verify room avatar images are rendered inside the room pills
        const roomImages = screen.getAllByRole("img");
        expect(roomImages).toHaveLength(2);
        expect(screen.getByRole("img", { name: "Northern Lights Memories" })).toBeInTheDocument();
        expect(screen.getByRole("img", { name: "Undelivered Goodbye" })).toBeInTheDocument();
    });

    it("calls onSelectRoom when a circle pill is clicked", () => {
        const handleSelect = vi.fn();
        render(
            <MemoryRouter initialEntries={["/"]}>
                <UnifiedSidebar rooms={mockRooms} onSelectRoom={handleSelect} />
            </MemoryRouter>
        );

        const circlePill = screen.getByRole("button", { name: /northern lights memories/i });
        fireEvent.click(circlePill);

        expect(handleSelect).toHaveBeenCalledTimes(1);
        expect(handleSelect).toHaveBeenCalledWith(mockRooms[0]);
    });

    it("renders empty state message when no circles are joined", () => {
        render(
            <MemoryRouter initialEntries={["/"]}>
                <UnifiedSidebar rooms={[]} />
            </MemoryRouter>
        );

        expect(screen.getByText("Join circles to see them here.")).toBeInTheDocument();
    });

    it("displays pending message badge when count > 0", () => {
        render(
            <MemoryRouter initialEntries={["/"]}>
                <UnifiedSidebar rooms={mockRooms} pendingMessageCount={5} />
            </MemoryRouter>
        );

        expect(screen.getByText("5")).toBeInTheDocument();
    });
});
