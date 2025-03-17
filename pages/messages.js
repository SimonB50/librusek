import React, { useState } from "react";
import InfiniteScroll from "@rorygudka/react-infinite-scroller";
import {
  EnvelopeOpenFill,
  EnvelopeFill,
  ExclamationTriangleFill,
} from "react-bootstrap-icons";

import Layout from "@/components/layout";
import { useMessages, useMessageDetails } from "@/lib/messages";
import {
  decodeAndCleanHtml,
  decodeBase64,
  removeCDATA,
  formatDate,
} from "@/lib/utils";

// Message views constants
const UNKNOWN_SENDER = "Unknown sender";
const UNKNOWN_RECEIVER = "Unknown receiver";
const NO_TOPIC = "No topic";
const NO_CONTENT = "No content available.";
const SEND_DATE_UNAVAILABLE = "Send date unavailable";

// Utility Components
const AttachmentWarning = ({ hasAttachment }) => {
  if (!hasAttachment) return null;

  return (
    <div className="flex badge badge-soft badge-warning gap-2 mt-2 p-2 border rounded-md">
      <ExclamationTriangleFill className="text-lg text-base-content/60" />
      This message has an attachment. Unsupported!
    </div>
  );
};

const TagsList = ({ tags }) => {
  if (!tags?.length) return null;

  return (
    <span className="flex gap-2">
      {tags.map((tag, index) => (
        <span key={index} className="badge badge-neutral">
          {tag}
        </span>
      ))}
    </span>
  );
};

// Message Components
const MessageReceivers = ({ receivers }) => {
  if (!Array.isArray(receivers) || !receivers.length) {
    return (
      <span className="badge badge-outline mr-2 mb-1">{UNKNOWN_RECEIVER}</span>
    );
  }

  return receivers.map((receiver, index) => {
    const name =
      receiver.name ||
      `${receiver.firstName || ""} ${receiver.lastName || ""}`.trim() ||
      UNKNOWN_RECEIVER;
    return (
      <span key={index} className="badge badge-outline mr-2 mb-1">
        {name}
      </span>
    );
  });
};

const DetailedMessageView = ({ message, onBack }) => (
  <div className="text-base-content">
    <div className="flex flex-col gap-2 p-2">
      <span>
        From:{" "}
        <span className="badge badge-outline mr-2 mb-1">
          {message.senderName || UNKNOWN_SENDER}
        </span>
      </span>
      <div>
        To: <MessageReceivers receivers={message.receivers} />
      </div>
      <h3 className="font-bold text-2xl text-base-content my-2">
        {message.topic || NO_TOPIC}
      </h3>
      <div className="flex flex-col items-start gap-2 text-sm text-base-content/70">
        <span className="badge badge-outline badge-info">
          {message.sendDate
            ? `Sent ${formatDate(message.sendDate)}`
            : SEND_DATE_UNAVAILABLE}
        </span>
        <span
          className={`badge ${message.readDate ? "badge-success badge-outline" : "badge-error"}`}
        >
          {message.readDate ? `Read ${formatDate(message.readDate)}` : "Unread"}
        </span>
      </div>
      <TagsList tags={message.tags} />
      <AttachmentWarning hasAttachment={message.attachments?.length > 0} />
      <p className="py-4 text-base-content/80">
        {message.Message ? (
          <span
            dangerouslySetInnerHTML={{
              __html: decodeAndCleanHtml(message.Message),
            }}
          />
        ) : (
          NO_CONTENT
        )}
      </p>
      <div className="flex justify-between mt-4">
        <button type="button" onClick={onBack} className="btn btn-secondary">
          Go Back
        </button>
        <button type="button" className="btn btn-primary" onClick={() => {}}>
          Reply
        </button>
      </div>
    </div>
  </div>
);

const MessageItem = ({ message, onClick, isInbox }) => {
  const handleKeyPress = (event) => {
    if (event.key === "Enter" || event.key === " ") onClick();
  };

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-base-200 border border-base-300 rounded-box gap-2 p-4 cursor-pointer hover:bg-base-300 transition-colors duration-200"
      onClick={onClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium text-base-content">
          {isInbox
            ? message.senderName || UNKNOWN_SENDER
            : `To: ${message.receiverName || UNKNOWN_RECEIVER}`}
        </div>
        <h4 className="font-bold text-lg text-base-content">
          {message.topic || NO_TOPIC}
        </h4>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-base-content/70">
          <span className="badge badge-outline badge-info">
            {message.sendDate
              ? `Sent ${formatDate(message.sendDate)}`
              : SEND_DATE_UNAVAILABLE}
          </span>
          {isInbox &&
            (message.readDate ? (
              <span className="tooltip" data-tip={formatDate(message.readDate)}>
                <EnvelopeOpenFill className="w-5 h-5 text-success" />
              </span>
            ) : (
              <span className="tooltip" data-tip="Unread">
                <EnvelopeFill className="w-5 h-5 text-error" />
              </span>
            ))}
          <TagsList tags={message.tags} />
        </div>
        <div className="text-sm text-base-content/80">
          {removeCDATA(decodeBase64(message.content)) || NO_CONTENT}
        </div>
        <AttachmentWarning hasAttachment={message.isAnyFileAttached} />
      </div>
    </div>
  );
};

// Main Component
const MessagesPage = () => {
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
    <Layout>
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
    </Layout>
  );
};

export default MessagesPage;
