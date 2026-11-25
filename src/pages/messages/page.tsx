import {useEffect, useRef, useState} from "react";
import {RiArchiveLine, RiAttachment2, RiMailLine, RiMailOpenLine, RiSearchLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {MessageCategory, type MessageCategoryValue, Messages, UnreadMessagesCount} from "../../client/resources/index.js";
import type {MessageBox, MessageListItemData, UnreadMessagesCountData} from "../../client/types/index.js";
import {EmptyState, PageHeader, SkeletonList} from "../../components/page.js";
import {ErrorTile} from "../../components/queryState.js";
import DateUtils from "../../lib/date.js";
import Html from "../../lib/html.js";
import {T} from "../../components/translate.js";
import MessageDetails from "./components/messageDetails.js";
import type {MessageRef} from "./components/types.js";

type Folder = "inbox" | "outbox" | "trash";
type CategoryKey = keyof typeof MessageCategory;

const FOLDERS: Folder[] = ["inbox", "outbox", "trash"];
const CATEGORIES: CategoryKey[] = ["notes", "alerts", "substitutions", "justifications"];

const boxOf = (folder: Folder, archive: boolean): MessageBox => {
  if (!archive) return folder;
  return folder === "inbox" ? "archiveInbox" : folder === "outbox" ? "archiveOutbox" : "archiveTrash";
};

/** Unread counter for a folder/category tab. */
const unreadOf = (counts: UnreadMessagesCountData | undefined, archive: boolean, key: Folder | CategoryKey) => {
  if (!counts) return 0;
  const name = archive ? `archive${key[0].toUpperCase()}${key.slice(1)}` : key;
  return (counts as unknown as Record<string, number>)[name] ?? 0;
};

const Count = ({value}: { value: number }) =>
  value > 0 ? <span className="badge badge-xs badge-primary">{value}</span> : null;

const MessageRow = ({message, outgoing, onOpen}: { message: MessageListItemData; outgoing: boolean; onOpen: () => void }) => {
  const {t} = useTranslation("messages");
  const unread = !outgoing && !message.isRead;
  const person = outgoing ? message.receiver : message.sender;
  return (
    <li>
      <button type="button" onClick={onOpen}
              className="list-row w-full text-left items-start cursor-pointer hover:bg-base-300 transition-colors rounded-none">
        <span className={`text-xl mt-0.5 ${unread ? "text-primary" : "text-base-content/40"}`}>
          {unread ? <RiMailLine/> : <RiMailOpenLine/>}
        </span>
        <div className="flex flex-col min-w-0 gap-0.5">
          <div className="flex flex-row justify-between gap-2">
            <span className={`truncate ${unread ? "font-bold" : "font-medium"}`}>
              {outgoing && <span className="text-base-content/60">{t("reciver_to")}: </span>}
              {person?.name || (outgoing ? t("missing.receiver") : t("missing.sender"))}
            </span>
            <span className="text-xs text-base-content/60 shrink-0">{DateUtils.formatDate(message.sendDate)}</span>
          </div>
          <span className={`flex flex-row items-center gap-1 truncate ${unread ? "font-semibold" : ""}`}>
            {message.hasAttachments && <RiAttachment2 className="shrink-0 text-base-content/60"/>}
            <span className="truncate">{message.topic ? <T text={message.topic}/> : t("missing.topic")}</span>
          </span>
          <span className="text-sm text-base-content/60 line-clamp-1"><T text={Html.toText(message.preview)}/></span>
        </div>
      </button>
    </li>
  );
};

/** Loads the next page when the sentinel scrolls into view (button as a fallback). */
const LoadMore = ({onLoad, loading}: { onLoad: () => void; loading: boolean }) => {
  const {t} = useTranslation();
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading) onLoad();
    }, {rootMargin: "200px"});
    observer.observe(element);
    return () => observer.disconnect();
  }, [onLoad, loading]);
  return (
    <button ref={ref} type="button" className="btn btn-ghost w-full" disabled={loading} onClick={onLoad}>
      {loading ? <span className="loading loading-spinner loading-sm"></span> : t("actions.load_more")}
    </button>
  );
};

const Page = () => {
  const {t} = useTranslation("messages");
  const [folder, setFolder] = useState<Folder>("inbox");
  const [archive, setArchive] = useState(false);
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState<MessageRef | null>(null);

  // Search after the user stops typing
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const box = boxOf(folder, archive);
  const categoryValue: MessageCategoryValue | undefined = folder === "inbox" && category ? MessageCategory[category] : undefined;
  const list = Messages.useInfinite({box, category: categoryValue, search: search || undefined});
  const {data: counts} = UnreadMessagesCount.useQuery();
  const outgoing = folder === "outbox";

  const selectFolder = (next: Folder) => {
    setFolder(next);
    if (next !== "inbox") setCategory(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("title")}
        subtitle={archive ? t("archive_hint") : t("subtitle")}
        actions={
          <label className="label cursor-pointer gap-2">
            <RiArchiveLine/>
            <span>{t("archive")}</span>
            <input type="checkbox" className="toggle toggle-sm" checked={archive} onChange={event => setArchive(event.target.checked)}/>
          </label>
        }
      />
      <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
        <div role="tablist" className="tabs tabs-box w-fit">
          {FOLDERS.map(option => (
            <button key={option} type="button" role="tab" className={`tab gap-1 ${folder === option ? "tab-active" : ""}`} onClick={() => selectFolder(option)}>
              {t(`boxes.${option}`)} {option !== "outbox" && <Count value={unreadOf(counts, archive, option)}/>}
            </button>
          ))}
        </div>
        <label className="input w-full md:w-72">
          <RiSearchLine className="opacity-50"/>
          <input type="search" placeholder={t("search")} value={searchInput} onChange={event => setSearchInput(event.target.value)}/>
        </label>
      </div>
      {folder === "inbox" && (
        <div className="flex flex-row flex-wrap gap-1">
          <button type="button" className={`btn btn-sm ${category === null ? "btn-primary" : "btn-ghost"}`} onClick={() => setCategory(null)}>
            {t("categories.all")}
          </button>
          {CATEGORIES.map(option => (
            <button key={option} type="button" className={`btn btn-sm gap-1 ${category === option ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setCategory(option)}>
              {t(`categories.${option}`)} <Count value={unreadOf(counts, archive, option)}/>
            </button>
          ))}
        </div>
      )}

      {list.error && list.items.length === 0
        ? <ErrorTile error={list.error}/>
        : list.isPending
          ? <div className="flex flex-col gap-2"><SkeletonList count={5} className="h-16"/></div>
          : list.items.length === 0
            ? <EmptyState icon={<RiMailLine/>}>{search ? t("no_results", {search}) : t("no_messages")}</EmptyState>
            : (
              <div className="flex flex-col gap-2">
                {list.total !== undefined && <span className="text-sm text-base-content/60">{t("count", {count: list.total})}</span>}
                <ul className="list bg-base-200 border border-base-300 rounded-box overflow-hidden">
                  {list.items.map(message => (
                    <MessageRow key={message.id} message={message} outgoing={outgoing}
                                onOpen={() => setOpened({box, id: message.id, topic: message.topic})}/>
                  ))}
                </ul>
                {list.hasNextPage && <LoadMore onLoad={() => void list.fetchNextPage()} loading={list.isFetchingNextPage}/>}
              </div>
            )}
      <MessageDetails message={opened} onClose={() => setOpened(null)}/>
    </div>
  );
};

export default Page;
