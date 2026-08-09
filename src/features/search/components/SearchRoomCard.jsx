import React from "react";
import { AmbienceRoomCard } from "../../../components/common/MobileRoomVisuals.jsx";

export default function SearchRoomCard({ room, isJoined, isBusy, onAction }) {
    return (
        <AmbienceRoomCard
            room={room}
            isJoined={isJoined}
            isBusy={isBusy}
            onAction={onAction}
        />
    );
}
