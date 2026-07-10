import React from "react";

export const ROOMS_TAB = "rooms";
export const PEOPLE_TAB = "people";

export default function SearchTabs({ tab, setTab, roomCount, peopleCount, onJoinByCode }) {
    return (
        <div className="search-pills">
            <button
                type="button"
                className={`search-pill${tab === ROOMS_TAB ? " is-active" : ""}`}
                onClick={() => setTab(ROOMS_TAB)}
            >
                All Rooms ({roomCount || 0})
            </button>
            <button
                type="button"
                className={`search-pill${tab === PEOPLE_TAB ? " is-active" : ""}`}
                onClick={() => setTab(PEOPLE_TAB)}
            >
                People ({peopleCount || 0})
            </button>
            {typeof onJoinByCode === "function" && (
                <button
                    type="button"
                    className="search-pill search-pill--code"
                    onClick={onJoinByCode}
                >
                    Join Code
                </button>
            )}
        </div>
    );
}
