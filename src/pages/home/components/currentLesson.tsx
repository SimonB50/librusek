import {useEffect, useState} from "react";
import {RiTimeLine} from "@remixicon/react";
import type {TFunction} from "i18next";
import {useTranslation} from "react-i18next";
import {Link} from "wouter";
import {Timetable} from "../../../client/resources/index.js";
import type {TimetableData, TimetableLessonData} from "../../../client/types/index.js";
import {ClassroomName} from "../../../components/names.js";
import InfoTile from "../../../components/infoTile.js";
import {T} from "../../../components/translate.js";
import DateUtils from "../../../lib/date.js";
import {detailsHref, lessonLinkId} from "../../../lib/deepLink.js";
import Display from "../../../lib/display.js";

interface FoundLesson {
  date: string;
  lesson: TimetableLessonData;
  current: boolean;
}

const minutesOf = (time: string) => {
  const [hours, minutes] = DateUtils.time(time).split(":").map(Number);
  return hours * 60 + minutes;
};

/** First lesson in progress or still ahead - cancelled lessons are skipped. */
const findLesson = (weeks: (TimetableData | undefined)[], now: Date): FoundLesson | null => {
  const today = DateUtils.toDateString(now);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const days = weeks
    .flatMap(week => Object.entries(week ?? {}))
    .filter(([date]) => date >= today)
    .sort(([a], [b]) => a.localeCompare(b));
  for (const [date, slots] of days) {
    const lessons = slots.flat()
      .filter(lesson => !lesson.isCanceled)
      .sort((a, b) => minutesOf(a.hourFrom) - minutesOf(b.hourFrom));
    for (const lesson of lessons) {
      if (date > today || minutes < minutesOf(lesson.hourTo)) {
        return {date, lesson, current: date === today && minutes >= minutesOf(lesson.hourFrom)};
      }
    }
  }
  return null;
};

/** Re-renders every minute, so "now" / "next" flips without a reload. */
const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(id);
  }, []);
  return now;
};

const when = (found: FoundLesson, t: TFunction<"landing">) => {
  const from = DateUtils.time(found.lesson.hourFrom);
  const to = DateUtils.time(found.lesson.hourTo);
  if (found.current) return t("blocks.lesson.until", {time: to});
  if (DateUtils.isToday(found.date)) return t("blocks.lesson.at", {time: from});
  return `${Display.upperFirst(DateUtils.relative(found.date))}, ${from}`;
};

/** Current or next lesson with its classroom - this week, or the next one when this week is over. */
const CurrentLesson = () => {
  const {t} = useTranslation("landing");
  const now = useNow();
  const weekStart = DateUtils.toDateString(DateUtils.weekStart(now));
  const nextWeekStart = DateUtils.toDateString(DateUtils.addDays(weekStart, 7));
  const thisWeek = Timetable.useQuery({weekStart});
  const fromThisWeek = thisWeek.data ? findLesson([thisWeek.data], now) : null;
  // Next week is only needed when nothing is left this week (Friday afternoon, weekend)
  const nextWeek = Timetable.useQuery({weekStart: nextWeekStart}, {enabled: thisWeek.isSuccess && !fromThisWeek});
  const found = fromThisWeek ?? (nextWeek.data ? findLesson([nextWeek.data], now) : null);
  const isPending = thisWeek.isPending || (!fromThisWeek && thisWeek.isSuccess && nextWeek.isPending);

  const lesson = found?.lesson;
  const progress = found?.current && lesson
    ? Math.min(100, ((now.getHours() * 60 + now.getMinutes() - minutesOf(lesson.hourFrom)) / (minutesOf(lesson.hourTo) - minutesOf(lesson.hourFrom))) * 100)
    : null;

  return (
    <Link href={found ? detailsHref("/timetable", lessonLinkId(found.date, found.lesson), {week: DateUtils.weekStart(found.date)}) : "/timetable"} className="block rounded-box transition-transform hover:scale-[1.01]">
      <InfoTile
        icon={<RiTimeLine/>}
        title={found?.current ? t("blocks.lesson.now") : t("blocks.lesson.next")}
        badge={found?.lesson.isSubstitutionClass ? <span className="badge badge-sm badge-primary">{t("blocks.lesson.substitution")}</span> : undefined}
        clamp={false}
      >
        {isPending
          ? <span className="skeleton h-6 w-40 block"></span>
          : lesson && found
            ? (
              <span className="flex flex-col">
                <span className="line-clamp-1"><T text={Display.upperFirst(lesson.subject.name)} name/></span>
                <span className="text-sm font-normal text-base-content/70">
                  {t("blocks.lesson.room")} <ClassroomName id={lesson.classroom?.id}/> · {when(found, t)}
                </span>
                {progress !== null && <progress className="progress progress-primary h-1 mt-1" value={progress} max={100}></progress>}
              </span>
            )
            : <span className="text-base-content/60 font-normal">{t("blocks.lesson.none")}</span>}
      </InfoTile>
    </Link>
  );
};

export default CurrentLesson;
