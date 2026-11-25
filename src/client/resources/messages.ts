import remotePaths from "../paths.js";
import {Session} from "../session.js";
import type {InfiniteData} from "@tanstack/react-query";
import {defineInfiniteResource, defineResource, type Page} from "../query/resource.js";
import {MINUTE, queryClient} from "../query/client.js";
import {decodeBase64Utf8, messageBody, toInt} from "../../lib/text.js";
import type {
  MessageAttachmentLinkData, MessageBox, MessageDetailsData, MessageListItemData, MessageReceiverData,
  MessageReceiverTypesData, MessageSenderData, MessagesAccountData, MessageStudentSubjectData, MessageTagData,
  RawMessageDetails, RawMessageListItem, RawMessageListResponse, UnreadMessagesCountData,
} from "../types/index.js";

/**
 * wiadomosci.librus.pl - a separate service with its own cookie session.
 *
 * Every resource awaits `Session.ensureMessages` (follows the `synergia.librus.pl/wiadomosci3`
 * redirect chain once). A `401` re-activates the session and retries (see `Request.get`).
 * Responses are fetched `raw` (already camelCase) and mapped to the types in `types/messages.ts`.
 */

const paths = remotePaths.resources.messages;
const prepare = () => Session.ensureMessages();

const boxPaths: Record<MessageBox, string> = {
  inbox: paths.inbox,
  outbox: paths.outbox,
  trash: paths.trash,
  archiveInbox: paths.archiveInbox,
  archiveOutbox: paths.archiveOutbox,
  archiveTrash: paths.archiveTrash,
};

/** `category` filter values used by the official client (inbox only). */
const MessageCategory = {
  /** Uwagi */
  notes: "1,6",
  alerts: "2",
  /** Zastępstwa */
  substitutions: "3",
  /** eUsprawiedliwienia */
  justifications: "5",
} as const;

type MessageCategoryValue = typeof MessageCategory[keyof typeof MessageCategory];

const dataOf = <T>(raw: { data: T }) => raw.data;

/* Account & counters ---------------------------------------------------------------------------*/

const MessagesAccount = defineResource<MessagesAccountData, void, { data?: MessagesAccountData } & MessagesAccountData>({
  name: "messagesAccount",
  url: paths.me,
  request: () => ({format: "raw"}),
  // `/me` is the only endpoint without the `{ data }` envelope
  transform: (raw) => raw.data ?? raw,
  staleTime: 30 * MINUTE,
  prepare,
});

/** Unread counters per folder - also the cheapest "is the messages session alive" check. */
const UnreadMessagesCount = defineResource<UnreadMessagesCountData, void, { data: UnreadMessagesCountData }>({
  name: "unreadMessagesCount",
  url: paths.unreadCount,
  request: () => ({format: "raw"}),
  transform: dataOf,
  prepare,
});

const MessageTags = defineResource<MessageTagData[], void, { data: MessageTagData[] }>({
  name: "messageTags",
  url: paths.tags,
  request: () => ({format: "raw"}),
  transform: dataOf,
  staleTime: 30 * MINUTE,
  prepare,
});

/** Filter options for the inbox */
const MessageSenders = defineResource<MessageSenderData[], void, { data: MessageSenderData[] }>({
  name: "messageSenders",
  url: paths.senders,
  request: () => ({format: "raw"}),
  transform: dataOf,
  staleTime: 10 * MINUTE,
  prepare,
});

/** Filter options for the outbox */
const MessageReceivers = defineResource<MessageReceiverData[], void, { data: MessageReceiverData[] }>({
  name: "messageReceivers",
  url: paths.receivers,
  request: () => ({format: "raw"}),
  transform: dataOf,
  staleTime: 10 * MINUTE,
  prepare,
});

const MessageReceiverTypes = defineResource<MessageReceiverTypesData, void, { data: MessageReceiverTypesData }>({
  name: "messageReceiverTypes",
  url: paths.receiverTypes,
  request: () => ({format: "raw"}),
  transform: dataOf,
  staleTime: Infinity,
  prepare,
});

/** Teachers of the student's subjects (new message form) */
const MessageStudentSubjects = defineResource<MessageStudentSubjectData[], void, { data: MessageStudentSubjectData[] }>({
  name: "messageStudentSubjects",
  url: paths.studentSubjects,
  request: () => ({format: "raw"}),
  transform: dataOf,
  staleTime: Infinity,
  prepare,
});

/* Lists ----------------------------------------------------------------------------------------*/

interface MessageListParams {
  box: MessageBox;
  /** Items per page, defaults to 20 */
  limit?: number;
  category?: MessageCategoryValue;
  search?: string;
}

const person = (first?: string, last?: string, name?: string) =>
  first === undefined && last === undefined && name === undefined
    ? undefined
    : {firstName: first ?? "", lastName: last ?? "", name: name ?? `${first ?? ""} ${last ?? ""}`.trim()};

