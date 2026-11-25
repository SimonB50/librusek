import type {AnyGrade, GradeCategoryData, GradeData, PointGradeCategoryData, Semester} from "../client/types/index.js";
import DateUtils from "./date.js";

type WeightedCategory = Pick<GradeCategoryData, "weight" | "countToTheAverage"> &
  Partial<Pick<GradeCategoryData, "isSemestral" | "isSemestralProposition">>;

/** Summary grade kinds - shown separately, never part of the average. */
type SpecialKind = "semesterProposition" | "semester" | "finalProposition" | "final";

/** Grade values offered by the simulator. */
const SIMULATOR_VALUES = ["+", "-", "1", "1+", "2-", "2", "2+", "3-", "3", "3+", "4-", "4", "4+", "5-", "5", "5+", "6-", "6"] as const;

abstract class GradeMath {
  /** `"5+"` -> 5.5, `"4-"` -> 3.75, `"np"` -> null (same rules as the old app). */
  static value = (grade: string): number | null => {
    const trimmed = grade.trim();
    let value: number;
    if (trimmed.endsWith("+")) value = Number(trimmed.slice(0, -1)) + 0.5;
    else if (trimmed.endsWith("-")) value = Number(trimmed.slice(0, -1)) - 0.25;
    else value = Number(trimmed);
    return Number.isFinite(value) && value >= 1 ? value : null;
  }

  /**
   * Marks that are not grades on the 1-6 scale. Point based schools record pluses and minuses
   * (activity, missing homework...) as regular grades - they are shown, but never averaged.
   */
  static marker = (grade: AnyGrade): "plus" | "minus" | "absent" | null => {
    if (grade.kind !== "grade") return null;
    const value = grade.grade.trim().toLowerCase();
    if (value === "+") return "plus";
    if (value === "-" || value === "−") return "minus";
    if (value === "np" || value === "nb" || value === "bz" || value === "0") return "absent";
    return null;
  }

  /** Descriptive value (text grade, or a regular grade holding words) - shown as a chip, not a square. */
  static isText = (grade: AnyGrade) =>
    grade.kind === "text" || (grade.kind === "grade" && grade.grade.trim().length > 3 && this.value(grade.grade) === null);

  /** Pluses and minuses of a subject (point based schools). */
  static markers = (grades: readonly AnyGrade[]) => {
    let plus = 0;
    let minus = 0;
    for (const grade of grades) {
      const marker = this.special(grade) ? null : this.marker(grade);
      if (marker === "plus") plus++;
      else if (marker === "minus") minus++;
    }
    return {plus, minus};
  }

  static special = (grade: AnyGrade): SpecialKind | null => {
    if (grade.kind === "point") return null;
    if (grade.isFinal) return "final";
    if (grade.isFinalProposition) return "finalProposition";
    if (grade.isSemester) return "semester";
    if (grade.isSemesterProposition) return "semesterProposition";
    return null;
  }

  /**
   * Weighted average of regular grades.
   * @param getCategory category lookup - e.g. `GradeCategories.useMany(...).get` (+ simulator categories)
   * @returns `null` when there is nothing to average (or categories are not loaded yet)
   */
  static average = (
    grades: readonly AnyGrade[],
    getCategory: (id: number) => WeightedCategory | undefined,
  ): number | null => {
    let top = 0;
    let bottom = 0;
    for (const grade of grades) {
      if (grade.kind !== "grade" || this.special(grade)) continue;
      const value = this.value(grade.grade);
      if (value === null) continue;
      const category = getCategory(grade.category.id);
      if (!category || category.countToTheAverage === false) continue;
      if (category.isSemestral || category.isSemestralProposition) continue;
      const weight = category.weight && !Number.isNaN(category.weight) ? category.weight : 1;
      top += weight * value;
      bottom += weight;
    }
    return bottom ? top / bottom : null;
  }

  /** Point grades as `earned / max` (max = category `valueTo`), `null` when nothing counts. */
  static points = (
    grades: readonly AnyGrade[],
    getCategory: (id: number) => Pick<PointGradeCategoryData, "valueTo" | "countToTheAverage"> | undefined,
  ) => {
    let earned = 0;
    let max = 0;
    for (const grade of grades) {
      if (grade.kind !== "point") continue;
      const category = getCategory(grade.category.id);
      if (!category || category.countToTheAverage === false || !category.valueTo) continue;
      earned += Number.parseFloat(grade.gradeValue ?? grade.grade) || 0;
      max += category.valueTo;
    }
    return max ? {earned, max, percent: (earned / max) * 100} : null;
  }

