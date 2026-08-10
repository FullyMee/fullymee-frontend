import React from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import UserAvatar from "../../../components/common/UserAvatar.jsx";

export default function SearchUserCard({ person, isBusy, onRemove, onClickCard }) {
    const navigate = useNavigate();
    return (
        <article className="search-person-card">
            <UserAvatar 
                avatarId={person.avatar} 
                className="search-person-card__avatar"
                onClick={() => {
                    if (onClickCard) onClickCard(person);
                    navigate(`/user/${person.username || person.userId || person.id}`, { state: { profileUser: person } });
                }}
                style={{ cursor: "pointer", display: "block" }}
                role="button"
                tabIndex={0}
            />

            <div className="search-person-card__body">
                <div className="search-person-card__topline">
                    <div>
                        <h3
                            onClick={() => {
                                if (onClickCard) onClickCard(person);
                                navigate(`/user/${person.username || person.userId || person.id}`, { state: { profileUser: person } });
                            }}
                            style={{ cursor: "pointer", margin: 0 }}
                        >
                            {person.username}
                        </h3>
                    </div>
                    <button
                        type="button"
                        className="search-person-card__icon-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onRemove) onRemove(person);
                        }}
                        disabled={isBusy}
                        aria-label={`Remove ${person.username} from history`}
                    >
                        {isBusy ? (
                            <span className="search-person-card__loader" aria-hidden="true" />
                        ) : (
                            <X size={18} strokeWidth={2} />
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
}
