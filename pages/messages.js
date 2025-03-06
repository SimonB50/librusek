import React, { useState, useEffect } from "react";
import {
  Paperclip,
  EnvelopeFill,
  EnvelopeOpenFill,
  PeopleFill,
} from "react-bootstrap-icons";
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (message) => {
    setFocusedMessage(message);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // UseEffect to sync modal state with DOM
  useEffect(() => {
    const modal = document.getElementById("my_modal_1");
    if (modal) {
      if (isModalOpen) {
        modal.showModal();
      } else {
        modal.close();
      }
    } else {
      console.error("Modal element not found in DOM");
    }
  }, [isModalOpen]);

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
    parseInt(localStorage.getItem("messagesPageLimit"), 10) || 5;

  const {
    data: messagesData,
    loading,
    error,
  } = useMessages({
    maxMessagesPerPage: messagesPerPage,
    page: pageNumber,
    isInbox: isInbox,
  });

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
    setPageNumber(1);
  };

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

  const renderLoadingSkeletons = (length) =>
    Array.from({ length: length }, (_, index) => (
      <div key={index} className="skeleton h-24 w-full" />
    ));

  const RenderDetailedMessageItem = ({ message }) => {
    return (
      <div className="text-base-content">
        {isInbox
          ? `From: ${message.senderName || "Unknown sender"}`
          : `To: ${
              Array.isArray(message.receivers) && message.receivers.length > 0
                ? message.receivers
                    .map(
                      (receiver) =>
                        receiver.name ||
                        `${receiver.firstName || ""} ${
                          receiver.lastName || ""
                        }`.trim() ||
                        "Unknown receiver"
                    )
                    .join(", ")
                : "Unknown receiver"
            }`}
        {Array.isArray(message.receivers) && message.receivers.length > 1 && (
          <div
            className="tooltip"
            data-tip={message.receivers
              .map(
                (receiver) =>
                  receiver.name ||
                  `${receiver.firstName || ""} ${
                    receiver.lastName || ""
                  }`.trim()
              )
              .join(", ")}
          >
            <PeopleFill className="ml-2" />
          </div>
        )}
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
            className={`badge badge-outline ${
              message.readDate ? "badge-success" : "badge-error"
            }`}
          >
            {message.readDate
              ? `Read ${formatDate(message.readDate)}`
              : "Unread"}
          </span>
        </div>
        <TagsComponent tags={message.tags} />
        <p className="py-4 text-base-content/80">
          {<MessageComponent message={message.Message} /> || "No content"}
        </p>
        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={() => setFocusedMessage(null)}
            className="btn btn-secondary"
          >
            Go Back
          </button>
          <button className="btn btn-primary" onClick={() => openModal(message)}>
            Odpowiedz
          </button>
        </div>
      </div>
    );
  };

  const renderMessageItem = (message) => (
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
            ))}
        </div>
        <div className="text-sm text-base-content/80">
          {removeCDATA(decodeBase64(message.content)) ||
            "No content available."}
        </div>
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
        <div className="mt-2">
          <TagsComponent tags={message.tags} />
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-4">
        {focusedMessage && !isModalOpen ? (
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
                messagesData.data.map((message) => renderMessageItem(message))
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
        {isModalOpen && focusedMessage && (
          <ReplyModal message={focusedMessage} onClose={closeModal} />
        )}
      </div>
    </Layout>
  );
};

const MessageComponent = ({ message, withBreaks = true }) => {
  const decodedMessage = message
    ? decodeAndCleanHtml(message, withBreaks)
    : "No content available";
  return <p dangerouslySetInnerHTML={{ __html: decodedMessage }} />;
};

// ReplyModal Component
const ReplyModal = ({ message, onClose }) => {
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);

  // Funkcje formatowania tematu i odbiorcy
  const formatTopic = (topic) => `Re: ${topic}`;
  const getReceiverName = (senderName) =>
    senderName && senderName.trim() !== "" ? senderName.trim() : "Unknown receiver";

  const topic = formatTopic(message.topic);
  const receiver = getReceiverName(message.senderName);

  const handleContentChange = (event) => {
    setContent(event.target.value);
  };

  // Zamknięcie modala po kliknięciu w tło lub "Cancel"
  const handleBackdropClick = (e) => {
    // Upewnij się, że kliknięcie pochodzi z tła modala, a nie z modala-box
    if (e.target.classList.contains("modal")) {
      onClose();
    }
  };

  const handleSend = async () => {
    if (!content.trim()) {
      setError("Message content cannot be empty!");
      return;
    }

    try {
      console.log("Message sent:", { topic, receiver, content });
      onClose();
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  return (
    // Klasa "modal-open" ustawia widoczność modala, zgodnie z daisyUI
    <div className={`modal modal-open`} onClick={handleBackdropClick}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg">Reply to Message</h3>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Subject</span>
          </label>
          <span className="badge">{topic}</span>
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">To:</span>
          </label>
          <span className="badge">{receiver}</span>
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Message Content</span>
          </label>
          <textarea
            value={content}
            onChange={handleContentChange}
            className="textarea textarea-bordered h-24"
            placeholder="Enter your message here..."
          />
        </div>
        {error && (
          <div className="alert alert-error mt-2">
            <span>{error}</span>
          </div>
        )}
        <div className="modal-action">
          <button className="btn btn-primary" onClick={handleSend}>
            Send
          </button>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;