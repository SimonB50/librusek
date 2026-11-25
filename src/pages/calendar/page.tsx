import {useState} from "react";
import {RiArrowLeftSLine, RiArrowRightSLine, RiArrowRightUpLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {Link} from "wouter";
import {
  ClassFreeDays, ExamCategories, Exams, ParentTeacherConferences, SchoolFreeDays, Substitutions, TeacherFreeDays,
} from "../../client/resources/index.js";
import type {
  ClassFreeDayData, ExamData, ParentTeacherConferenceData, SchoolFreeDayData, SubstitutionData, TeacherFreeDayData,
} from "../../client/types/index.js";
import {Modal} from "../../components/modal.js";
import {T, TranslateToggle, TranslationScope} from "../../components/translate.js";
import {SubjectName, TeacherName} from "../../components/names.js";
import {PageHeader} from "../../components/page.js";
import DateUtils from "../../lib/date.js";
import {detailsHref} from "../../lib/deepLink.js";
import Display from "../../lib/display.js";

type CalendarEvent =
  | { kind: "exam"; item: ExamData }
  | { kind: "schoolFree"; item: SchoolFreeDayData }
  | { kind: "classFree"; item: ClassFreeDayData }
  | { kind: "teacherAbsence"; item: TeacherFreeDayData }
  | { kind: "substitution"; item: SubstitutionData }
  | { kind: "conference"; item: ParentTeacherConferenceData };

type EventKind = CalendarEvent["kind"];

const KINDS: EventKind[] = ["exam", "schoolFree", "classFree", "teacherAbsence", "substitution", "conference"];

const DOT: Record<EventKind, string> = {
  exam: "bg-primary",
  schoolFree: "bg-success",
  classFree: "bg-success",
  teacherAbsence: "bg-warning",
  substitution: "bg-info",
  conference: "bg-accent",
};

/** Every date between `from` and `to` (inclusive), capped to avoid runaway ranges. */
const eachDay = (from: string, to: string) => {
  const days: string[] = [];
  let current = DateUtils.startOfDay(from);
  const end = DateUtils.startOfDay(to);
  while (current <= end && days.length < 366) {
    days.push(DateUtils.toDateString(current));
    current = DateUtils.addDays(current, 1);
  }
  return days;
};

/**
 * Collections are fetched whole (they are small) and indexed by day locally -
 * `CalendarMonth` only returns references to the same items.
 */
const useEvents = () => {
  const exams = Exams.useQuery();
  const schoolFree = SchoolFreeDays.useQuery();
  const classFree = ClassFreeDays.useQuery();
  const teacherFree = TeacherFreeDays.useQuery();
  const substitutions = Substitutions.useQuery();
  const conferences = ParentTeacherConferences.useQuery();

  const byDay = new Map<string, CalendarEvent[]>();
  const add = (date: string, event: CalendarEvent) => {
    const list = byDay.get(date) ?? [];
    list.push(event);
    byDay.set(date, list);
  };
  for (const item of exams.data ?? []) add(item.date, {kind: "exam", item});
  for (const item of schoolFree.data ?? []) for (const day of eachDay(item.dateFrom, item.dateTo)) add(day, {kind: "schoolFree", item});
  for (const item of classFree.data ?? []) for (const day of eachDay(item.dateFrom, item.dateTo)) add(day, {kind: "classFree", item});
  for (const item of teacherFree.data ?? []) for (const day of eachDay(item.dateFrom, item.dateTo)) add(day, {kind: "teacherAbsence", item});
  for (const item of substitutions.data ?? []) add(item.orgDate, {kind: "substitution", item});
  for (const item of conferences.data ?? []) if (item.date) add(item.date, {kind: "conference", item});

  const isPending = [exams, schoolFree, teacherFree, substitutions].some(query => query.isPending);
  return {byDay, isPending};
};

/** Section with this event's details, if it has one (free days and conferences live only here). */
const targetOf = (event: CalendarEvent) => {
  switch (event.kind) {
    case "exam":
      return detailsHref("/exams", event.item.id);
    case "teacherAbsence":
      return detailsHref("/teacherAbsences", event.item.id);
    case "substitution":
      return "/teacherAbsences?tab=substitutions";
    default:
      return null;
  }
};

const ExamLabel = ({exam}: { exam: ExamData }) => {
  const {data} = ExamCategories.useOne(exam.category.id);
  return (
    <>
      <span className="font-semibold">{data ? <T text={Display.upperFirst(data.name)} name/> : "..."}</span>
      {exam.subject && <> · <SubjectName id={exam.subject.id}/></>}
      {exam.content && <span className="block text-sm text-base-content/70"><T text={exam.content}/></span>}
    </>
  );
};

const EventLabel = ({event}: { event: CalendarEvent }) => {
  const {t} = useTranslation("calendar");
  switch (event.kind) {
    case "exam":
      return <ExamLabel exam={event.item}/>;
    case "schoolFree":
    case "classFree":
      return <span className="font-semibold">{event.item.name ? <T text={event.item.name}/> : t(`legend.${event.kind}`)}</span>;
    case "teacherAbsence":
      return <><span className="font-semibold"><TeacherName id={event.item.teacher.id}/></span>{event.item.name && <> · <T text={event.item.name}/></>}</>;
    case "substitution":
      return (
        <>
          <span className="font-semibold"><SubjectName id={event.item.orgSubject.id}/></span>
          {` · ${t("common:common.lesson", {number: event.item.orgLessonNo})}`}
          {event.item.isCancelled && <span className="badge badge-xs badge-error ml-1">✕</span>}
        </>
      );
    case "conference":
      return <span className="font-semibold">{event.item.name || event.item.topic ? <T text={event.item.name || event.item.topic}/> : t("legend.conference")}</span>;
  }
};

const Page = () => {
  const {t} = useTranslation("calendar");
  const today = new Date();
  const [month, setMonth] = useState({year: today.getFullYear(), month: today.getMonth()});
  const [selected, setSelected] = useState<string | null>(null);
  const {byDay, isPending} = useEvents();

  const first = new Date(month.year, month.month, 1);
  const gridStart = DateUtils.weekStart(first);
  const weeks = Math.ceil((DateUtils.daysFromToday(new Date(month.year, month.month + 1, 0)) - DateUtils.daysFromToday(gridStart) + 1) / 7);
  const cells = Array.from({length: weeks * 7}, (_, index) => DateUtils.toDateString(DateUtils.addDays(gridStart, index)));
  const weekdays = cells.slice(0, 7).map(day => DateUtils.weekday(day, "short"));

  const shift = (delta: number) => {
    const next = new Date(month.year, month.month + delta, 1);
    setMonth({year: next.getFullYear(), month: next.getMonth()});
  };

  const selectedEvents = selected ? byDay.get(selected) ?? [] : [];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <div className="join">
            <button type="button" className="btn join-item" aria-label="previous month" onClick={() => shift(-1)}><RiArrowLeftSLine/></button>
            <button type="button" className="btn join-item min-w-40"
                    onClick={() => setMonth({year: today.getFullYear(), month: today.getMonth()})}>
              {Display.upperFirst(DateUtils.format(first, {month: "long", year: "numeric"}))}
            </button>
            <button type="button" className="btn join-item" aria-label="next month" onClick={() => shift(1)}><RiArrowRightSLine/></button>
          </div>
        }
      />
      <div className="flex flex-row flex-wrap gap-3 text-sm">
        {KINDS.filter(kind => kind !== "classFree").map(kind => (
          <span key={kind} className="flex flex-row items-center gap-1">
            <span className={`size-2.5 rounded-full ${DOT[kind]}`}></span>{t(`legend.${kind}`)}
          </span>
        ))}
      </div>
      <div className={`grid grid-cols-7 gap-1 ${isPending ? "opacity-60" : ""}`}>
        {weekdays.map(day => <span key={day} className="text-center text-xs uppercase text-base-content/60 py-1">{day}</span>)}
        {cells.map(day => {
          const date = DateUtils.parse(day);
          const inMonth = date.getMonth() === month.month;
          const events = byDay.get(day) ?? [];
          const kinds = KINDS.filter(kind => events.some(event => event.kind === kind));
          const free = kinds.includes("schoolFree") || kinds.includes("classFree");
          const isToday = DateUtils.isToday(day);
          return (
            <button key={day} type="button" onClick={() => setSelected(day)}
                    className={`flex flex-col items-start gap-1 p-1.5 sm:p-2 min-h-14 sm:min-h-20 rounded-box border text-left cursor-pointer transition-colors hover:bg-base-300
                      ${inMonth ? "bg-base-200" : "bg-base-100 text-base-content/40"} ${isToday ? "border-primary" : "border-base-300"} ${free && inMonth ? "bg-success/10" : ""}`}>
              <span className={`text-sm font-semibold ${isToday ? "text-primary" : ""}`}>{date.getDate()}</span>
              <div className="flex flex-row flex-wrap gap-0.5">
                {kinds.map(kind => <span key={kind} className={`size-2 rounded-full ${DOT[kind]}`}></span>)}
              </div>
              {events.length > 0 && (
                <span className="hidden md:block text-xs text-base-content/70 truncate w-full">
                  {t("events", {count: events.length})}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <TranslationScope id={selected}>
      <Modal open={selected !== null} onClose={() => setSelected(null)}
             title={selected && Display.upperFirst(`${DateUtils.weekday(selected)}, ${DateUtils.formatDate(selected)}`)}>
        {selectedEvents.length > 0 && <TranslateToggle/>}
        {selectedEvents.length === 0
          ? <span className="text-base-content/60">{t("empty_day")}</span>
          : (
            <ul className="flex flex-col gap-2">
              {selectedEvents.map(event => {
                const target = targetOf(event);
                const content = (
                  <>
                    <span className={`w-1 self-stretch rounded-full ${DOT[event.kind]}`}></span>
                    <div className="flex flex-col min-w-0 grow">
                      <span className="text-xs uppercase text-base-content/60">{t(`legend.${event.kind}`)}</span>
                      <span><EventLabel event={event}/></span>
                    </div>
                    {target && <RiArrowRightUpLine className="shrink-0 self-center text-base-content/50"/>}
                  </>
                );
                return (
                  <li key={`${event.kind}-${event.item.id}`}>
                    {target
                      ? <Link href={target} className="flex flex-row gap-3 p-3 bg-base-200 rounded-box hover:bg-base-300 transition-colors">{content}</Link>
                      : <div className="flex flex-row gap-3 p-3 bg-base-200 rounded-box">{content}</div>}
                  </li>
                );
              })}
            </ul>
          )}
      </Modal>
      </TranslationScope>
    </div>
  );
};

export default Page;
