import React from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import UserAvatar from "../../../components/common/UserAvatar.jsx";

export default function SearchUserCard({ person, isBusy, onRemove, onClickCard }) {
    const navigate = useNavigate();
    if (!person) return null;

    const username = person.username || `user_${person.id || person.userId}`;
    const targetUserId = person.username || person.userId || person.id;

    const handleSelect = () => {
        if (onClickCard) onClickCard(person);
        navigate(`/user/${targetUserId}`, { state: { profileUser: person } });
    };

    return (
        <article className="search-person-card">
            <UserAvatar 
                avatarId={person.avatar} 
                className="search-person-card__avatar"
                onClick={handleSelect}
                style={{ cursor: "pointer", display: "block" }}
                role="button"
                tabIndex={0}
            />

            <div className="search-person-card__body">
                <div className="search-person-card__topline">
                    <div>
                        <h3
                            onClick={handleSelect}
                            style={{ cursor: "pointer", margin: 0 }}
                        >
                            {username}
                        </h3>
                    </div>
                    {typeof onRemove === "function" && (
                        <button
                            type="button"
                            className="search-person-card__icon-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(person);
                            }}
                            disabled={isBusy}
                            aria-label={`Remove ${username} from history`}
                        >
                            {isBusy ? (
                                <span className="search-person-card__loader" aria-hidden="true" />
                            ) : (
                                <X size={18} strokeWidth={2} />
                            )}
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}
