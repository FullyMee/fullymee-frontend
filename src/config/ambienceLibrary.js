/**
 * Frontend Ambience Library
 * Maps normalized category keys to their available ambience images.
 * Uses only valid image IDs from the 24 distinct PNG files on disk.
 */

export const AMBIENCE_BY_CATEGORY = {
    late_night: [
        { id: "moonlit_window",  image: "/ambience/late_night/moonlit_window.png",  label: "Moonlit Window" },
        { id: "neon_skyline",    image: "/ambience/late_night/neon_skyline.png",    label: "Neon Skyline" },
        { id: "rainy_midnight",  image: "/ambience/late_night/rainy_midnight.png",  label: "Rainy Midnight" },
        { id: "aurora_night",    image: "/ambience/late_night/aurora_night.png",    label: "Aurora Night" },
    ],
    anxiety: [
        { id: "calm_lake",       image: "/ambience/anxiety/calm_lake.png",          label: "Calm Lake" },
        { id: "floating_clouds", image: "/ambience/anxiety/floating_clouds.png",    label: "Floating Clouds" },
        { id: "misty_forest",    image: "/ambience/anxiety/misty_forest.png",       label: "Misty Forest" },
        { id: "mountain_dawn",   image: "/ambience/anxiety/mountain_dawn.png",      label: "Mountain Dawn" },
        { id: "northern_sky",    image: "/ambience/anxiety/northern_sky.png",       label: "Northern Sky" },
    ],
    heartbreak: [
        { id: "broken_letter",     image: "/ambience/heartbreak/broken_letter.png",     label: "Broken Letter" },
        { id: "empty_park_bench",  image: "/ambience/heartbreak/empty_park_bench.png",  label: "Empty Park Bench" },
        { id: "falling_leaves",    image: "/ambience/heartbreak/falling_leaves.png",    label: "Falling Leaves" },
        { id: "lonely_pier",       image: "/ambience/heartbreak/lonely_pier.png",       label: "Lonely Pier" },
        { id: "quiet_beach",       image: "/ambience/heartbreak/quiet_beach.png",       label: "Quiet Beach" },
        { id: "rainy_window",      image: "/ambience/heartbreak/rainy_window.png",      label: "Rainy Window" },
        { id: "sunset_memories",   image: "/ambience/heartbreak/sunset_memories.png",   label: "Sunset Memories" },
        { id: "wilted_roses",      image: "/ambience/heartbreak/wilted_roses.png",      label: "Wilted Roses" },
    ],
    relationships: [
        { id: "cherry_blossoms", image: "/ambience/relationships/cherry_blossoms.png", label: "Cherry Blossoms" },
        { id: "couples_cafe",    image: "/ambience/relationships/couples_cafe.png",    label: "Couples Café" },
        { id: "garden_path",     image: "/ambience/relationships/garden_path.png",     label: "Garden Path" },
        { id: "golden_bridge",   image: "/ambience/relationships/golden_bridge.png",   label: "Golden Bridge" },
        { id: "heart_lanterns",  image: "/ambience/relationships/heart_lanterns.png",  label: "Heart Lanterns" },
        { id: "love_letters",    image: "/ambience/relationships/love_letters.png",    label: "Love Letters" },
        { id: "sunset_beach",    image: "/ambience/relationships/sunset_beach.png",    label: "Sunset Beach" },
    ],
    family: [
        { id: "garden_path",     image: "/ambience/relationships/garden_path.png",     label: "Garden Path" },
        { id: "couples_cafe",    image: "/ambience/relationships/couples_cafe.png",    label: "Warm Haven" },
        { id: "quiet_beach",       image: "/ambience/heartbreak/quiet_beach.png",       label: "Quiet Shore" },
    ],
    college: [
        { id: "misty_forest",    image: "/ambience/anxiety/misty_forest.png",       label: "Campus Walk" },
        { id: "moonlit_window",  image: "/ambience/late_night/moonlit_window.png",  label: "Dorm Window" },
        { id: "floating_clouds", image: "/ambience/anxiety/floating_clouds.png",    label: "Open Sky" },
    ],
    career: [
        { id: "mountain_dawn",   image: "/ambience/anxiety/mountain_dawn.png",      label: "Mountain Dawn" },
        { id: "golden_bridge",   image: "/ambience/relationships/golden_bridge.png",   label: "Golden Bridge" },
        { id: "neon_skyline",    image: "/ambience/late_night/neon_skyline.png",    label: "City Skyline" },
    ],
    tech_coding: [
        { id: "neon_skyline",    image: "/ambience/late_night/neon_skyline.png",    label: "Neon Skyline" },
        { id: "rainy_midnight",  image: "/ambience/late_night/rainy_midnight.png",  label: "Rainy Midnight" },
        { id: "northern_sky",    image: "/ambience/anxiety/northern_sky.png",       label: "Northern Lights" },
    ],
    casual_chat: [
        { id: "couples_cafe",    image: "/ambience/relationships/couples_cafe.png",    label: "Casual Café" },
        { id: "sunset_beach",    image: "/ambience/relationships/sunset_beach.png",    label: "Sunset Beach" },
        { id: "cherry_blossoms", image: "/ambience/relationships/cherry_blossoms.png", label: "Cherry Blossoms" },
    ],
    confessions: [
        { id: "rainy_window",      image: "/ambience/heartbreak/rainy_window.png",      label: "Rainy Window" },
        { id: "broken_letter",     image: "/ambience/heartbreak/broken_letter.png",     label: "Broken Letter" },
        { id: "moonlit_window",  image: "/ambience/late_night/moonlit_window.png",  label: "Moonlit Window" },
    ],
    gaming: [
        { id: "aurora_night",    image: "/ambience/late_night/aurora_night.png",    label: "Aurora Night" },
        { id: "neon_skyline",    image: "/ambience/late_night/neon_skyline.png",    label: "Neon Glow" },
        { id: "northern_sky",    image: "/ambience/anxiety/northern_sky.png",       label: "Starlight" },
    ],
    entertainment: [
        { id: "heart_lanterns",  image: "/ambience/relationships/heart_lanterns.png",  label: "Night Lights" },
        { id: "neon_skyline",    image: "/ambience/late_night/neon_skyline.png",    label: "Neon Skyline" },
        { id: "cherry_blossoms", image: "/ambience/relationships/cherry_blossoms.png", label: "Blossom Hall" },
    ],
    fitness: [
        { id: "mountain_dawn",   image: "/ambience/anxiety/mountain_dawn.png",      label: "Sunrise Peak" },
        { id: "calm_lake",       image: "/ambience/anxiety/calm_lake.png",          label: "Fresh Lake" },
        { id: "floating_clouds", image: "/ambience/anxiety/floating_clouds.png",    label: "Clear Sky" },
    ],
    finance: [
        { id: "golden_bridge",   image: "/ambience/relationships/golden_bridge.png",   label: "Golden Bridge" },
        { id: "neon_skyline",    image: "/ambience/late_night/neon_skyline.png",    label: "Financial District" },
        { id: "mountain_dawn",   image: "/ambience/anxiety/mountain_dawn.png",      label: "Horizon" },
    ],
    politics: [
        { id: "empty_park_bench",  image: "/ambience/heartbreak/empty_park_bench.png",  label: "Square Bench" },
        { id: "misty_forest",    image: "/ambience/anxiety/misty_forest.png",       label: "Misty Woods" },
        { id: "golden_bridge",   image: "/ambience/relationships/golden_bridge.png",   label: "Golden Bridge" },
    ],
    startups: [
        { id: "neon_skyline",    image: "/ambience/late_night/neon_skyline.png",    label: "City Skyline" },
        { id: "golden_bridge",   image: "/ambience/relationships/golden_bridge.png",   label: "Golden Bridge" },
        { id: "mountain_dawn",   image: "/ambience/anxiety/mountain_dawn.png",      label: "New Dawn" },
    ],
    travel: [
        { id: "sunset_beach",    image: "/ambience/relationships/sunset_beach.png",    label: "Sunset Beach" },
        { id: "calm_lake",       image: "/ambience/anxiety/calm_lake.png",          label: "Serene Lake" },
        { id: "northern_sky",    image: "/ambience/anxiety/northern_sky.png",       label: "Northern Sky" },
    ],
    books: [
        { id: "rainy_window",      image: "/ambience/heartbreak/rainy_window.png",      label: "Rainy Nook" },
        { id: "moonlit_window",  image: "/ambience/late_night/moonlit_window.png",  label: "Moonlit Desk" },
        { id: "falling_leaves",    image: "/ambience/heartbreak/falling_leaves.png",    label: "Autumn Pages" },
    ],
    advice: [
        { id: "calm_lake",       image: "/ambience/anxiety/calm_lake.png",          label: "Calm Lake" },
        { id: "mountain_dawn",   image: "/ambience/anxiety/mountain_dawn.png",      label: "Guiding Dawn" },
        { id: "floating_clouds", image: "/ambience/anxiety/floating_clouds.png",    label: "Open Sky" },
    ],
};

