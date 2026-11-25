import {gradeDictionaries} from "../../../client/resources/index.js";
import type {AnyGrade} from "../../../client/types/index.js";
import {hasSimulatedCategory, type SimulatedGradeValue} from "../../../lib/grades.js";

/** `1` / `2` or `"year"` (both semesters). */
type SemesterView = 1 | 2 | "year";

type GradeEditorValue = SimulatedGradeValue;

/** Category of any grade kind - simulated grades have no real category (`null` id skips the request). */
const useGradeCategory = (grade: AnyGrade) =>
  gradeDictionaries[grade.kind].categories.useOne(hasSimulatedCategory(grade) ? null : grade.category.id);

/** Max points of a point grade - real category or simulated (`-max`). */
const usePointMax = (grade: AnyGrade) => {
  const {data: category} = useGradeCategory(grade);
  if (grade.kind !== "point") return undefined;
  if (hasSimulatedCategory(grade)) return -grade.category.id;
  return category && "valueTo" in category ? category.valueTo : undefined;
};

export {useGradeCategory, usePointMax};
export type {SemesterView, GradeEditorValue};
