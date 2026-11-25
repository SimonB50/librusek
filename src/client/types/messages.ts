/**
 * wiadomosci.librus.pl API (`/api`) - JSON is already camelCase, envelope is `{ data, total? }`.
 *
 * `Raw*` types describe responses as sent (checked against live data, Nov 2026).
 * The rest is what the `Messages*` resources cache: base64 bodies decoded, numeric strings
 * converted, consistent `id` field.
 */

type MessageId = string;

/** Folder of the messages module. */
type MessageBox = "inbox" | "outbox" | "trash" | "archiveInbox" | "archiveOutbox" | "archiveTrash";

/* ------------------------------------------------------------------------------------------------
 * Raw responses
 * ----------------------------------------------------------------------------------------------*/

interface RawMessageListResponse<T> {
  data: T[];
  total: number;
  /** archive lists only */
  archivingInProgress?: boolean;
}

/** Item of `GET /inbox/messages?page=&limit=` (and archive/trash lists) */
interface RawMessageListItem {
  messageId: string;
  topic: string;
  /** Base64, HTML, preview of the body */
  content: string;
  /** ISO without zone, e.g. `2026-11-10T08:15:00` */
  sendDate: string;
  readDate: string | null;
  senderFirstName?: string;
  senderLastName?: string;
  senderName?: string;
  /** outbox lists (empty for the tested account - field names from the official client filters) */
  receiverFirstName?: string;
  receiverLastName?: string;
  receiverName?: string;
  tags: unknown[];
  category: number | string | null;
  isAnyFileAttached: boolean;
  otherNodeUuid: string | null;
  otherNodeAccountId: string | null;
}

/** `GET /inbox/messages/{id}` - fetching it marks the message as read! */
interface RawMessageDetails {
  messageId: string;
  topic: string;
  /** Base64 HTML body (capital `M` - the only non camelCase key). Absent in the trash, which sends `content` instead. */
  Message?: string;
  /** Base64 body of trash messages (same format as `Message`) */
  content?: string;
  sendDate: string;
  readDate: string | null;
  senderId: string;
  senderFirstName: string;
  senderLastName: string;
  senderName: string;
  senderGroup: string;
  senderGroupId: string;
  senderTitle: string | null;
  senderSchoolName: string | null;
  userFirstName: string;
  userLastName: string;
  userClass: string;
  /** numeric strings */
  receiver: string;
  myMessage: string;
  spam: string;
  state: string;
  noReply: number;
  archive: number;
  attachementInfo: string;
  attachments: RawMessageAttachment[];
  enableMessageWithdrawn: number;
  isMessageWithdrawn: number;
  receiversCount: number;
  readedCount: number;
  receivers?: MessageDetailsReceiverData[];
  tags: unknown[];
  originalMessage: string;
  originalTopic: string;
  applicationNumber: string | null;
  otherNodeUuid: string | null;
  otherNodeAccountId: string | null;
  otherNodeMessageId: string | null;
}

interface RawMessageAttachment {
  id: string;
  filename: string;
}

/* ------------------------------------------------------------------------------------------------
 * Normalized data
 * ----------------------------------------------------------------------------------------------*/

interface MessagePerson {
  firstName: string;
  lastName: string;
  /** Display name with role, e.g. `"Jan Kowalski (Nauczyciel)"` */
  name: string;
}

interface MessageListItemData {
  id: MessageId;
  topic: string;
  /** Decoded HTML preview */
  preview: string;
  sendDate: string;
  readDate: string | null;
  isRead: boolean;
  /** inbox */
  sender?: MessagePerson;
  /** outbox */
  receiver?: MessagePerson;
  tags: unknown[];
  category: number | string | null;
  hasAttachments: boolean;
}

interface MessageAttachmentData {
  id: string;
  filename: string;
}

interface MessageDetailsData {
  id: MessageId;
  topic: string;
  /** Decoded HTML body */
  content: string;
  sendDate: string;
  readDate: string | null;
  sender: MessagePerson & {
    id: string;
    group: string;
    groupId: string;
    title: string | null;
    schoolName: string | null;
  };
  attachments: MessageAttachmentData[];
  /** Sent messages only */
  receivers: MessageDetailsReceiverData[];
  receiversCount: number;
  readCount: number;
  isArchived: boolean;
  canReply: boolean;
  isWithdrawn: boolean;
  isSpam: boolean;
  isMine: boolean;
  state: number;
  tags: unknown[];
  /** Untouched response - for fields not mapped above */
  raw: RawMessageDetails;
}

/** `GET /attachments/{attachmentId}/messages/{messageId}` - short living link */
interface MessageAttachmentLinkData {
  downloadLink: string;
}

/** `GET /me` - messages module account */
interface MessagesAccountData {
  firstName: string;
  lastName: string;
  groupId: string;
  groupName: string;
  schoolProjectId: string;
  accountId: number;
  /** `"synergia"` when the session came from Synergia */
  originSystem: string;
  accessToAttachments: boolean;
  schoolCloudStorageVariant: string;
  cloudStorageIsConfigured: boolean;
  nextWorkStartTime: string | null;
  canSetIndividualHours: boolean;
}

/** `GET /inbox/unreadMessagesCount` */
interface UnreadMessagesCountData {
  inbox: number;
  notes: number;
  alerts: number;
  substitutions: number;
  absences: number;
  justifications: number;
  trash: number;
  archiveInbox: number;
  archiveNotes: number;
  archiveAlerts: number;
  archiveSubstitutions: number;
  archiveAbsences: number;
  archiveJustifications: number;
  archiveTrash: number;
}

/** `GET /tags` - user defined labels (empty for the tested account, fields from the official client) */
interface MessageTagData {
  tagId: number | string;
  name: string;
  [key: string]: unknown;
}

/** `GET /inbox/messages/senders` - filter options */
interface MessageSenderData {
  senderId: number;
  senderFirstName: string;
  senderLastName: string;
}

/** Receiver of a sent message (`receivers` in the message details) */
interface MessageDetailsReceiverData {
  receiverId: string;
  firstName: string;
  lastName: string;
  name: string;
  group: string;
  /** Read date, `null` when not read yet */
  readed: string | null;
  isCc: string;
  isBcc: string;
}

/** `GET /outbox/messages/receivers` - filter options (empty for the tested account) */
interface MessageReceiverData {
  receiverId: number;
  receiverFirstName: string;
  receiverLastName: string;
}

/** `GET /receivers/types` - who can be messaged */
interface MessageReceiverTypesData {
  defaultGroup: string;
  list: { id: string; name: string }[];
}

/** `GET /receivers/student-subjects` - teachers of the student's subjects */
interface MessageStudentSubjectData {
  teacherIdentifier: number;
  subject: string;
}

export type {
  MessageDetailsReceiverData,
  MessageId, MessageBox, RawMessageListResponse, RawMessageListItem, RawMessageDetails, RawMessageAttachment,
  MessagePerson, MessageListItemData, MessageAttachmentData, MessageDetailsData, MessageAttachmentLinkData,
  MessagesAccountData, UnreadMessagesCountData, MessageTagData, MessageSenderData, MessageReceiverData,
  MessageReceiverTypesData, MessageStudentSubjectData,
};