/**
 * Normalize a user-facing category string (e.g. "Late Night", "Tech and Coding")
 * to the pool key used in AMBIENCE_BY_CATEGORY.
 */
export function normalizeCategoryToKey(category) {
    if (!category) return null;
    const map = {
        "late night":    "late_night",
        "heartbreak":    "heartbreak",
        "anxiety":       "anxiety",
        "relationships": "relationships",
        "family":        "family",
        "college":       "college",
        "career":        "career",
        "tech and coding": "tech_coding",
        "casual chats":  "casual_chat",
        "confessions":   "confessions",
        "gaming":        "gaming",
        "entertainment": "entertainment",
        "fitness":       "fitness",
        "finance":       "finance",
        "politics":      "politics",
        "startup":       "startups",
        "travel":        "travel",
        "books":         "books",
        "advice":        "advice",
    };
    return map[String(category).trim().toLowerCase()] ?? null;
}

/**
 * Get images for a user-facing category string.
 * Returns [] if category has no images.
 */
export function getAmbiencesForCategory(category) {
    const key = normalizeCategoryToKey(category);
    return (key && AMBIENCE_BY_CATEGORY[key]) || AMBIENCE_BY_CATEGORY.late_night;
}

/**
 * Flat lookup: ambienceId → image URL.
 * Built once from AMBIENCE_BY_CATEGORY so the mapping is always in sync.
 */
export const AMBIENCE_BY_ID = Object.values(AMBIENCE_BY_CATEGORY)
    .flat()
    .reduce((acc, item) => {
        acc[item.id] = item.image;
        return acc;
    }, {});

/**
 * Resolve the correct image URL for a given ambienceId.
 * Falls back to a safe default if the id is unknown.
 */
export function getImageForAmbienceId(ambienceId, fallback = '/ambience/late_night/moonlit_window.png') {
    if (!ambienceId) return fallback;
    return AMBIENCE_BY_ID[ambienceId] || fallback;
}
