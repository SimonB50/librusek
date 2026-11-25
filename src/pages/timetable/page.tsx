import {useEffect, useState} from "react";
import {RiArrowLeftSLine, RiArrowRightSLine, RiCalendarScheduleLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {Realizations, Timetable} from "../../client/resources/index.js";
import type {TimetableLessonData} from "../../client/types/index.js";
import {DetailList, DetailRow, Modal} from "../../components/modal.js";
import {ClassroomName, SubjectName, TeacherName} from "../../components/names.js";
import {EmptyState, PageHeader, SkeletonList} from "../../components/page.js";
import {QueryState} from "../../components/queryState.js";
import {T, TranslateToggle, TranslationScope} from "../../components/translate.js";
import DateUtils from "../../lib/date.js";
import {lessonLinkId, useOpenFromLink, useSearchParam} from "../../lib/deepLink.js";
import Display from "../../lib/display.js";

interface FocusedLesson {
  date: string;
  lesson: TimetableLessonData;
}

const isNow = (date: string, lesson: TimetableLessonData) => {
  if (!DateUtils.isToday(date)) return false;
  const now = new Date().toTimeString().slice(0, 5);
  return DateUtils.time(lesson.hourFrom) <= now && now < DateUtils.time(lesson.hourTo);
};

/** Already over - dimmed, so the rest of the day stands out. */
const isPast = (date: string, lesson: TimetableLessonData) => {
  const days = DateUtils.daysFromToday(date);
  if (days !== 0) return days < 0;
  return DateUtils.time(lesson.hourTo) <= new Date().toTimeString().slice(0, 5);
};

const LessonCard = ({date, lesson, onOpen}: { date: string; lesson: TimetableLessonData; onOpen: (focused: FocusedLesson) => void }) => {
  const {t} = useTranslation("timetable");
  const current = isNow(date, lesson);
  const past = !current && isPast(date, lesson);
  return (
    <button
      type="button"
      onClick={() => onOpen({date, lesson})}
      className={`relative flex flex-row items-center gap-3 p-3 bg-base-200 border rounded-box text-left cursor-pointer transition-colors hover:bg-base-300 ${lesson.isSubstitutionClass || current ? "border-primary" : "border-base-300"} ${past ? "opacity-50 saturate-50 hover:opacity-80" : ""}`}
    >
      <span className="flex items-center justify-center size-8 shrink-0 rounded-full bg-base-100 font-bold">{lesson.lessonNo}</span>
      <div className={`flex flex-col min-w-0 grow ${lesson.isCanceled ? "line-through opacity-50" : ""}`}>
        <span className="font-semibold truncate"><T text={Display.upperFirst(lesson.subject.name)} name/></span>
        <span className="text-sm text-base-content/70 truncate">
          {Display.fullName(lesson.teacher)}
          {lesson.virtualClassName && <> · <T text={lesson.virtualClassName} name/></>}
        </span>
      </div>
      <span className="text-sm text-base-content/70 text-right shrink-0">
        {DateUtils.time(lesson.hourFrom)}<br/>{DateUtils.time(lesson.hourTo)}
      </span>
      {lesson.isCanceled && <span className="absolute -top-2 right-2 badge badge-sm badge-error">{t("canceled")}</span>}
      {!lesson.isCanceled && lesson.isSubstitutionClass && (
        <span className="absolute -top-2 right-2 badge badge-sm badge-primary">{t("substitution")}</span>
      )}
      {current && !lesson.isCanceled && !lesson.isSubstitutionClass && (
        <span className="absolute -top-2 right-2 badge badge-sm badge-primary">{t("now")}</span>
      )}
    </button>
  );
};

/** Topic comes from `Realizations` of that day - only fetched when the modal is open. */
const Topic = ({focused}: { focused: FocusedLesson }) => {
  const {t} = useTranslation("timetable");
  const realization = Realizations.useQuery({date: focused.date}, {
    select: list => list.find(item => item.lesson.id === focused.lesson.lesson.id && item.lessonNo === focused.lesson.lessonNo)
      ?? list.find(item => item.lessonNo === focused.lesson.lessonNo),
  });
  if (DateUtils.daysFromToday(focused.date) > 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-base-content/70">{t("details.topic")}</span>
      {realization.isPending
        ? <div className="skeleton h-12"></div>
        : <p className="p-3 bg-base-200 rounded-box">{realization.data?.topic ? <T text={realization.data.topic}/> : <span className="text-base-content/60">{t("details.no_topic")}</span>}</p>}
    </div>
  );
};

const LessonDetails = ({focused, onClose}: { focused: FocusedLesson | null; onClose: () => void }) => {
  const {t} = useTranslation(["timetable", "common"]);
  const lesson = focused?.lesson;
  return (
    <TranslationScope id={focused && lessonLinkId(focused.date, focused.lesson)}>
    <Modal
      open={focused !== null}
      onClose={onClose}
      title={lesson && <T text={Display.upperFirst(lesson.subject.name)} name/>}
      subtitle={focused && `${DateUtils.weekday(focused.date)}, ${DateUtils.formatDate(focused.date)}`}
    >
      {focused && lesson && (
        <>
          <TranslateToggle/>
          {(lesson.isCanceled || lesson.isSubstitutionClass) && (
            <div role="alert" className={`alert alert-soft ${lesson.isCanceled ? "alert-error" : "alert-info"}`}>
              <span>{lesson.isCanceled ? t("canceled") : t("details.substitution")}{lesson.substitutionNote && <> - <T text={lesson.substitutionNote}/></>}</span>
            </div>
          )}
          <DetailList>
            <DetailRow label={t("details.lesson")}>{lesson.lessonNo}</DetailRow>
            <DetailRow label={t("details.time")}>{DateUtils.time(lesson.hourFrom)} – {DateUtils.time(lesson.hourTo)}</DetailRow>
            <DetailRow label={t("details.teacher")}>{Display.fullName(lesson.teacher)}</DetailRow>
            {lesson.classroom && <DetailRow label={t("details.classroom")}><ClassroomName id={lesson.classroom.id}/></DetailRow>}
            {lesson.virtualClassName && <DetailRow label={t("details.group")}><T text={lesson.virtualClassName} name/></DetailRow>}
            {lesson.orgSubject && (
              <DetailRow label={t("details.original")}>
                <SubjectName id={lesson.orgSubject.id}/>
                {lesson.orgTeacher && <> · <TeacherName id={lesson.orgTeacher.id}/></>}
              </DetailRow>
            )}
          </DetailList>
          <Topic focused={focused}/>
        </>
      )}
    </Modal>
    </TranslationScope>
  );
};

const Page = () => {
  const {t} = useTranslation("timetable");
  const linkedWeek = useSearchParam("week");
  const [weekStart, setWeekStart] = useState(() => DateUtils.weekStart(linkedWeek ?? undefined));
  const [focused, setFocused] = useState<FocusedLesson | null>(null);
  const timetable = Timetable.useQuery({weekStart});

  // `?week=…&open=<date>_<lessonNo>` from the home page "current / next lesson" tile
  const weekLessons = timetable.data && Object.entries(timetable.data)
    .flatMap(([date, slots]) => slots.flat().map(lesson => ({date, lesson})));
  useOpenFromLink(weekLessons, item => lessonLinkId(item.date, item.lesson), setFocused);

  const shift = (weeks: number) => setWeekStart(DateUtils.toDateString(DateUtils.addDays(weekStart, weeks * 7)));

  // Neighbour weeks load in the background - switching weeks is instant
  useEffect(() => {
    void Timetable.prefetch({weekStart: DateUtils.toDateString(DateUtils.addDays(weekStart, 7))});
    void Timetable.prefetch({weekStart: DateUtils.toDateString(DateUtils.addDays(weekStart, -7))});
  }, [weekStart]);

  const isCurrentWeek = weekStart === DateUtils.weekStart();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("title")}
        subtitle={`${DateUtils.formatDate(weekStart)} – ${DateUtils.formatDate(DateUtils.addDays(weekStart, 4))}`}
        actions={
          <div className="join">
            <button type="button" className="btn join-item" aria-label="previous week" onClick={() => shift(-1)}><RiArrowLeftSLine/></button>
            <button type="button" className="btn join-item" disabled={isCurrentWeek} onClick={() => setWeekStart(DateUtils.weekStart())}>
              {t("common:actions.today")}
            </button>
            <button type="button" className="btn join-item" aria-label="next week" onClick={() => shift(1)}><RiArrowRightSLine/></button>
          </div>
        }
      />
      <QueryState query={timetable} loading={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><SkeletonList count={5} className="h-64"/></div>}>
        {week => {
          const days = Object.keys(week).sort()
            .filter(day => DateUtils.isoWeekday(day) <= 5 || week[day].some(slot => slot.length));
          if (days.length === 0) return <EmptyState icon={<RiCalendarScheduleLine/>}>{t("empty")}</EmptyState>;
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {days.map(day => {
                const lessons = week[day].flat();
                const today = DateUtils.isToday(day);
                return (
                  <div key={day} className="flex flex-col gap-2">
                    <div className="flex flex-row items-baseline gap-2">
                      <span className={`text-xl font-semibold ${today ? "text-primary" : ""}`}>{Display.upperFirst(DateUtils.weekday(day))}</span>
                      <span className="text-sm text-base-content/60">{DateUtils.formatDate(day)}</span>
                    </div>
                    {lessons.length === 0
                      ? <div className="p-3 bg-base-200 border border-dashed border-base-300 rounded-box text-center text-base-content/60">{t("empty")}</div>
                      : lessons.map(lesson => (
                        <LessonCard key={`${lesson.lessonNo}-${lesson.lesson.id}`} date={day} lesson={lesson} onOpen={setFocused}/>
                      ))}
                  </div>
                );
              })}
            </div>
          );
        }}
      </QueryState>
      <LessonDetails focused={focused} onClose={() => setFocused(null)}/>
    </div>
  );
};

export default Page;
