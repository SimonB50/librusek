import React, { useState } from "react";
import InfiniteScroll from "@rorygudka/react-infinite-scroller";
import {
  Paperclip,
  EnvelopeOpenFill,
  EnvelopeFill,
  Inbox,
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

/**
 * A component that displays a warning message when an attachment is present but unsupported.
 * Renders only if `hasAttachment` is true, showing an icon and a warning message.
 *
 * @component
 * @param {Object} props - The props passed to the component.
 * @param {boolean} props.hasAttachment - Indicates whether the message has an attachment.
 * @returns {JSX.Element|null} A warning UI element if an attachment exists, otherwise null.
 *
 * @example
 * // Example usage in a parent component:
 *
 * const message = { isAnyFileAttached: true };
 * <AttachmentItemWarning hasAttachment={message.isAnyFileAttached} />
 */
const AttachmentItemWarning = ({ hasAttachment }) => {
  // Do not render anything if there is no attachment
  if (!hasAttachment) {
    return null;
  }

  return (
    <div className="flex badge badge-soft badge-warning gap-2 mt-2 p-2 whitespace-normal border border-yellow-500 rounded-md min-h-fit h-auto">
      {/* Icon with DaisyUI styling */}
      <span className="flex text-lg text-base-content text-opacity-60">
        <ExclamationTriangleFill aria-hidden="true" />
      </span>
      This message has an attachment. Unsupported!
    </div>
  );
};
const TagsComponent = ({ tags }) => (
  <span className="flex gap-2">
    {tags && tags.length > 0
      ? tags.map((tag, index) => (
          <span key={index} className="badge badge-neutral">
            {tag}
          </span>
        ))
      : null}
  </span>
);

export const RenderDetailedMessageItem = ({ message, backFuction }) => {
  return (
    <div className="text-base-content">
      <div className="flex flex-col gap-2 p-2">
        <span>
          From:{" "}
          <span className="badge badge-outline mr-2 mb-1">
            {message.senderName || "Unknown sender"}
          </span>
        </span>

        <div>
          To:{" "}
          {Array.isArray(message.receivers) && message.receivers.length > 0 ? (
            message.receivers.map((receiver, index) => {
              const receiverName =
                receiver.name ||
                `${receiver.firstName || ""} ${receiver.lastName || ""}`.trim() ||
                "Unknown receiver";
              return (
                <span key={index} className="badge badge-outline mr-2 mb-1">
                  {receiverName}
                </span>
              );
            })
          ) : (
            <span className="badge badge-outline mr-2 mb-1">
              Unknown receiver
            </span>
          )}
        </div>

        <h3 className="font-bold text-2xl text-base-content my-2">
          {message.topic || "No topic"}
        </h3>
        <div className="flex flex-col items-start gap-2 text-sm text-base-content/70">
          <span className={`badge badge-outline badge-info`}>
            {message.sendDate
              ? `Sent ${formatDate(message.sendDate)}`
              : "Send date unavailable"}
          </span>
          <span
            className={`badge ${
              message.readDate ? "badge-success badge-outline " : "badge-error"
            }`}
          >
            {message.readDate
              ? `Read ${formatDate(message.readDate)}`
              : "Unread"}
          </span>
        </div>
        <TagsComponent tags={message.tags} />
        <AttachmentItemWarning
          hasAttachment={message.attachments?.length > 0}
        />
        <p className="py-4 text-base-content/80">
          {message.Message ? (
            <span
              dangerouslySetInnerHTML={{
                __html: decodeAndCleanHtml(message.Message),
              }}
            />
          ) : (
            "${message}"
          )}
        </p>

        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={() => backFuction(null)}
            className="btn btn-secondary"
          >
            Go Back
          </button>
          <button className="btn btn-primary" onClick={() => {}}>
            Odpowiedz
          </button>
        </div>
      </div>
    </div>
  );
};

const RenderMessageItem = ({ message }) => (
  <div className="container mb-4">
    <div
      key={message.messageId || "unknown-id"}
      className="flex flex-col gap-2 p-4 bg-base-200 rounded-lg cursor-pointer hover:bg-base-300"
      onClick={(event) => handleReadMore(message, event)}
    >
      <div className="text-sm font-medium text-base-content">
        {isInbox
          ? message.senderName || "Unknown sender"
          : `To: ${message.receiverName || "Unknown receiver"}`}
      </div>
      <h4 className="font-bold text-lg text-base-content">
        {message.topic || "No topic"}
      </h4>
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
              <EnvelopeOpenFill className="w-5 h-5 text-success" />
            </div>
          ) : (
            <div className="tooltip" data-tip="Unread">
              <EnvelopeFill className="w-5 h-5 text-error" />
            </div>
          ))}{" "}
        <TagsComponent tags={message.tags} />
      </div>
      <div className="text-sm text-base-content/80">
        {removeCDATA(decodeBase64(message.content)) || "No content available."}
      </div>
      <AttachmentItemWarning hasAttachment={message.isAnyFileAttached} />
    </div>
  </div>
);

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
const MessageItem = ({ message, onClick, isInbox }) => (
  <div
    className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-base-200 border border-base-300 rounded-box gap-2 p-4 cursor-pointer hover:bg-base-300 transition-colors duration-200"
    onClick={onClick}
    role="button"
    tabIndex={0}
  >
    <div className="container mb-4">
      <div className="flex flex-col gap-2 p-0.5 bg-base-200 rounded-lg">
        <div className="text-sm font-medium text-base-content">
          {isInbox
            ? message.senderName || "Unknown sender"
            : `To: ${message.receiverName || "Unknown receiver"}`}
        </div>
        <h4 className="font-bold text-lg text-base-content">
          {message.topic || "No topic"}
        </h4>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-base-content/70">
          <span className="badge badge-outline badge-info">
            {message.sendDate
              ? `Sent ${formatDate(message.sendDate)}`
              : "Send date unavailable"}
          </span>
          {isInbox &&
            (message.readDate ? (
              <span
                className=" tooltip"
                data-tip={formatDate(message.readDate)}
              >
                <EnvelopeOpenFill className="w-5 h-5 text-success" />
              </span>
            ) : (
              <span className=" tooltip" data-tip="Unread">
                <EnvelopeFill className="w-5 h-5 text-error" />
              </span>
            ))}{" "}
          <TagsComponent tags={message.tags} />
        </div>
        <div className="text-sm text-base-content/80">
          {removeCDATA(decodeBase64(message.content)) ||
            "No content available."}
        </div>
        <AttachmentItemWarning hasAttachment={message.isAnyFileAttached} />
        <div className="mt-2"></div>
      </div>
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
  const [readMoreMessage, setReadMoreMessage] = useState(null);
  const [isInbox, setIsInbox] = useState(true);

  // Retrieve list of messages.
  const {
    data: messagesData,
    loading: messagesLoading,
    error: messagesError,
    loadMore: loadMoreMessages,
    resetBox: changeInbox,
  } = useMessages(isInbox); // Modified to accept isInbox parameter

  // Retrieve details for the focused message.
  const {
    data: messageDetailsData,
    loading: messageDetailsLoading,
    error: messageDetailsError,
  } = useMessageDetails(readMoreMessage, isInbox);

  // Handler to close the message modal.
  const handleDialogClose = () => {
    setFocusedMessage(null);
  };

  // Handler to open the modal with detailed message information.
  const handleItemClick = (messageId) => {
    setFocusedMessage(messageId);
    document.getElementById("message_modal").showModal();
  };
  const handleReadMore = (messageId) => {
    setReadMoreMessage(messageId);
  };

  const handleReadMoreClose = () => {
    setReadMoreMessage(null);
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
        messageDetailsData={messageDetailsData}
        messageDetailsLoading={messageDetailsLoading}
        messageDetailsError={messageDetailsError}
        onClose={handleDialogClose}
      />
      {readMoreMessage && messageDetailsData ? (
        <RenderDetailedMessageItem
          message={messageDetailsData}
          backFuction={handleReadMoreClose}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl font-semibold">Messages</div>
            <br/>
            <div>
              <span className="text-xl font-semibold">
                {isInbox ? "Inbox" : "Outbox"}
              </span>
            </div>
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
export { MessageItem }; //for testing puprposes
export default MessagesPage;
