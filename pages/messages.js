import React, { useState } from "react"; // Import React and useState
import { Paperclip, Envelope, EnvelopeOpen } from "react-bootstrap-icons";
import { useMessages, getMessageDetail } from "@/lib/messages";
import {
  decodeAndCleanHtml,
  decodeBase64,
  removeCDATA,
  formatDate,
} from "@/lib/utils";
import Layout from "@/components/layout";

// Main page component for displaying messages
const MessagesPage = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [focusedMessage, setFocusedMessage] = useState(null);
  const [isInbox, setIsInbox] = useState(true);

  // Simple Tags displaying component
  const TagsComponent = ({ tags }) => (
    <div className="flex gap-2 mt-2">
      {tags && tags.length > 0
        ? tags.map((tag, index) => (
            <span key={index} className="badge badge-neutral">
              {tag}
            </span>
          ))
        : null}
    </div>
  );

  const messagesPerPage =
    parseInt(localStorage.getItem("messagesPageLimit"), 10) || 5; // Ensure it's a number

  const {
    data: messagesData,
    loading,
    error,
  } = useMessages({
    maxMessagesPerPage: messagesPerPage,
    page: pageNumber,
    isInbox: isInbox,
  });

  // Derived state for pagination
  const totalMessages = messagesData?.total || 0;
  const totalPages = Math.ceil(totalMessages / messagesPerPage);

  const handleReadMore = async (message, event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const { messageDetail, error: detailError } = await getMessageDetail(
        message.messageId,
        isInbox
      );

      if (detailError) {
        throw new Error(detailError);
      }

      if (!messageDetail) {
        throw new Error("No message details returned");
      }

      setFocusedMessage(messageDetail);
    } catch (err) {
      console.error("Failed to fetch message details:", err.message);
    }
  };

  const handleIsInbox = () => {
    setIsInbox((prevState) => !prevState);
    setPageNumber(1); // Resetuj stronę na 1 przy przełączaniu
  };

  // Navigation handlers
  const handleNextPage = () => {
    if (pageNumber < totalPages) {
      setPageNumber((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pageNumber > 1) {
      setPageNumber((prev) => prev - 1);
    }
  };

  // Render loading skeletons
  const renderLoadingSkeletons = (length) =>
    Array.from({ length: length }, (_, index) => (
      <div key={index} className="skeleton h-24 w-full" />
    ));

  // Render detailed message item
  const RenderDetailedMessageItem = ({ message }) => {
    return (
      <div className="container mx-auto p-4">
        {/* Sender */}
        <div className="text-base-content">
          {message.senderName || "Unknown sender"}
        </div>

        {/* Topic */}
        <h3 className="font-bold text-2xl text-base-content my-2">
          {message.topic || "No topic"}
        </h3>
        <div className="flex flex-col items-start gap-2 text-sm text-base-content/70">
          {/* Send Date */}
          <span className={`badge badge-outline badge-info`}>
            {message.sendDate
              ? `Sent ${formatDate(message.sendDate)}`
              : "Send date unavailable"}
          </span>

          {/* Read Status */}
          <span
            className={`badge badge-outline ${
              message.readDate ? "badge-success" : "badge-error"
            }`}
          >
            {message.readDate
              ? `Read ${formatDate(message.readDate)}`
              : "Unread"}
          </span>
        </div>

        {/* Tags */}
        <TagsComponent tags={message.tags} />

        {/* Message content */}
        <p className="py-4 text-base-content/80">
          {<MessageComponent message={message.Message} /> || "No content"}
        </p>

        {/* Back button */}
        <button
          type="button"
          onClick={() => setFocusedMessage(null)}
          className="btn btn-secondary mt-4"
        >
          Go Back
        </button>
      </div>
    );
  };

  // Render individual message item
  const renderMessageItem = (message) => (
    <div className="container mx-auto p-4">
      <div
        key={message.messageId || "unknown-id"}
        className="flex flex-col gap-2 p-4 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300"
        onClick={(event) => handleReadMore(message, event)}
      >
        {/* Sender */}
        <div className="text-sm font-medium text-base-content">
          {message.senderName || "Unknown sender"}
        </div>

        {/* Topic */}
        <h4 className="font-bold text-lg text-base-content">
          {message.topic || "No topic"}
        </h4>

        {/* Component showing send and read dates with envelope icons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-base-content/70">
          <span className="badge badge-outline badge-info">
            {message.sendDate
              ? `Sent ${formatDate(message.sendDate)}`
              : "Send date unavailable"}
          </span>
          {isInbox &&
            (message.readDate ? (
              <div
                className="flex items-center gap-1 tooltip"
                data-tip={formatDate(message.readDate)}
              >
                <EnvelopeOpen className="w-5 h-5 text-success" />
              </div>
            ) : (
              <div className="tooltip" data-tip="Unread">
                <Envelope className="w-5 h-5 text-error" />
              </div>
            ))}
        </div>

        {/* Content */}
        <div className="text-sm text-base-content/80">
          {removeCDATA(decodeBase64(message.content)) ||
            "No content available."}
        </div>

        {/* Attachment */}
        {message.isAnyFileAttached && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg text-base-content/60">
              <Paperclip />
            </span>
            <span className="text-sm text-warning">
              This message has an attachment. Unsupported.
            </span>
          </div>
        )}

        {/* Tags */}
        <div className="mt-2">
          <TagsComponent tags={message.tags} />
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-4">
        {focusedMessage ? (
          <RenderDetailedMessageItem message={focusedMessage} />
        ) : (
          <>
            <div className="flex flex-col gap-2 text-sm text-base-content/70">
              <span className="text-3xl font-semibold">Messages</span>
              <span className="text-xl">{isInbox ? "Inbox" : "Outbox"}</span>
              <button
                onClick={handleIsInbox}
                className="btn btn-neutral-soft mt-4 self-start"
              >
                {isInbox ? "Switch to Outbox" : "Switch to Inbox"}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {loading ? (
                renderLoadingSkeletons(messagesPerPage)
              ) : error ? (
                <div className="text-red-500 text-center">{error}</div>
              ) : messagesData?.data?.length ? (
                messagesData.data.map((message) => renderMessageItem(message)) // Call renderMessageItem
              ) : (
                <div className="text-center secondary-content">
                  No messages found
                </div>
              )}
            </div>
            <div className="join flex justify-center gap-2">
              <button
                onClick={handlePreviousPage}
                className="join-item btn btn-outline"
                disabled={pageNumber === 1}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                className="join-item btn btn-outline"
                disabled={pageNumber >= totalPages}
              >
                Next
              </button>
            </div>
            {localStorage.getItem("developer") === "true" && (
              <div className="text-center text-sm font-semibold">
                Total Messages: {totalMessages} | Page {pageNumber} of{" "}
                {totalPages}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

// Component for rendering message content
const MessageComponent = ({ message, withBreaks = true }) => {
  const decodedMessage = message
    ? decodeAndCleanHtml(message, withBreaks)
    : "No content available";
  return <p dangerouslySetInnerHTML={{ __html: decodedMessage }} />;
};

export default MessagesPage;
