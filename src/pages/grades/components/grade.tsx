import type {AnyGrade} from "../../../client/types/index.js";
import {useTranslatedString} from "../../../lib/translation/scope.js";
import Display from "../../../lib/display.js";
import GradeMath, {isSimulated} from "../../../lib/grades.js";
import {useGradeCategory, usePointMax} from "./hooks.js";

/**
 * Square grade button (old app look) - opens the details modal.
 * All `<Grade>`s on the page are batched into one `/Grades/Categories/0,...` request.
 */
const Grade = ({grade, onOpen}: { grade: AnyGrade; onOpen: (grade: AnyGrade) => void }) => {
  const {data: category} = useGradeCategory(grade);
  const max = usePointMax(grade);
  const simulated = isSimulated(grade);
  const categoryName = useTranslatedString(category?.name ? Display.capitalize(category.name) : null);
  const title = [categoryName, max && `${grade.kind === "point" ? grade.gradeValue : ""} / ${max}`, grade.date].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      title={title}
      onClick={() => onOpen(grade)}
      className={`relative min-w-10 h-10 px-2 font-semibold rounded-field text-center cursor-pointer transition-transform hover:scale-105 ${GradeMath.tone(grade, max)} ${simulated ? "outline-2 outline-dashed outline-offset-2 outline-base-content/40" : ""} ${grade.kind === "grade" && !grade.isConstituent ? "opacity-80" : ""}`}
    >
      {GradeMath.label(grade)}
    </button>
  );
};

export default Grade;
