import React from "react";
import DesktopEmptyState from "../../../components/common/DesktopEmptyState.jsx";
import { PendingRequestCard, AcceptedRequestCard } from "./ChatRequestCard.jsx";

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
                <DesktopEmptyState
                    compact
                    title="No chat requests yet"
                    description="When someone sends you a request, it will appear here."
                />
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
