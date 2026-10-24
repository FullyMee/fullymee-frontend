import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CommunityHubRail from "./CommunityHubRail.jsx";

describe("<CommunityHubRail />", () => {
    const mockRooms = [
        { roomId: 1, title: "Midnight Solitude", currentUserCount: 15 },
        { roomId: 2, title: "Healing Waves", currentUserCount: 42 }
    ];

    it("renders Community Pulse stats accurately", () => {
        render(
            <CommunityHubRail
                activeRooms={12}
                confessionsToday={150}
                supportGiven={300}
            />
        );

        expect(screen.getByText("Community Pulse")).toBeInTheDocument();
        expect(screen.getByText("12")).toBeInTheDocument();
        expect(screen.getByText("150")).toBeInTheDocument();
        expect(screen.getByText("300")).toBeInTheDocument();
    });

    it("renders suggested room list and triggers onJoinRoom on click", () => {
        const handleJoin = vi.fn();
        render(
            <CommunityHubRail
                rooms={mockRooms}
                onJoinRoom={handleJoin}
            />
        );

        expect(screen.getByText("Midnight Solitude")).toBeInTheDocument();
        expect(screen.getByText("15 members")).toBeInTheDocument();
        expect(screen.getByText("Healing Waves")).toBeInTheDocument();
        expect(screen.getByText("42 members")).toBeInTheDocument();

        const avatarImages = screen.getAllByRole("img");
        expect(avatarImages.length).toBe(2);

        const joinButtons = screen.getAllByRole("button", { name: /join/i });
        expect(joinButtons).toHaveLength(2);

        fireEvent.click(joinButtons[0]);
        expect(handleJoin).toHaveBeenCalledWith(mockRooms[0]);
    });

    it("displays emptyMessage when rooms list is empty", () => {
        render(
            <CommunityHubRail
                rooms={[]}
                emptyMessage="No circle suggestions available."
            />
        );

        expect(screen.getByText("No circle suggestions available.")).toBeInTheDocument();
    });

    it("renders Safety First card", () => {
        render(<CommunityHubRail />);
        expect(screen.getByText("Safety First")).toBeInTheDocument();
        expect(screen.getByText(/your identity stays yours/i)).toBeInTheDocument();
    });

    it("toggles footer based on showFooter prop", () => {
        const { rerender } = render(<CommunityHubRail showFooter={false} />);
        expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();

        rerender(<CommunityHubRail showFooter={true} />);
        const footer = screen.getByRole("contentinfo");
        expect(footer).toBeInTheDocument();
        expect(screen.getByText(/Privacy/i)).toBeInTheDocument();
        expect(screen.getByText(/Terms/i)).toBeInTheDocument();
        expect(screen.getByText(/Guidelines/i)).toBeInTheDocument();
    });
});