const toListItem = (raw: RawMessageListItem): MessageListItemData => ({
  id: raw.messageId,
  topic: raw.topic,
  preview: messageBody(decodeBase64Utf8(raw.content)),
  sendDate: raw.sendDate,
  readDate: raw.readDate,
  isRead: raw.readDate !== null,
  sender: person(raw.senderFirstName, raw.senderLastName, raw.senderName),
  receiver: person(raw.receiverFirstName, raw.receiverLastName, raw.receiverName),
  tags: raw.tags ?? [],
  category: raw.category,
  hasAttachments: raw.isAnyFileAttached,
});

/**
 * Paginated folder listing:
 * ```tsx
 * const inbox = Messages.useInfinite({box: "inbox"});
 * inbox.items; inbox.total; inbox.fetchNextPage(); inbox.hasNextPage;
 * const notes = Messages.useInfinite({box: "inbox", category: MessageCategory.notes});
 * ```
 */
const Messages = defineInfiniteResource<MessageListItemData, MessageListParams, RawMessageListResponse<RawMessageListItem>>({
  name: "messages",
  url: ({box}) => boxPaths[box],
  request: ({limit = 20, category, search}, page) => ({
    format: "raw",
    pagination: {page, limit},
    query: {category, search: search?.trim() || undefined},
  }),
  transform: (raw) => ({items: (raw.data ?? []).map(toListItem), total: raw.total}),
  pageSize: ({limit = 20}) => limit,
  prepare,
});

/* Details --------------------------------------------------------------------------------------*/

interface MessageParams {
  box: MessageBox;
  id: string;
}

const toDetails = (raw: RawMessageDetails): MessageDetailsData => ({
  id: raw.messageId,
  topic: raw.topic,
  content: messageBody(decodeBase64Utf8(raw.Message ?? raw.content)),
  sendDate: raw.sendDate,
  readDate: raw.readDate,
  sender: {
    id: raw.senderId,
    firstName: raw.senderFirstName,
    lastName: raw.senderLastName,
    name: raw.senderName,
    group: raw.senderGroup,
    groupId: raw.senderGroupId,
    title: raw.senderTitle,
    schoolName: raw.senderSchoolName,
  },
  attachments: raw.attachments ?? [],
  receivers: raw.receivers ?? [],
  receiversCount: raw.receiversCount ?? 0,
  readCount: raw.readedCount ?? 0,
  isArchived: toInt(raw.archive) === 1,
  canReply: toInt(raw.noReply) === 0,
  isWithdrawn: toInt(raw.isMessageWithdrawn) === 1,
  isSpam: toInt(raw.spam) === 1,
  isMine: toInt(raw.myMessage) === 1,
  state: toInt(raw.state),
  tags: raw.tags ?? [],
  raw,
});

/**
 * Single message. **Fetching an unread inbox message marks it as read** - unread counters
 * and the folder list are invalidated afterwards so badges stay in sync.
 */
const Message = defineResource<MessageDetailsData, MessageParams, { data: RawMessageDetails }>({
  name: "message",
  url: ({box, id}) => `${boxPaths[box]}/${id}`,
  request: () => ({format: "raw"}),
  // Trash answers without the `{ data }` envelope in the official client - accept both
  transform: (raw) => toDetails("data" in raw ? raw.data : raw as unknown as RawMessageDetails),
  afterFetch: (message, {box}) => {
    if (box !== "inbox" && box !== "archiveInbox") return;
    void UnreadMessagesCount.invalidate();
    // Mark as read in already loaded lists instead of refetching them
    queryClient.setQueriesData<InfiniteData<Page<MessageListItemData>>>({queryKey: Messages.key()}, (data) => data && {
      ...data,
      pages: data.pages.map(page => ({
        ...page,
        items: page.items.map(item => item.id === message.id && !item.isRead
          ? {...item, isRead: true, readDate: message.readDate ?? new Date().toISOString()}
          : item),
      })),
    });
  },
  staleTime: Infinity,
  prepare,
});

interface MessageAttachmentParams {
  attachmentId: string;
  messageId: string;
  archive?: boolean;
}

/** Download links expire - never cached. `queryClient.fetchQuery(MessageAttachment.options(...))` on click. */
const MessageAttachment = defineResource<MessageAttachmentLinkData, MessageAttachmentParams, { data: MessageAttachmentLinkData }>({
  name: "messageAttachment",
  url: ({attachmentId, messageId, archive}) => paths.attachment(attachmentId, messageId, archive),
  request: () => ({format: "raw"}),
  transform: dataOf,
  staleTime: 0,
  prepare,
});

export {
  MessageCategory, MessagesAccount, UnreadMessagesCount, MessageTags, MessageSenders, MessageReceivers,
  MessageReceiverTypes, MessageStudentSubjects, Messages, Message, MessageAttachment,
};
export type {MessageListParams, MessageParams, MessageAttachmentParams, MessageCategoryValue};
