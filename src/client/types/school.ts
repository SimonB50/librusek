import type {DateString, DateTimeString, Entity, Id, Ref, StringId, TimeString} from "./common.js";

interface LessonRange {
  from: TimeString;
  to: TimeString;
  rawFrom: number;
  rawTo: number;
}

/** `GET /Schools` */
interface SchoolData extends Entity {
  name: string;
  town: string;
  street: string;
  state: string;
  buildingNumber: string;
  apartmentNumber: string;
  /** Lesson hours, index = lesson number */
  lessonsRange: LessonRange[];
  schoolYear: number;
  vocationalSchool: number;
  nameHeadTeacher: string;
  surnameHeadTeacher: string;
  project: number;
  postCode: string;
  service: {
    isSynergy: boolean;
    url: string;
    variant: {
      name: string;
      displayName: string;
    };
  };
  email: string;
  phoneNumber: string;
}

/** `GET /Units/{ids}` - school unit settings (which grade kinds are enabled, behaviour type...) */
interface UnitData extends Entity {
  name: string;
  shortName: string;
  /** e.g. `"Szkoła podstawowa"` */
  type: string;
  behaviourType: string;
  gradesSettings: {
    standardGradesEnabled: boolean;
    pointGradesEnabled: boolean;
    descriptiveGradesEnabled: boolean;
    forcePointGradesDictionaries: boolean;
    allowOverrangePointGrades: boolean;
    allowClassTutorEditGrades: boolean;
    canAddAnyGrades: boolean;
    grade0Map: string;
  };
  lessonSettings: {
    allowZeroLessonNumber: boolean;
    maxLessonNumber: number;
    isExtramuralCourse: boolean;
    isAdultsDaily: boolean;
    allowAddOtherLessons: boolean;
    allowAddSubstitutions: boolean;
  };
  behaviourGradesSettings: {
    startPoints: { semester1: number; semester2: number };
    showCategoriesShortcuts: boolean;
  };
  lessonsRange: LessonRange[];
}

/** `GET /Classes` */
interface ClassData extends Entity {
  number: number;
  symbol: string;
  beginSchoolYear: DateString;
  endFirstSemester: DateString;
  endSchoolYear: DateString;
  unit: Ref;
  classTutor: Ref;
  classTutors: Ref[];
}

/** `GET /VirtualClasses/{ids}` - groups (e.g. language groups) */
interface VirtualClassData extends Entity {
  name: string;
  symbol: string;
  number: number;
  teacher: Ref;
  subject: Ref;
}

/** `GET /LuckyNumbers` */
interface LuckyNumberData {
  luckyNumber: number;
  luckyNumberDay: DateString;
}

/** `GET /Subjects/{ids}` */
interface SubjectData extends Entity {
  name: string;
  no: number;
  short: string;
  isExtracurricular: boolean;
  isBlockLesson: boolean;
}

/** `GET /Lessons/{ids}` - binds teacher + subject + class */
interface LessonData extends Entity {
  teacher: Ref;
  subject: Ref;
  class?: Ref;
}

/** `GET /Classrooms/{ids}` */
interface ClassroomData extends Entity {
  name: string;
  symbol: string;
  size: number;
  schoolCommonRoom: boolean;
  description: string;
}

/** Classroom embedded in other payloads (`HomeWorks`, `TimetableEntries`) */
interface ClassroomRef extends Entity {
  symbol: string;
  name: string;
  size: number;
}

/** `GET /Colors/{ids}` - colors of grade/homework categories */
interface ColorData extends Entity {
  name: string;
  /** Hex without `#`, e.g. `"FF0000"` (camelized from `RGB`) */
  rGB: string;
}

/** `GET /SchoolNotices` - announcements */
interface SchoolNoticeData extends Entity<StringId> {
  subject: string;
  content: string;
  addedBy: Ref;
  creationDate: DateTimeString;
  startDate: DateString;
  endDate: DateString;
  wasRead: boolean;
}

/** `GET /SchoolFiles` (envelope `Data`, keys already camelCase) */
interface SchoolFileData extends Entity<StringId> {
  displayName: string;
  downloadUrl: string;
  iconUrl: string;
  addedOnDate: DateTimeString;
  cloudStorageFileId: string;
  fileStatus: string;
  sent: boolean;
  failed: boolean;
  processing: boolean;
  failureReason: string;
}

/** `GET /SchoolTrips` (envelope `Data`) */
interface SchoolTripData extends Entity {
  destination: string;
  route: string;
  locomotion: string;
  termFrom: DateString;
  termTo: DateString;
  creatorName: string;
  creatorLastName: string;
  coordinatorName: string;
}

/** `GET /Help` - help articles; `*Visibility` flags tell which account types see them */
interface HelpArticleData extends Entity {
  title: string;
  /** HTML */
  description: string;
  order: number;
  studentVisibility: boolean;
  parentVisibility: boolean;
  guardianVisibility: boolean;
  modulesIdsAssignedToHelp: Id[];
  [visibility: `${string}Visibility`]: boolean;
}

/** `GET /EbiblioLendings` (raw - keys already camelCase) */
interface LibraryLendingsData {
  lastSynchronizationTimestamp: number;
  /** Empty for the tested account - item shape unknown. */
  lendings: Record<string, unknown>[];
}

export type {
  LessonRange, SchoolData, UnitData, ClassData, VirtualClassData, LuckyNumberData,
  SubjectData, LessonData, ClassroomData, ClassroomRef, ColorData, SchoolNoticeData,
  SchoolFileData, SchoolTripData, HelpArticleData, LibraryLendingsData,
};
