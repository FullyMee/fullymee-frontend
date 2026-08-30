export function matchesJoinedRoomSearch(room, term) {
    const value = String(term || "").trim().toLowerCase();
    if (!value) return true;

    const haystack = `${room && room.title ? room.title : ""} ${room && room.description ? room.description : ""} ${room && room.category ? room.category : ""} ${room && room.roomType ? room.roomType : ""}`.toLowerCase();
    return haystack.includes(value);
}

export function matchesJoinedRoomFilter(room, filter) {
    const value = String(filter || "All").trim().toLowerCase();
    if (value === "all" || !value) return true;
    if (value === "public") return String(room && room.roomType || "").toLowerCase() === "public";
    if (value === "private") return String(room && room.roomType || "").toLowerCase() === "private";
    return true;
}

