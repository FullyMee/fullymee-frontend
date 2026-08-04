/** Platform closing notes — must stay in sync with backend/src/constants/closingNotes.js */

export const CLOSING_NOTES = [
    { id: "thank_you", emoji: "🌱", text: "Thank you for the conversation." },
    { id: "natural_end", emoji: "🌙", text: "I think this chat has reached its natural end." },
    { id: "best_wishes", emoji: "💙", text: "Wishing you all the best." },
    { id: "helped_me", emoji: "📖", text: "Our conversation helped me. Thank you." },
    { id: "take_care", emoji: "✨", text: "Take care of yourself." }
];

export const DEFAULT_CLOSING_NOTE_TEXT = "Thank you for being part of it.";

export const CONVERSATION_STATUS = {
    ACTIVE: "ACTIVE",
    PAUSED: "PAUSED",
    ENDED: "ENDED"
};

export function isConversationEnded(conversation) {
    return String(conversation && conversation.status || "").toUpperCase() === CONVERSATION_STATUS.ENDED;
}

export function isConversationPaused(conversation) {
    return String(conversation && conversation.status || "").toUpperCase() === CONVERSATION_STATUS.PAUSED;
}

export function getClosingNoteDisplay(conversation) {
    if (!conversation) return DEFAULT_CLOSING_NOTE_TEXT;
    return conversation.closingNoteText || DEFAULT_CLOSING_NOTE_TEXT;
}
