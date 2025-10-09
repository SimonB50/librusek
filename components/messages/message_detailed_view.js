import { useState } from "react";
import {
  MessageReceivers,
  TagsList,
} from "./message_common_component";
import { decodeAndCleanHtml, formatDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { fetchAttachmentDownloadUrl } from "@/lib/messages";
import { Download, XCircle } from 'react-bootstrap-icons';

const DetailedMessageView = ({ message, onBack, tagsLibrary }) => {
  const { t } = useTranslation("messages"); // Namespace 'messages'
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState(null);

  const handleDownload = async (attachment, messageId) => {
    setDownloading(attachment.id);
    setError(null);
    try {
      const downloadUrl = await fetchAttachmentDownloadUrl(attachment.id, messageId);
      const newWindow = window.open(downloadUrl, '_blank', 'noopener');
      if (!newWindow) {
        // If window.open is blocked, newWindow is null.
        // Fallback to creating a link and clicking it.
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', attachment.filename || 'download');
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Download failed:", error);
      setError("Download failed. Please try again. If the problem persists, please contact support.");
    } finally {
      setDownloading(null);
    }
  };


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
        <TagsList tags={message.tags} tagsLibrary={tagsLibrary} />
        {message.attachments && message.attachments.length > 0 && (
          <div>
            <h4 className="font-bold text-lg">{t("attachments")}:</h4>
            <ul>
              {message.attachments.map((attachment) => (
                <li key={attachment.id} className="flex items-center">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (downloading !== attachment.id) {
                        handleDownload(attachment, message.id);
                      }
                    }}
                    className={`link link-primary ${downloading === attachment.id ? 'pointer-events-none' : ''}`}
                  >
                    <span className="line-clamp-2">{attachment.filename}</span>
                  </a>
                  {downloading === attachment.id && (
                    <span className="loading loading-spinner loading-xs ml-2"></span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {error && (
          <div role="alert" className="alert alert-error">
            <XCircle className="h-6 w-6" />
            <span>{error}</span>
          </div>
        )}
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