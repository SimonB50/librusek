import { EnvelopeOpenFill, EnvelopeFill } from "react-bootstrap-icons";
import { AttachmentWarning, TagsList } from "./message_common_component";
import { removeCDATA, decodeBase64, formatDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export const MessageItem = ({ message, onClick, isInbox }) => {
  const { t } = useTranslation("messages"); // Namespace 'messages'

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-base-200 border border-base-300 rounded-box gap-2 p-4 cursor-pointer hover:bg-base-300 transition-colors duration-200"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium text-base-content">
          {isInbox
            ? message.senderName || t("missing.sender")
            : `${t("reciver_to")} : ${message.receiverName || t("missing.receiver")}`}
        </div>
        <h4 className="font-bold text-lg text-base-content">
          {message.topic || t("missing.topic")}
        </h4>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-base-content/70">
          <span className="badge badge-outline badge-info">
            {message.sendDate
              ? `${t("send")} ${formatDate(message.sendDate)}`
              : t("missing.date")}
          </span>
          {isInbox &&
            (message.readDate ? (
              <span className="tooltip" data-tip={formatDate(message.readDate)}>
                <EnvelopeOpenFill className="w-5 h-5 text-success" />
              </span>
            ) : (
              <span className="tooltip" data-tip={t("unread")}>
                <EnvelopeFill className="w-5 h-5 text-error" />
              </span>
            ))}
          <TagsList tags={message.tags} />
        </div>
        <div className="text-sm text-base-content/80">
          {removeCDATA(decodeBase64(message.content)) || t("missing.content")}
        </div>
        <AttachmentWarning hasAttachment={message.isAnyFileAttached} />
      </div>
    </div>
  );
};
