import React from "react";
import { CheckIcon, CloseIcon, ChatBubbleIcon } from "../../../components/common/Icons.jsx";
import { getChatAvatarGlyph } from "../../../components/common/MobileRoomVisuals.jsx";
import UserAvatar from "../../../components/common/UserAvatar.jsx";
import { InlineSpinner } from "../../../components/loaders";
import {
    getAvatarTone,
    formatListTime,
    getRequestSubtitle,
    getRequestInfoLine
} from "../utils/chatHelpers.js";

export function PendingRequestCard({ request, handlingRequestId, onRespond }) {
    const rid = request.requestId;
    const isHandling = handlingRequestId === rid;

    return (
        <article className="chat-request-card">
            <div className="chat-request-card__head">
                <UserAvatar avatarId={request.displayAvatar} className="chat-conversation-card__avatar" />
                <div className="chat-request-card__copy">
                    <strong>{request.displayAlias}</strong>
                    <p>{getRequestSubtitle(request)}</p>
                </div>
            </div>
            {String(request.contextPreview || "").trim() && (
                <blockquote className="chat-request-card__quote">
                    "{request.contextPreview}"
                </blockquote>
            )}
            <small className="chat-request-card__time">{formatListTime(request.createdAt)}</small>
            <div className="chat-request-card__actions">
                <button
                    type="button"
                    className="chat-request-card__accept"
                    onClick={() => onRespond(rid, "accept")}
                    disabled={isHandling}
                >
                    <CheckIcon />
                    {isHandling ? (
                        <>
                            <InlineSpinner size="sm" tone="light" label="Updating request" />
                            <span>Working...</span>
                        </>
                    ) : <span>Accept</span>}
                </button>
                <button
                    type="button"
                    className="chat-request-card__decline"
                    onClick={() => onRespond(rid, "decline")}
                    disabled={isHandling}
                >
                    <CloseIcon />
                    <span>{isHandling ? "Please wait" : "Decline"}</span>
                </button>
            </div>
        </article>
    );
}

export function AcceptedRequestCard({ request, onOpenConversation }) {
    return (
        <article className="chat-request-card chat-request-card--accepted">
            <div className="chat-request-card__head">
                <UserAvatar avatarId={request.displayAvatar} className="chat-conversation-card__avatar" />
                <div className="chat-request-card__copy">
                    <strong>{request.displayAlias}</strong>
                    <p>{getRequestInfoLine(request)}</p>
                    <small className="chat-request-card__time">{formatListTime(request.respondedAt || request.createdAt)}</small>
                </div>
                <button
                    type="button"
                    className="chat-request-card__open"
                    onClick={() => onOpenConversation(request.conversationId)}
                    disabled={!request.conversationId}
                    aria-label={`Open chat with ${request.displayAlias}`}
                >
                    <ChatBubbleIcon />
                </button>
            </div>
        </article>
    );
}
