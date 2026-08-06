import React from "react";
import { useNavigate } from "react-router-dom";
import { getAliasTone, getInitial } from "../../../utils/presentation.js";
import { formatRelativeTime } from "../../../utils/time.js";
import UserAvatar from "../../../components/common/UserAvatar.jsx";

export default function RoomMembersRail({ activeRoom, roomMembers }) {
    if (!activeRoom) return null;

    const members = Array.isArray(roomMembers) ? roomMembers : [];

    const navigate = useNavigate();

    return (
        <aside className="confession-room-rail" aria-label="Room details">
            <section className="confession-room-rail__section confession-room-rail__section--list">
                <div className="confession-room-rail__list-head">
                    <h3>People here</h3>
                    <span>{members.length} active</span>
                </div>

                <div className="confession-room-rail__list">
                    {members.length > 0 ? members.map((member) => {
                        const alias = String(member.alias || "").trim();
                        const isSelf = alias && String(activeRoom.alias || "").trim() === alias;
                        const handleMemberClick = () => {
                            const target = alias || member.userId;
                            if (target) {
                                navigate(`/user/${target}`, {
                                    state: { profileUser: { username: alias, isAlias: true } }
                                });
                            }
                        };
                        return (
                            <div 
                                key={`${member.userId || alias}-${member.joinedAt || ""}`} 
                                className="confession-room-rail__member"
                                onClick={handleMemberClick}
                                style={{ cursor: alias || member.userId ? 'pointer' : 'default' }}
                            >
                                <UserAvatar avatarId={member.avatar} className="confession-room-rail__avatar" />
                                <div className="confession-room-rail__member-copy">
                                    <strong>{alias || "Anonymous"}</strong>
                                    <span>{formatRelativeTime(member.joinedAt, { short: true, nowLabel: "now" })}</span>
                                </div>
                                {isSelf && <span className="confession-room-rail__badge">You</span>}
                            </div>
                        );
                    }) : (
                        <div className="confession-room-rail__empty">Loading active members...</div>
                    )}
                </div>
            </section>
        </aside>
    );
}
