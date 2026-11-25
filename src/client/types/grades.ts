import type {DateString, DateTimeString, Entity, Flag, Ref, Semester, StringId} from "./common.js";

interface BaseGrade extends Entity {
  lesson: Ref;
  subject: Ref;
  student: Ref;
  category: Ref;
  addedBy: Ref;
  grade: string;
  date: DateString;
  addDate: DateTimeString;
  semester: Semester;
}

/** `GET /Grades` */
interface GradeData extends BaseGrade {
  isConstituent: boolean;
  isSemester: boolean;
  isSemesterProposition: boolean;
  isFinal: boolean;
  isFinalProposition: boolean;
  /** Present only when the grade has comments */
  comments?: Ref[];
  /** Grade improvement (poprawa) - not seen for the tested account */
  improvement?: Ref;
}

/** `GET /PointGrades` */
interface PointGradeData extends BaseGrade {
  /** Points as a string, e.g. `"8.50"` */
  gradeValue: string;
  comments?: Ref[];
}

/** `GET /TextGrades` - empty for the tested account, fields from the old app */
interface TextGradeData extends BaseGrade {
  comments?: Ref[];
  showInGradesView?: boolean;
  isSemester?: boolean;
  isSemesterProposition?: boolean;
  isFinal?: boolean;
  isFinalProposition?: boolean;
}

/**
 * `GET /DescriptiveGrades` and `GET /DescriptiveTextGrades` - empty for the tested account.
 * Fields follow {@link BaseGrade}; `skill`/`phrase` refs are used by the official client.
 */
interface DescriptiveGradeData extends Partial<Omit<BaseGrade, "id">>, Entity {
  skill?: Ref;
  phrase?: Ref;
  map?: string;
  realGradeValue?: string;
}

/** Discriminated union used when the UI shows every grade kind in one list. */
type AnyGrade =
  | (GradeData & { kind: "grade" })
  | (PointGradeData & { kind: "point" })
  | (TextGradeData & { kind: "text" });

/** `GET /Grades/Categories/{ids}` */
interface GradeCategoryData extends Entity {
  name: string;
  short: string;
  color: Ref;
  teacher?: Ref;
  weight: number;
  countToTheAverage: boolean;
  standard: boolean;
  /** `"true"`/`"false"` as a string */
  isReadOnly: string;
  blockAnyGrades: boolean;
  obligationToPerform: boolean;
  adultsExtramural: boolean;
  adultsDaily: boolean;
  isFinal: boolean;
  isFinalProposition: boolean;
  isSemestral: boolean;
  isSemestralProposition: boolean;
  isSemestralInSchoolForAdults: boolean;
}

/** `GET /PointGrades/Categories/{ids}` */
interface PointGradeCategoryData extends Entity {
  name: string;
  short: string;
  color: Ref;
  teacher: Ref;
  weight: number;
  countToTheAverage: boolean;
  /** Point range of the category */
  valueFrom: number;
  valueTo: number;
  obligationToPerform: boolean;
  countToPotMode: Ref;
  gradeCountType: Ref;
  typeOfCount: number;
  dontCountToPot: number;
  announcementDate?: DateString;
  realizationDate?: DateString;
}

/** `GET /TextGrades/Categories/{ids}` - same shape as {@link GradeCategoryData} */
type TextGradeCategoryData = GradeCategoryData;

/** `GET /Grades/Comments/{ids}`, `GET /PointGrades/Comments/{ids}` */
interface GradeCommentData extends Entity {
  text: string;
  addedBy: Ref;
  grade: Ref;
}

/** `GET /Grades/Averages` - per subject, `0` when not computed */
interface GradeAverageData {
  student: Ref;
  subject: Ref;
  semester1: number;
  semester2: number;
  fullYear: number;
}

/** `GET /Grades/Types` - e.g. `{ name: "plus", value: "+" }` */
interface GradeTypeData {
  name: string;
  value: string;
}

/** `GET /Grades/Scales` */
interface GradeScaleData extends Entity {
  name: string;
  types: string[];
}

/** `GET /PointGrades/Dictionaries` - named point values (empty for the tested account) */
interface PointGradeDictionaryData extends Entity {
  name: string;
  value: string | number;
}

/** `GET /DescriptiveGrades/Skills`, `GET /DescriptiveTextGrades/Skills` (fields from the official client) */
interface DescriptiveSkillData extends Entity {
  name: string;
  value?: string;
  subject?: Ref;
  countToTheAverage?: boolean;
  weight?: number;
}

/** `GET /BehaviourGrades` */
interface BehaviourGradeData extends Entity {
  gradeType: Ref;
  semester: Semester;
  isProposal: Flag;
  addDate: DateTimeString;
  addedBy?: Ref;
  student?: Ref;
}

/** `GET /BehaviourGrades/Types/{ids}` - ids are strings here */
interface BehaviourGradeTypeData extends Entity<StringId> {
  name: string;
  shortcut: string;
}

/**
 * `GET /BehaviourGrades/Points` - point based behaviour (empty for the tested account).
 * Comments: `GET /BehaviourGrades/Points/Comments/{id}`.
 */
interface BehaviourPointGradeData extends Entity {
  category?: Ref;
  points?: number | string;
  text?: string;
  date?: DateString;
  addDate?: DateTimeString;
  addedBy?: Ref;
  semester?: Semester;
  comments?: Ref[];
}

/** `GET /BehaviourGrades/Points/Categories` (empty for the tested account) */
interface BehaviourPointCategoryData extends Entity {
  name: string;
  defaultPoints?: number;
  isPositive?: boolean;
}

export type {
  BaseGrade, GradeData, PointGradeData, TextGradeData, DescriptiveGradeData, AnyGrade,
  GradeCategoryData, PointGradeCategoryData, TextGradeCategoryData, GradeCommentData,
  GradeAverageData, GradeTypeData, GradeScaleData, PointGradeDictionaryData, DescriptiveSkillData,
  BehaviourGradeData, BehaviourGradeTypeData, BehaviourPointGradeData, BehaviourPointCategoryData,
};
