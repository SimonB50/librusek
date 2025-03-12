import React, { useState } from "react";
import InfiniteScroll from "@rorygudka/react-infinite-scroller";
import { Paperclip } from "react-bootstrap-icons";

import Layout from "@/components/layout";
import { useMessages, useMessageDetails } from "@/lib/messages";
import {
  decodeAndCleanHtml,
  decodeBase64,
  removeCDATA,
  formatDate,
} from "@/lib/utils";

/**
 * MessageDialog Component
 * Modal dialog component to display the detailed view of a message.
 */
const MessageDialog = ({
  messageDetailsData,
  messageDetailsLoading,
  messageDetailsError,
  onClose,
}) => {
  return (
    <dialog
      id="message_modal"
      className="modal modal-bottom sm:modal-middle"
      onClose={onClose}
    >
      <div className="modal-box">
        {/* Verify if message details exist and are not in an error state */}
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
              <span
                dangerouslySetInnerHTML={{
                  __html: decodeAndCleanHtml(messageDetailsData.Message),
                }}
              />
            </p>
            {/* Show attachment info if applicable */}
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
        <button type="button">close</button>
      </form>
    </dialog>
  );
};

/**
 * MessageItem Component
 * Single message item for the list view.
 */
const MessageItem = ({ message, onClick }) => (
  <div
    key={message.messageId}
    className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-base-200 border border-base-300 rounded-box gap-2 p-4 cursor-pointer hover:bg-base-300 transition-colors duration-200"
    onClick={onClick}
    role="button"
    tabIndex={0} // Ensures element is focusable for accessibility
  >
    <div className="flex flex-col gap-1 w-full">
      <span className="text-lg font-bold text-base-content">
        {message.topic || "No topic available"}
      </span>
      <div className="flex flex-row items-center gap-x-2 text-sm text-base-content/70">
        <span>{message.senderName || "Unknown sender"}</span>
        <span>-</span>
        <span>
          {message.sendDate ? formatDate(message.sendDate) : "Date unavailable"}
        </span>
      </div>
      <span className="text-base-content/80">
        {removeCDATA(decodeBase64(message.content)) || "No content available"}
      </span>
      {message.isAnyFileAttached && (
        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg text-base-content/60">
            <Paperclip />
          </span>
          <span className="text-sm font-medium text-warning">
            This message has an attachment. This app does not support
            attachments.
          </span>
        </div>
      )}
    </div>
  </div>
);

/**
 * MessagesPage Component
 * Main page for displaying the messages list and handling the modal
 * which shows detailed message information.
 */
const MessagesPage = () => {
  const [focusedMessage, setFocusedMessage] = useState(null);
  const [isInbox, setIsInbox] = useState(true);

  // Retrieve list of messages.
  const {
    data: messagesData,
    loading: messagesLoading,
    error: messagesError,
    loadMore: loadMoreMessages,
    resetBox: changeInbox,
  } = useMessages(isInbox, isInbox); // Modified to accept isInbox parameter

  // Retrieve details for the focused message.
  const {
    data: messageDetailsData,
    loading: messageDetailsLoading,
    error: messageDetailsError,
  } = useMessageDetails(focusedMessage, isInbox);

  // Handler to close the message modal.
  const handleDialogClose = () => {
    setFocusedMessage(null);
  };

  // Handler to open the modal with detailed message information.
  const handleItemClick = (messageId) => {
    setFocusedMessage(messageId);
    document.getElementById("message_modal").showModal();
  };

  // Handler to toggle between inbox and outbox
  const handleToggleMessages = () => {
    setIsInbox(!isInbox);
    changeInbox();
  };

  return (
    <Layout>
      {/* Render modal dialog for message details */}
      <MessageDialog
        messageDetailsData={messageDetailsData ?? {}}
        messageDetailsLoading={messageDetailsLoading}
        messageDetailsError={messageDetailsError}
        onClose={handleDialogClose}
      />
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-semibold mb-2">Messages</span>
          <span className="text-xl font-semibold">
            {" "}
            {isInbox ? "(Inbox)" : "(Outbox)"}
          </span>
          <button className="btn btn-primary" onClick={handleToggleMessages}>
            {isInbox ? "Switch to Outbox" : "Switch to Inbox"}
          </button>
        </div>
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
              <MessageItem
                key={message.messageId}
                message={message}
                onClick={() => handleItemClick(message.messageId)}
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
    </Layout>
  );
};

export default MessagesPage;
