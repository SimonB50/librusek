import {useState} from "react";
import {RiAttachment2, RiErrorWarningLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {Message, MessageAttachment} from "../../../client/resources/index.js";
import {queryClient} from "../../../client/query/client.js";
import type {MessageAttachmentData, MessageBox} from "../../../client/types/index.js";
import {Modal} from "../../../components/modal.js";
import {ErrorTile} from "../../../components/queryState.js";
import RichText from "../../../components/richText.js";
import {T, TranslateToggle, TranslationScope} from "../../../components/translate.js";
import type {MessageRef} from "./types.js";
import DateUtils from "../../../lib/date.js";


const isArchive = (box: MessageBox) => box.startsWith("archive");

/**
 * Download links expire - fetched on click and opened in a new tab.
 * The old app appended `/get` to `downloadLink` (unverified against the live API).
 */
const Attachment = ({attachment, messageId, box}: { attachment: MessageAttachmentData; messageId: string; box: MessageBox }) => {
  const {t} = useTranslation("messages");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const download = async () => {
    setState("loading");
    try {
      const link = await queryClient.fetchQuery(MessageAttachment.options({attachmentId: attachment.id, messageId, archive: isArchive(box)}));
      window.open(`${link.downloadLink}/get`, "_blank", "noopener");
      setState("idle");
    } catch (error) {
      console.error("Attachment download failed", error);
      setState("error");
    }
  };
  return (
    <button type="button" onClick={download} disabled={state === "loading"}
            className={`btn btn-sm btn-soft justify-start max-w-full ${state === "error" ? "btn-error" : ""}`}
            title={state === "error" ? t("download.error", {filename: attachment.filename}) : attachment.filename}>
      {state === "loading" ? <span className="loading loading-spinner loading-xs"></span> : state === "error" ? <RiErrorWarningLine/> : <RiAttachment2/>}
      <span className="truncate">{attachment.filename}</span>
    </button>
  );
};

/**
 * Only mounted while the modal is open - **fetching an unread inbox message marks it as read**
 * (the resource updates lists and counters afterwards).
 */
const Body = ({message}: { message: MessageRef }) => {
  const {t} = useTranslation("messages");
  const details = Message.useQuery({box: message.box, id: message.id});

  if (details.error) return <ErrorTile error={details.error}/>;
  if (details.isPending) return (
    <div className="flex flex-col gap-2">
      <div className="skeleton h-5 w-48"></div>
      <div className="skeleton h-40"></div>
    </div>
  );

  const data = details.data;
  const outgoing = message.box.endsWith("utbox");
  const receivers = data.receivers.map(receiver => receiver.name || `${receiver.firstName} ${receiver.lastName}`.trim()).filter(Boolean).join(", ");
  return (
    <>
      <div className="flex flex-col gap-1 text-sm">
        <span>
          <span className="text-base-content/60">{t(outgoing ? "reciver_to" : "sender_from")}: </span>
          <span className="font-semibold">{outgoing ? receivers || t("missing.receiver") : data.sender.name || t("missing.sender")}</span>
        </span>
        <div className="flex flex-row flex-wrap gap-1">
          <span className="badge badge-sm badge-soft">{t("send")} {DateUtils.formatDateTime(data.sendDate)}</span>
          {!outgoing && data.readDate && <span className="badge badge-sm badge-soft badge-success">{t("read")} {DateUtils.formatDateTime(data.readDate)}</span>}
          {outgoing && data.receiversCount > 0 && (
            <span className="badge badge-sm badge-soft">{t("receivers_count", {read: data.readCount, count: data.receiversCount})}</span>
          )}
        </div>
      </div>
      {data.isWithdrawn && <div role="alert" className="alert alert-soft alert-warning"><span>{t("withdrawn")}</span></div>}
      {data.attachments.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-base-content/70">{t("attachments")}</span>
          <div className="flex flex-row flex-wrap gap-1">
            {data.attachments.map(attachment => <Attachment key={attachment.id} attachment={attachment} messageId={data.id} box={message.box}/>)}
          </div>
        </div>
      )}
      <div className="divider my-0"></div>
      <TranslateToggle/>
      {data.content ? <RichText html={data.content}/> : <span className="text-base-content/60">{t("missing.content")}</span>}
      {!data.canReply && !outgoing && <span className="text-xs text-base-content/50">{t("no_reply")}</span>}
    </>
  );
};

const MessageDetails = ({message, onClose}: { message: MessageRef | null; onClose: () => void }) => {
  const {t} = useTranslation("messages");
  return (
    <TranslationScope id={message?.id}>
      <Modal open={message !== null} onClose={onClose} title={message?.topic ? <T text={message.topic}/> : t("missing.topic")} className="sm:max-w-3xl">
        {message && <Body message={message}/>}
      </Modal>
    </TranslationScope>
  );
};

export default MessageDetails;
