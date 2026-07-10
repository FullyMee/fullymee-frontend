import React, { forwardRef } from 'react';
import { Virtuoso } from 'react-virtuoso';

/**
 * A reusable virtualized feed optimized for bottom-up chat applications.
 * 
 * @param {Object} props
 * @param {Array} props.messages Array of message objects
 * @param {Function} props.itemContent Render function for each message (index, message) -> ReactNode
 * @param {Function} props.onLoadMore Triggered when scrolled to the top
 * @param {boolean} props.isLoadingOlder True if actively fetching older messages
 */
const VirtualChatFeed = forwardRef(({
    messages,
    itemContent,
    onLoadMore,
    isLoadingOlder,
    className = ""
}, ref) => {
    return (
        <div style={{ flex: 1, height: '100%', overflow: 'hidden' }} className={`virtual-chat-feed-container ${className}`}>
            <Virtuoso
                ref={ref}
                data={messages}
                style={{ height: '100%' }}
                itemContent={itemContent}
                startReached={onLoadMore}
                atBottomThreshold={100}
                alignToBottom={true}
                followOutput={(isAtBottom) => isAtBottom ? 'smooth' : false}
                components={{
                    Header: () => {
                        if (isLoadingOlder) {
                            return (
                                <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                                    Loading earlier messages...
                                </div>
                            );
                        }
                        return null;
                    }
                }}
            />
        </div>
    );
});

VirtualChatFeed.displayName = 'VirtualChatFeed';

export default VirtualChatFeed;
