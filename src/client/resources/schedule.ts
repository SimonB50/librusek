import remotePaths from "../paths.js";
import {defineDictionary, defineResource, normalizeId} from "../query/resource.js";
import {MINUTE} from "../query/client.js";
import type {
  CalendarData, CalendarMonthData, ClassFreeDayData, DateString, ExamCategoryData, ExamData, HomeworkCategoryData,
  HomeworkData, ParentTeacherConferenceData, PlannedLessonData, RealizationData, SchoolFreeDayData, SubstitutionData,
  TeacherFreeDayData, TimetableData, TimetableEntryData, TimetableLessonData,
} from "../types/index.js";

const paths = remotePaths.resources;

/* Timetable ------------------------------------------------------------------------------------*/

interface TimetableParams {
  /** Monday of the requested week, `YYYY-MM-DD` */
  weekStart: DateString;
}

const toNumber = (value: unknown) => (typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value);

/** `/Timetables` sends every id and number as a string - align it with the rest of the API. */
const normalizeLesson = (lesson: TimetableLessonData): TimetableLessonData => {
  const entries = Object.entries(lesson).map(([key, value]) => {
    if (value && typeof value === "object" && "id" in value) {
      return [key, {...value, id: normalizeId(value.id as string)}];
    }
    if (key === "lessonNo" || key === "dayNo" || key === "orgLessonNo") return [key, toNumber(value)];
    return [key, value];
  });
  return Object.fromEntries(entries) as TimetableLessonData;
};

/** Each week is a separate cache entry: `Timetable.useQuery({ weekStart: "2026-11-16" })` */
const Timetable = defineResource<TimetableData, TimetableParams>({
  name: "timetable",
  url: paths.timetables,
  request: ({weekStart}) => ({query: {weekStart}, envelope: "Timetable"}),
  transform: (days) => Object.fromEntries(
    Object.entries(days).map(([date, slots]) => [date, slots.map(slot => slot.map(normalizeLesson))]),
  ),
  staleTime: 5 * MINUTE,
});

const TimetableEntries = defineDictionary<TimetableEntryData>({name: "timetableEntries", url: paths.timetableEntries});

interface RealizationParams {
  /** `YYYY-MM-DD` */
  date: DateString;
}

/** Lesson topics of a day (zrealizowane lekcje) */
const Realizations = defineResource<RealizationData[], RealizationParams>({
  name: "realizations",
  url: paths.realizations,
  request: ({date}) => ({query: {date}}),
  staleTime: 5 * MINUTE,
});

const PlannedLessons = defineResource<PlannedLessonData[]>({name: "plannedLessons", url: paths.plannedLessons});

/* Homework & exams -----------------------------------------------------------------------------*/

/** `HomeWorks` endpoint actually holds exams/tests and other class events. */
const Exams = defineResource<ExamData[]>({name: "exams", url: paths.homeWorks});
const ExamCategories = defineDictionary<ExamCategoryData>({name: "examCategories", url: paths.homeWorkCategories});

const Homeworks = defineResource<HomeworkData[]>({name: "homeworks", url: paths.homeWorkAssignments});
const HomeworkCategories = defineDictionary<HomeworkCategoryData>({name: "homeworkCategories", url: paths.homeWorkAssignmentCategories});

/* Calendar -------------------------------------------------------------------------------------*/

const Calendars = defineResource<CalendarData[]>({name: "calendars", url: paths.calendars, staleTime: Infinity});

interface CalendarMonthParams {
  calendarId: string;
  /** `1`-`12` */
  month: number;
  year: number;
}

/** References to events of a month - resolve them with the collections below. */
const CalendarMonth = defineResource<CalendarMonthData, CalendarMonthParams>({
  name: "calendarMonth",
  url: ({calendarId}) => paths.calendar(calendarId),
  request: ({month, year}) => ({query: {month, year}, envelope: "Calendar"}),
  transform: (month) => ({
    homeWorks: month.homeWorks ?? [],
    teacherFreeDays: month.teacherFreeDays ?? [],
    schoolFreeDays: month.schoolFreeDays ?? [],
    classFreeDays: month.classFreeDays ?? [],
    substitutions: month.substitutions ?? [],
    parentTeacherConferences: month.parentTeacherConferences ?? [],
  }),
});

const TeacherFreeDays = defineResource<TeacherFreeDayData[]>({name: "teacherFreeDays", url: paths.teacherFreeDays});
const SchoolFreeDays = defineResource<SchoolFreeDayData[]>({name: "schoolFreeDays", url: paths.schoolFreeDays, staleTime: 30 * MINUTE});
const ClassFreeDays = defineResource<ClassFreeDayData[]>({name: "classFreeDays", url: paths.classFreeDays});
const Substitutions = defineResource<SubstitutionData[]>({name: "substitutions", url: paths.substitutions});
const ParentTeacherConferences = defineResource<ParentTeacherConferenceData[]>({
  name: "parentTeacherConferences",
  url: paths.parentTeacherConferences,
});

/* Attachments ----------------------------------------------------------------------------------*/

interface AttachmentParams {
  /** `<owner>-<attachment>` as built by the official client, e.g. `${homework.id}-${file.id}` (unverified) */
  id: string;
}

/** Short living download links - fetch on click: `queryClient.fetchQuery(HomeworkAttachment.options({id}))` */
const attachmentLink = (name: string, url: (id: string) => string) => defineResource<string, AttachmentParams>({
  name,
  url: ({id}) => url(id),
  request: () => ({envelope: "DownloadUrl"}),
  staleTime: 0,
});

const HomeworkAttachment = attachmentLink("homeworkAttachment", paths.homeWorkAssignmentAttachment);
const RealizationAttachment = attachmentLink("realizationAttachment", paths.realizationAttachment);
const PlannedLessonAttachment = attachmentLink("plannedLessonAttachment", paths.plannedLessonAttachment);

export {
  HomeworkAttachment, RealizationAttachment, PlannedLessonAttachment,
  Timetable, TimetableEntries, Realizations, PlannedLessons,
  Exams, ExamCategories, Homeworks, HomeworkCategories,
  Calendars, CalendarMonth, TeacherFreeDays, SchoolFreeDays, ClassFreeDays, Substitutions, ParentTeacherConferences,
};
export type {TimetableParams, RealizationParams, CalendarMonthParams, AttachmentParams};
