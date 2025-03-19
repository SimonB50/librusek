"use client";

import { useState } from "react";
import InfiniteScroll from "@rorygudka/react-infinite-scroller";
import { DetailedMessageView } from "./components/DetailedMessageView";
import { MessageItem } from "./components/MessageItem";
import { useMessages, useMessageDetails } from "@/lib/messages";

export default function MessagesPage() {
  const [readMoreMessage, setReadMoreMessage] = useState(null);
  const [isInbox, setIsInbox] = useState(true);

  const {
    data: messagesData,
    loading: messagesLoading,
    error: messagesError,
    loadMore: loadMoreMessages,
    resetBox: changeInbox,
  } = useMessages(isInbox);

  const {
    data: messageDetailsData,
    loading: messageDetailsLoading,
    error: messageDetailsError,
  } = useMessageDetails(readMoreMessage, isInbox);

  const handleReadMore = (messageId) => setReadMoreMessage(messageId);
  const handleReadMoreClose = () => setReadMoreMessage(null);
  const toggleMessages = () => {
    setIsInbox((prev) => !prev);
    changeInbox();
  };

  return (
    <div>
      {readMoreMessage && messageDetailsData ? (
        <DetailedMessageView
          message={messageDetailsData}
          onBack={handleReadMoreClose}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold">Messages</h1>
            <div>
              <span className="text-xl font-semibold">
                {isInbox ? "Inbox" : "Outbox"}
              </span>
            </div>
            <button className="btn btn-primary" onClick={toggleMessages}>
              {isInbox ? "Switch to Outbox" : "Switch to Inbox"}
            </button>
          </div>

          {messagesData ? (
            <InfiniteScroll
              pageStart={0}
              loadMore={loadMoreMessages}
              hasMore={!messagesLoading && !messagesError}
              loader={
                <div className="skeleton h-24 w-full" key={0}>
                  Loading...
                </div>
              }
              className="flex flex-col gap-2"
            >
              {messagesData.map((message) => (
                <MessageItem
                  key={message.messageId}
                  message={message}
                  isInbox={isInbox}
                  onClick={() => handleReadMore(message.messageId)}
                />
              ))}
            </InfiniteScroll>
          ) : (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="skeleton h-24 w-full" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
