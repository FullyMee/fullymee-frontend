import React from "react";
import { Search } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Search for rooms or users..." }) {
    return (
        <div className="search-bar">
            <div className="search-bar__field">
                <Search size={18} strokeWidth={2} className="search-input__icon-svg" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
}
