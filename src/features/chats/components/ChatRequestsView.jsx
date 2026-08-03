import React from "react";
import { MessageSquare } from "lucide-react";
import { PendingRequestCard, AcceptedRequestCard } from "./ChatRequestCard.jsx";

export function ChatRequestsEmptyState() {
    return (
        <div className="chat-empty-state">
            <div className="chat-empty-state__icon-wrapper">
                <MessageSquare size={20} strokeWidth={1.8} className="chat-empty-state__icon" />
            </div>
            <h3 className="chat-empty-state__title">No chat requests yet</h3>
            <p className="chat-empty-state__sub">
                When someone sends you a request from a confession, it will appear here.
            </p>
        </div>
    );
}

export default function ChatRequestsView({
    pendingRequests,
    acceptedRequests,
    handlingRequestId,
    onRespondToRequest,
    onOpenAcceptedConversation
}) {
    const hasPending = pendingRequests && pendingRequests.length > 0;
    const hasAccepted = acceptedRequests && acceptedRequests.length > 0;

    if (!hasPending && !hasAccepted) {
        return (
            <div className="desktop-chat-requests-view">
                <ChatRequestsEmptyState />
            </div>
        );
    }

    return (
        <div className="desktop-chat-requests-view">
            {hasPending && (
                <section className="chat-requests-section">
                    <span className="chat-requests-section__label">Pending</span>
                    <div className="chat-requests-list">
                        {pendingRequests.map((request) => (
                            <PendingRequestCard
                                key={request.requestId}
                                request={request}
                                handlingRequestId={handlingRequestId}
                                onRespond={onRespondToRequest}
                            />
                        ))}
                    </div>
                </section>
            )}

            {hasAccepted && (
                <section className="chat-requests-section">
                    <span className="chat-requests-section__label">Accepted</span>
                    <div className="chat-requests-list">
                        {acceptedRequests.map((request) => (
                            <AcceptedRequestCard
                                key={request.requestId}
                                request={request}
                                onOpenConversation={onOpenAcceptedConversation}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