  /** Current semester - `2` once any grade from the second semester exists. */
  static semester = (grades: readonly AnyGrade[]): Semester =>
    grades.some(grade => grade.semester === 2) ? 2 : 1;

  /** Added in the last `days` days - "latest grades" filter. */
  static isLatest = (grade: AnyGrade, days = 7) => DateUtils.isRecent(grade.addDate, days);

  /** Point grade as % of the category maximum. */
  static pointPercent = (grade: AnyGrade, max: number | undefined) => {
    if (grade.kind !== "point" || !max) return null;
    return ((Number.parseFloat(grade.gradeValue ?? grade.grade) || 0) / max) * 100;
  }

  /** Badge colors by value (red for fails, green for top grades); point grades by % of `max`. */
  static tone = (grade: AnyGrade, max?: number) => {
    if (grade.kind === "point") {
      const percent = this.pointPercent(grade, max);
      if (percent === null) return "bg-secondary text-secondary-content";
      if (percent < 40) return "bg-error text-error-content";
      if (percent < 55) return "bg-warning text-warning-content";
      if (percent >= 90) return "bg-success text-success-content";
      return "bg-primary text-primary-content";
    }
    if (grade.kind === "text") return "bg-neutral text-neutral-content";
    const marker = this.marker(grade);
    if (marker === "plus") return "bg-success/20 text-success border border-success/40";
    if (marker === "minus") return "bg-error/20 text-error border border-error/40";
    if (marker === "absent") return "bg-warning/20 text-warning border border-warning/40";
    const value = this.value(grade.grade);
    if (value === null) return "bg-neutral text-neutral-content";
    if (value < 2) return "bg-error text-error-content";
    if (value < 3) return "bg-warning text-warning-content";
    if (value >= 5) return "bg-success text-success-content";
    return "bg-primary text-primary-content";
  }

  /** Label shown on the grade button - points are rounded like in the old app. */
  static label = (grade: AnyGrade) => {
    if (grade.kind === "point") return `${Math.round(Number.parseFloat(grade.grade))}`;
    const value = grade.grade.trim();
    if (value === "-") return "−";
    return value;
  }
}

/* Simulator ------------------------------------------------------------------------------------*/

/** Simulated grades use negative ids; their category id is `-weight` ("Temporary (1..6)" in the old app). */
const isSimulated = (grade: AnyGrade) => grade.id < 0;

/** Simulated or edited in the simulator - the category is a temporary one (`-weight`). */
const hasSimulatedCategory = (grade: AnyGrade) => grade.category.id < 0;

const simulatedCategory = (id: number): WeightedCategory | undefined =>
  id < 0 ? {weight: -id, countToTheAverage: true} : undefined;

/** Simulated point grades keep the maximum in the category id (`-max`). */
const simulatedPointCategory = (id: number) =>
  id < 0 ? {valueTo: -id, countToTheAverage: true} : undefined;

interface SimulatedGradeValue {
  kind: "grade" | "point";
  value: string;
  /** regular grades */
  weight: number;
  /** point grades */
  max: number;
}

const createSimulatedGrade = (
  id: number,
  base: { subjectId: number; semester: Semester },
  {kind, value, weight, max}: SimulatedGradeValue,
): AnyGrade => {
  const now = new Date();
  const ref = (refId: number) => ({id: refId, url: ""});
  const grade: GradeData = {
    id,
    lesson: ref(0),
    subject: ref(base.subjectId),
    student: ref(0),
    category: ref(kind === "point" ? -max : -weight),
    addedBy: ref(0),
    grade: value,
    date: DateUtils.toDateString(now),
    addDate: `${DateUtils.toDateString(now)} ${now.toTimeString().slice(0, 8)}`,
    semester: base.semester,
    isConstituent: true,
    isSemester: false,
    isSemesterProposition: false,
    isFinal: false,
    isFinalProposition: false,
  };
  if (kind === "point") {
    const {isConstituent: _c, isSemester: _s, isSemesterProposition: _sp, isFinal: _f, isFinalProposition: _fp, ...rest} = grade;
    return {...rest, gradeValue: value, kind: "point"};
  }
  return {...grade, kind: "grade"};
};

export default GradeMath;
export {SIMULATOR_VALUES, isSimulated, hasSimulatedCategory, simulatedCategory, simulatedPointCategory, createSimulatedGrade};
export type {SpecialKind, WeightedCategory, SimulatedGradeValue};
