import {useState} from "react";
import {RiBookLine, RiBusLine, RiFileLine, RiInformationLine, RiQuestionLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {Help, LibraryLendings, SchoolFiles, SchoolTrips} from "../../client/resources/index.js";
import type {HelpArticleData, SchoolTripData} from "../../client/types/index.js";
import {DetailList, DetailRow, Modal} from "../../components/modal.js";
import {EmptyState, PageHeader, SkeletonList, Tile} from "../../components/page.js";
import {QueryState} from "../../components/queryState.js";
import RichText from "../../components/richText.js";
import {T, TranslateToggle, TranslationScope} from "../../components/translate.js";
import DateUtils from "../../lib/date.js";
import Display from "../../lib/display.js";

type Tab = "files" | "trips" | "library" | "help";

const TABS: { key: Tab; icon: typeof RiFileLine }[] = [
  {key: "files", icon: RiFileLine},
  {key: "trips", icon: RiBusLine},
  {key: "library", icon: RiBookLine},
  {key: "help", icon: RiQuestionLine},
];

const Files = () => {
  const {t} = useTranslation("school");
  return (
    <QueryState query={SchoolFiles.useQuery()} loading={<SkeletonList count={3} className="h-14"/>}>
      {files => files.length === 0
        ? <EmptyState icon={<RiFileLine/>}>{t("files.empty")}</EmptyState>
        : (
          <ul className="list bg-base-200 border border-base-300 rounded-box">
            {files.map(file => (
              <li key={file.id} className="list-row items-center">
                <RiFileLine className="text-2xl text-primary"/>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold truncate">{file.displayName}</span>
                  <span className="text-xs text-base-content/60">{t("files.added", {date: DateUtils.formatDate(file.addedOnDate)})}</span>
                </div>
                <a className="btn btn-sm" href={file.downloadUrl} target="_blank" rel="noopener noreferrer">{t("common:actions.download")}</a>
              </li>
            ))}
          </ul>
        )}
    </QueryState>
  );
};

const Trips = () => {
  const {t} = useTranslation("school");
  const [focused, setFocused] = useState<SchoolTripData | null>(null);
  return (
    <>
      <QueryState query={SchoolTrips.useQuery()} loading={<SkeletonList count={2}/>}>
        {trips => trips.length === 0
          ? <EmptyState icon={<RiBusLine/>}>{t("trips.empty")}</EmptyState>
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[...trips].sort((a, b) => b.termFrom.localeCompare(a.termFrom)).map(trip => (
                <Tile key={trip.id} onClick={() => setFocused(trip)} highlight={DateUtils.daysFromToday(trip.termTo) >= 0 && DateUtils.daysFromToday(trip.termFrom) <= 0}>
                  <span className="text-lg font-bold"><T text={trip.destination}/></span>
                  <span className="text-sm text-base-content/60">{DateUtils.formatDate(trip.termFrom)} – {DateUtils.formatDate(trip.termTo)}</span>
                </Tile>
              ))}
            </div>
          )}
      </QueryState>
      <TranslationScope id={focused?.id}>
      <Modal open={focused !== null} onClose={() => setFocused(null)} title={focused && <T text={focused.destination}/>}>
        {focused && (
          <>
          <TranslateToggle/>
          <DetailList>
            <DetailRow label={t("trips.term")}>{DateUtils.formatDate(focused.termFrom)} – {DateUtils.formatDate(focused.termTo)}</DetailRow>
            {focused.route && <DetailRow label={t("trips.route")}><T text={focused.route}/></DetailRow>}
            {focused.locomotion && <DetailRow label={t("trips.transport")}><T text={focused.locomotion}/></DetailRow>}
            {focused.coordinatorName && <DetailRow label={t("trips.coordinator")}>{focused.coordinatorName}</DetailRow>}
            <DetailRow label={t("trips.organizer")}>{Display.fullName({firstName: focused.creatorName, lastName: focused.creatorLastName})}</DetailRow>
          </DetailList>
          </>
        )}
      </Modal>
      </TranslationScope>
    </>
  );
};

/** `EbiblioLendings` - item shape unknown (empty for the tested account), titles are guessed. */
const Library = () => {
  const {t} = useTranslation("school");
  return (
    <QueryState query={LibraryLendings.useQuery()} loading={<SkeletonList count={2} className="h-14"/>}>
      {data => (
        <div className="flex flex-col gap-2">
          {data.lendings.length === 0
            ? <EmptyState icon={<RiBookLine/>}>{t("library.empty")}</EmptyState>
            : (
              <ul className="list bg-base-200 border border-base-300 rounded-box">
                {data.lendings.map((lending, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: lendings have no confirmed id field
                  <li key={index} className="list-row">
                    <RiBookLine className="text-2xl text-primary"/>
                    <span className="font-semibold">{String(lending.title ?? lending.name ?? JSON.stringify(lending))}</span>
                  </li>
                ))}
              </ul>
            )}
          {data.lastSynchronizationTimestamp > 0 && (
            <span className="text-xs text-base-content/50">
              {t("library.synced", {date: DateUtils.formatDateTime(new Date(data.lastSynchronizationTimestamp * 1000))})}
            </span>
          )}
        </div>
      )}
    </QueryState>
  );
};

const HelpArticles = () => {
  const {t} = useTranslation("school");
  const [focused, setFocused] = useState<HelpArticleData | null>(null);
  const articles = Help.useQuery(undefined, {
    select: list => list.filter(article => article.studentVisibility).sort((a, b) => a.order - b.order),
  });
  return (
    <>
      <div role="note" className="alert alert-soft alert-info">
        <RiInformationLine className="text-xl shrink-0"/>
        <span>{t("help.notice")}</span>
      </div>
      <QueryState query={articles} loading={<SkeletonList count={3} className="h-14"/>}>
        {list => list.length === 0
          ? <EmptyState icon={<RiQuestionLine/>}>{t("help.empty")}</EmptyState>
          : (
            <ul className="list bg-base-200 border border-base-300 rounded-box">
              {list.map(article => (
                <li key={article.id}>
                  <button type="button" onClick={() => setFocused(article)}
                          className="list-row w-full text-left items-center cursor-pointer hover:bg-base-300 transition-colors">
                    <RiQuestionLine className="text-xl text-primary"/>
                    <span className="font-medium"><T text={article.title}/></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
      </QueryState>
      <TranslationScope id={focused?.id}>
        <Modal open={focused !== null} onClose={() => setFocused(null)} title={focused && <T text={focused.title}/>} className="sm:max-w-2xl">
          {focused && (
            <>
              <TranslateToggle/>
              <RichText html={focused.description}/>
            </>
          )}
        </Modal>
      </TranslationScope>
    </>
  );
};

const Page = () => {
  const {t} = useTranslation("school");
  const [tab, setTab] = useState<Tab>("files");
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")}/>
      <div role="tablist" className="tabs tabs-box w-fit">
        {TABS.map(({key, icon: Icon}) => (
          <button key={key} type="button" role="tab" className={`tab gap-1 ${tab === key ? "tab-active" : ""}`} onClick={() => setTab(key)}>
            <Icon/> {t(`tabs.${key}`)}
          </button>
        ))}
      </div>
      {tab === "files" && <Files/>}
      {tab === "trips" && <Trips/>}
      {tab === "library" && <Library/>}
      {tab === "help" && <HelpArticles/>}
    </div>
  );
};

export default Page;
