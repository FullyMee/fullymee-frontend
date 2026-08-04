import React from "react";
import { useNavigate } from "react-router-dom";
import { getInitial } from "../../../utils/presentation.js";
import { X } from "lucide-react";

export default function SearchUserCard({ person, isBusy, onRemove, onClickCard }) {
    const navigate = useNavigate();
    return (
        <article className="search-person-card">
            <div
                className={`search-person-card__avatar search-person-card__avatar--${person.avatarTone || "indigo"}`}
                onClick={() => {
                    if (onClickCard) onClickCard(person);
                    navigate(`/user/${person.userId || person.id}`, { state: { profileUser: person } });
                }}
                style={{ cursor: "pointer" }}
                role="button"
                tabIndex={0}
            >
                {person.preferences?.avatar ? (
                    <span style={{ fontSize: "1.2em", background: "none" }}>{person.preferences.avatar}</span>
                ) : (
                    <span>{getInitial(person.username)}</span>
                )}
            </div>

            <div className="search-person-card__body">
                <div className="search-person-card__topline">
                    <div>
                        <h3
                            onClick={() => {
                                if (onClickCard) onClickCard(person);
                                navigate(`/user/${person.userId || person.id}`, { state: { profileUser: person } });
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
