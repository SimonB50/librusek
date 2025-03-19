"use client";

import { MessageReceivers } from "./MessageReceivers";
import { TagsList } from "./TagsList";
import { AttachmentWarning } from "./AttachmentWarning";
import { decodeAndCleanHtml, formatDate } from "@/lib/utils";
import { MESSAGE_PLACEHOLDERS } from "@/lib/placeholders";

export const DetailedMessageView = ({ message, onBack }) => (
  <div className="text-base-content">
    <div className="flex flex-col gap-2 p-2">
      <span>
        From:{" "}
        <span className="badge badge-outline mr-2 mb-1">
          {message.senderName || MESSAGE_PLACEHOLDERS.UNKNOWN_SENDER}
        </span>
      </span>
      <div>
        To: <MessageReceivers receivers={message.receivers} />
      </div>
      <h3 className="font-bold text-2xl text-base-content my-2">
        {message.topic || MESSAGE_PLACEHOLDERS.NO_TOPIC}
      </h3>
      <div className="flex flex-col items-start gap-2 text-sm text-base-content/70">
        <span className="badge badge-outline badge-info">
          {message.sendDate
            ? `Sent ${formatDate(message.sendDate)}`
            : MESSAGE_PLACEHOLDERS.SEND_DATE_UNAVAILABLE}
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
          MESSAGE_PLACEHOLDERS.NO_CONTENT
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
