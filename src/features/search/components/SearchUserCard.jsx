import React from "react";
import { getInitial } from "../../../utils/presentation.js";
import { MessageCircle } from "lucide-react";

export default function SearchUserCard({ person, isBusy, onAction }) {
    return (
        <article className="search-person-card">
            <div className={`search-person-card__avatar search-person-card__avatar--${person.avatarTone || "indigo"}`}>
                <span>{getInitial(person.username)}</span>
            </div>
            
            <div className="search-person-card__body">
                <div className="search-person-card__topline">
                    <h3>{person.username}</h3>
                    <button
                        type="button"
                        className="search-person-card__icon-button"
                        onClick={() => onAction(person)}
                        disabled={isBusy}
                        aria-label={`Connect with ${person.username}`}
                    >
                        {isBusy ? (
                            <span className="search-person-card__loader" aria-hidden="true" />
                        ) : (
                            <MessageCircle size={18} strokeWidth={2} />
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
}
