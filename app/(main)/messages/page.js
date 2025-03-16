"use client";

import { useState } from "react";
import { Paperclip } from "react-bootstrap-icons";
import InfiniteScroll from "@rorygudka/react-infinite-scroller";

import { useMessages, useMessageDetails } from "@/lib/messages";
import {
  decodeAndCleanHtml,
  decodeBase64,
  removeCDATA,
  formatDate,
} from "@/lib/utils";

const MessagesPage = () => {
  const [focusedMessage, setFocusedMessage] = useState(null);

  const {
    data: messagesData,
    loading: messagesLoading,
    error: messagesError,
    loadMore: loadMoreMessages,
  } = useMessages();
  const {
    data: messageDetailsData,
    loading: messageDetailsLoading,
    error: messageDetailsError,
  } = useMessageDetails(focusedMessage);

  return (
    <div className="flex flex-col">
      <dialog
        id="message_modal"
        className="modal modal-bottom sm:modal-middle"
        onClose={() => setFocusedMessage(null)}
      >
        <div className="modal-box">
          {!messageDetailsLoading && !messageDetailsError ? (
            <>
              <h3 className="font-bold text-2xl text-base-content mb-2">
                {messageDetailsData.topic}
              </h3>
              <div className="flex flex-row items-center gap-x-2 text-sm text-base-content/70">
                <span>{messageDetailsData.senderName}</span>
                <span>-</span>
                <span>{formatDate(messageDetailsData.sendDate)}</span>
              </div>
              <p className="py-4 text-base-content/80 min-h-[100px]">
                <p
                  dangerouslySetInnerHTML={{
                    __html: decodeAndCleanHtml(messageDetailsData.Message),
                  }}
                />
              </p>
              {messageDetailsData.isAnyFileAttached && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg text-base-content/60">
                    <Paperclip />
                  </span>
                  <span className="text-sm font-medium text-warning">
                    This message has an attachment. This app does not support
                    attachments.
                  </span>
                </div>
              )}
            </>
          ) : (
            <span className="text-lg">Loading message...</span>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <div className="space-y-4">
        <span className="text-3xl font-semibold">Messages</span>
        {messagesData ? (
          <InfiniteScroll
            pageStart={0}
            loadMore={() => loadMoreMessages()}
            hasMore={!messagesLoading && !messagesError}
            loader={
              <div key={0} className="skeleton h-24 w-full">
                Loading...
              </div>
            }
            className="flex flex-col gap-2"
          >
            {messagesData.map((message) => (
              <div
                key={message.messageId}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-base-200 border border-base-300 rounded-box gap-2 p-4 cursor-pointer hover:bg-base-300 transition-colors duration-200"
                onClick={() => {
                  setFocusedMessage(message.messageId);
                  document.getElementById("message_modal").showModal();
                }}
              >
                <div className="flex flex-col gap-1 w-full">
                  <span className="text-lg font-bold text-base-content">
                    {message.topic || "No topic available"}
                  </span>
                  <span className="text-base-content/80">
                    {removeCDATA(decodeBase64(message.content)) ||
                      "No content available"}
                  </span>
                  {message.isAnyFileAttached && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-lg text-base-content/60">
                        <Paperclip />
                      </span>
                      <span className="text-sm font-medium text-warning">
                        This message has an attachment. This app does not
                        support attachments.
                      </span>
                    </div>
                  )}
                  <div className="flex flex-row items-center gap-x-2 text-sm text-base-content/70">
                    <span>{message.senderName || "Unknown sender"}</span>
                    <span>-</span>
                    <span>
                      {message.sendDate
                        ? formatDate(message.sendDate)
                        : "Date unavailable"}
                    </span>
                  </div>
                </div>
              </div>
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
    </div>
  );
};

export default MessagesPage;
