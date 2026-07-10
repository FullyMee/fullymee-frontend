import { CheckCircleIcon } from "./ConfessionIcons.jsx";

export default function ChatRequestDialogs({
    chatRequestTarget,
    sendingChatRequest,
    chatRequestSuccess,
    onCancelRequest,
    onSendRequest,
    onCloseSuccess
}) {
    return (
        <>
            {chatRequestTarget && (
                <div className="confession-request-modal" role="dialog" aria-modal="true" aria-labelledby="chat-request-title">
                    <div className="confession-request-modal__card confession-request-modal__card--confirm">
                        <h2 id="chat-request-title">Send Chat Request?</h2>
                        <p>Would you like to send a chat request to {chatRequestTarget.alias}?</p>
                        <div className="confession-request-modal__actions">
                            <button
                                type="button"
                                className="confession-request-modal__secondary"
                                onClick={onCancelRequest}
                                disabled={sendingChatRequest}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="confession-request-modal__primary"
                                onClick={onSendRequest}
                                disabled={sendingChatRequest}
                            >
                                {sendingChatRequest ? "Sending..." : "Send Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {chatRequestSuccess && (
                <div className="confession-request-modal" role="dialog" aria-modal="true" aria-labelledby="chat-request-success-title">
                    <div className="confession-request-modal__card confession-request-modal__card--success">
                        <div className="confession-request-modal__success-icon">
                            <CheckCircleIcon />
                        </div>
                        <h2 id="chat-request-success-title">Request Sent!</h2>
                        <p>Your chat request has been sent to {chatRequestSuccess.alias}</p>
                        <div className="confession-request-modal__actions confession-request-modal__actions--center">
                            <button
                                type="button"
                                className="confession-request-modal__secondary confession-request-modal__secondary--compact"
                                onClick={onCloseSuccess}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
