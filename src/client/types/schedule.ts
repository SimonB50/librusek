import type {DateString, DateTimeString, Entity, Ref, StringId, TimeString} from "./common.js";
import type {ClassroomRef} from "./school.js";

/**
 * Single lesson slot inside `GET /Timetables?weekStart=`.
 * Librus sends ids and numbers as strings here - the `Timetable` resource converts them,
 * so refs can be passed straight to `Subjects.useOne()` etc.
 */
interface TimetableLessonData {
  lesson: Ref;
  subject: Ref & { name: string; short: string };
  teacher: Ref & { firstName: string; lastName: string };
  classroom?: Ref;
  class?: Ref;
  virtualClass?: Ref;
  virtualClassName?: string;
  timetableEntry: Ref;
  dateFrom: DateString;
  dateTo: DateString;
  hourFrom: TimeString;
  hourTo: TimeString;
  lessonNo: number;
  /** Day of week, `1` = Monday */
  dayNo: number;
  isCanceled: boolean;
  isSubstitutionClass: boolean;
  substitutionNote: string | null;
  /** Present on substitutions - the original lesson */
  orgSubject?: Ref;
  orgTeacher?: Ref;
  orgClassroom?: Ref;
  orgDate?: DateString;
  orgLessonNo?: number;
}

/**
 * `GET /Timetables?weekStart=YYYY-MM-DD`
 * Keyed by date; each day is a list indexed by lesson number, each holding 0..n parallel lessons.
 */
type TimetableData = Record<DateString, TimetableLessonData[][]>;

/** `GET /TimetableEntries/{ids}` - recurring timetable slot */
interface TimetableEntryData extends Entity {
  lesson: Ref;
  dateFrom: DateString;
  dateTo: DateString;
  dayOfTheWeek: number;
  lessonNo: number;
  classroom?: ClassroomRef;
  virtualClass?: Ref;
}

/** `GET /Realizations?date=YYYY-MM-DD` - lesson topics (zrealizowane) */
interface RealizationData extends Entity<StringId> {
  lesson: Ref;
  lessonNo: number;
  lessonNumber: number;
  date: DateString;
  topic: string;
  isTrip: boolean;
  /** `"true"`/`"false"` */
  countInStatistics: string;
  countInRPN: string;
  addedBy: Ref;
  implementedSkills: Ref<StringId>[];
  teachingProgramTopic: number;
  virtualClass?: Ref;
}

/** `GET /PlannedLessons` - empty for the tested account, shape unknown */
type PlannedLessonData = Entity<StringId> & Record<string, unknown>;

/** `GET /HomeWorks` - exams/tests and other class events ("sprawdziany", "kartkówki") */
interface ExamData extends Entity {
  content: string;
  date: DateString;
  category: Ref;
  /** `null` when the event is not bound to a lesson */
  lessonNo: string | null;
  timeFrom: TimeString;
  timeTo: TimeString;
  createdBy: Ref;
  class?: Ref;
  virtualClass?: Ref;
  subject?: Ref;
  addDate: DateTimeString;
  classroom?: ClassroomRef;
}

/** `GET /HomeWorks/Categories/{ids}` */
interface ExamCategoryData extends Entity {
  name: string;
  color: Ref;
}

/** `GET /HomeWorkAssignments` - empty for the tested account, fields from the old app */
interface HomeworkData extends Entity {
  text: string;
  topic?: string;
  date: DateString;
  dueDate: DateString;
  teacher?: Ref;
  lesson?: Ref;
  category?: Ref;
  student?: Ref;
  mustSendAttachFile?: boolean;
  sendFilePossible?: boolean;
  homeworkAssigmentFiles?: unknown[];
}

/** `GET /HomeWorkAssignments/Categories/{ids}` - uses `categoryName`, not `name` */
interface HomeworkCategoryData extends Entity {
  categoryName: string;
  teacher: Ref;
}

/** `GET /Calendars` - one calendar per class/group */
type CalendarData = Entity<StringId> & { url: string };

/**
 * `GET /Calendars/{id}?month=&year=` - references to the events of a month.
 * Resolve them with the collection resources (`Exams`, `TeacherFreeDays`...).
 */
interface CalendarMonthData {
  homeWorks: Ref[];
  teacherFreeDays: Ref[];
  schoolFreeDays: Ref[];
  classFreeDays: Ref[];
  substitutions: Ref[];
  parentTeacherConferences: Ref[];
}

/** `GET /Calendars/TeacherFreeDays` */
interface TeacherFreeDayData extends Entity {
  /** Reason, e.g. `"szkolenie"` */
  name: string;
  teacher: Ref;
  dateFrom: DateString;
  dateTo: DateString;
  timeFrom?: TimeString;
  timeTo?: TimeString;
  addDate: DateTimeString;
}

/** `GET /Calendars/SchoolFreeDays` */
interface SchoolFreeDayData extends Entity {
  name: string;
  dateFrom: DateString;
  dateTo: DateString;
  addDate: DateTimeString;
}

/** `GET /Calendars/ClassFreeDays` - empty for the tested account, same fields as school free days + class */
interface ClassFreeDayData extends SchoolFreeDayData {
  class?: Ref;
  virtualClass?: Ref;
  lessonNoFrom?: number;
  lessonNoTo?: number;
}

/** `GET /Calendars/Substitutions` - `org*` = original lesson */
interface SubstitutionData extends Entity {
  date: DateString;
  lessonNo: string;
  teacher: Ref;
  subject: Ref;
  classroomSymbol: string | null;
  orgDate: DateString;
  orgLessonNo: string;
  orgTeacher: Ref;
  orgSubject: Ref;
  orgClassroomSymbol: string | null;
  isCancelled: boolean;
  isShifted: boolean;
}

/** `GET /ParentTeacherConferences` - empty for the tested account */
interface ParentTeacherConferenceData extends Entity {
  date?: DateString;
  time?: TimeString;
  name?: string;
  topic?: string;
  room?: string;
  teacher?: Ref;
}

export type {
  TimetableLessonData, TimetableData, TimetableEntryData, RealizationData, PlannedLessonData,
  ExamData, ExamCategoryData, HomeworkData, HomeworkCategoryData,
  CalendarData, CalendarMonthData, TeacherFreeDayData, SchoolFreeDayData, ClassFreeDayData,
  SubstitutionData, ParentTeacherConferenceData,
};
