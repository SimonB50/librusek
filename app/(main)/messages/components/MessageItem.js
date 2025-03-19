"use client";

import { EnvelopeOpenFill, EnvelopeFill } from "react-bootstrap-icons";
import { TagsList } from "./TagsList";
import { AttachmentWarning } from "./AttachmentWarning";
import { removeCDATA, decodeBase64, formatDate } from "@/lib/utils";
import { MESSAGE_PLACEHOLDERS } from "@/lib/placeholders";

export const MessageItem = ({ message, onClick, isInbox }) => {
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
            ? message.senderName || MESSAGE_PLACEHOLDERS.UNKNOWN_SENDER
            : `To: ${message.receiverName || MESSAGE_PLACEHOLDERS.UNKNOWN_RECEIVER}`}
        </div>
        <h4 className="font-bold text-lg text-base-content">
          {message.topic || MESSAGE_PLACEHOLDERS.NO_TOPIC}
        </h4>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-base-content/70">
          <span className="badge badge-outline badge-info">
            {message.sendDate
              ? `Sent ${formatDate(message.sendDate)}`
              : MESSAGE_PLACEHOLDERS.SEND_DATE_UNAVAILABLE}
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
          {removeCDATA(decodeBase64(message.content)) || MESSAGE_PLACEHOLDERS.NO_CONTENT}
        </div>
        <AttachmentWarning hasAttachment={message.isAnyFileAttached} />
      </div>
    </div>
  );
};
