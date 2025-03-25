import {
  MessageReceivers,
  AttachmentWarning,
  TagsList,
} from "./message_common_component";
import { decodeAndCleanHtml, formatDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const DetailedMessageView = ({ message, onBack }) => {
  const { t } = useTranslation("messages"); // Namespace 'messages'

  return (
    <div className="text-base-content">
      <div className="flex flex-col gap-2 p-2">
        <span>
          {`${t("sender_from")}: `}
          <span className="badge badge-outline mr-2 mb-1">
            {message.senderName || `${t("missing.sender")}`}
          </span>
        </span>
        <div>
          To: <MessageReceivers receivers={message.receivers} />
        </div>
        <h3 className="font-bold text-2xl text-base-content my-2">
          {message.topic || `${t("missing.topic")}`}
        </h3>
        <div className="flex flex-col items-start gap-2 text-sm text-base-content/70">
          <span className="badge badge-outline badge-info">
            {message.sendDate
              ? `${t("send")} ${formatDate(message.sendDate)}`
              : `${t("missing.date")}`}
          </span>
          <span
            className={`badge ${message.readDate ? "badge-success badge-outline" : "badge-error"}`}
          >
            {message.readDate
              ? `${t("read")} ${formatDate(message.readDate)}`
              : `${t("unread")}`}
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
            `${t("missing.content")}`
          )}
        </p>
        <div className="flex justify-between mt-4">
          <button type="button" onClick={onBack} className="btn btn-secondary">
            {t("back_button")}
          </button>
        </div>
      </div>
    </div>
  );
};


export default DetailedMessageView;
