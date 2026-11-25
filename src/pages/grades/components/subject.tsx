import {RiAddLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {GradeCategories, PointGradeCategories, Subjects} from "../../../client/resources/index.js";
import type {AnyGrade, GradeAverageData, Id} from "../../../client/types/index.js";
import {T} from "../../../components/translate.js";
import Display from "../../../lib/display.js";
import GradeMath, {hasSimulatedCategory, isSimulated, simulatedCategory, simulatedPointCategory} from "../../../lib/grades.js";
import Grade from "./grade.js";
import type {SemesterView} from "./hooks.js";


interface SubjectProps {
  id: Id;
  /** Grades of this subject in the selected view (already filtered by semester / "latest"). */
  grades: AnyGrade[];
  view: SemesterView;
  librusAverage?: GradeAverageData;
  onOpen: (grade: AnyGrade) => void;
  /** Simulation mode only */
  onAdd?: (subjectId: Id) => void;
}

const librusValue = (average: GradeAverageData | undefined, view: SemesterView) => {
  if (!average) return 0;
  if (view === "year") return average.fullYear;
  return view === 1 ? average.semester1 : average.semester2;
};

/**
 * Subject card - pulls the subject and categories from the shared cache.
 * `Subjects.useOne(id)` is a cache hit here, because the page already loaded every subject with `useMany`.
 */
const Subject = ({id, grades, view, librusAverage, onOpen, onAdd}: SubjectProps) => {
  const {t} = useTranslation("grades");
  const {data: subject, isPending} = Subjects.useOne(id);
  const categories = GradeCategories.useMany(
    grades.filter(grade => grade.kind === "grade" && !hasSimulatedCategory(grade)).map(grade => grade.category.id),
  );
  const pointCategories = PointGradeCategories.useMany(
    grades.filter(grade => grade.kind === "point" && !hasSimulatedCategory(grade)).map(grade => grade.category.id),
  );

  const regular = grades.filter(grade => !GradeMath.special(grade) && !GradeMath.isText(grade));
  const texts = grades.filter(grade => !GradeMath.special(grade) && GradeMath.isText(grade));
  const markers = GradeMath.markers(regular);
  const special = grades.filter(grade => GradeMath.special(grade));
  const average = categories.isPending
    ? null
    : GradeMath.average(regular, categoryId => simulatedCategory(categoryId) ?? categories.get(categoryId));
  const points = pointCategories.isPending ? null : GradeMath.points(regular, categoryId => simulatedPointCategory(categoryId) ?? pointCategories.get(categoryId));
  const librus = librusValue(librusAverage, view);
  const simulated = grades.some(grade => isSimulated(grade) || hasSimulatedCategory(grade));

  return (
    <div className="flex flex-col gap-3 p-4 bg-base-200 border border-base-300 rounded-box">
      <div className="flex flex-row justify-between items-start gap-2">
        {isPending
          ? <div className="skeleton h-7 w-40"></div>
          : <span className="text-xl font-bold">{subject ? <T text={Display.capitalize(subject.name)} name/> : "-"}</span>}
        <div className="flex flex-row flex-wrap justify-end gap-1">
          {(markers.plus > 0 || markers.minus > 0) && (
            <span className="badge badge-soft gap-1" title={t("markers")}>
              {markers.plus > 0 && <span className="text-success font-semibold">+{markers.plus}</span>}
              {markers.minus > 0 && <span className="text-error font-semibold">−{markers.minus}</span>}
            </span>
          )}
          {points && (
            <span className="badge badge-soft badge-secondary" title={`${points.earned} / ${points.max}`}>
              {t("points")}: {points.percent.toFixed(0)}%
            </span>
          )}
          {average !== null && (
            <span className={`badge ${simulated ? "badge-accent" : "badge-outline"}`} title={t("average")}>
              {t("average")}: {average.toFixed(2)}
            </span>
          )}
          {librus > 0 && !simulated && (
            <span className="badge badge-ghost hidden sm:inline-flex" title={t("average_librus")}>Librus: {librus.toFixed(2)}</span>
          )}
        </div>
      </div>
      <div className="flex flex-row flex-wrap gap-2">
        {regular.map(grade => <Grade key={`${grade.kind}-${grade.id}`} grade={grade} onOpen={onOpen}/>)}
        {onAdd && (
          <button type="button" aria-label={t("simulator.add")} title={t("simulator.add")} onClick={() => onAdd(id)}
                  className="min-w-10 h-10 flex items-center justify-center rounded-field border-2 border-dashed border-base-content/30 hover:border-primary hover:text-primary cursor-pointer">
            <RiAddLine/>
          </button>
        )}
      </div>
      {texts.length > 0 && (
        <div className="flex flex-col gap-1">
          {texts.map(grade => (
            <button key={`${grade.kind}-${grade.id}`} type="button" onClick={() => onOpen(grade)}
                    className="flex flex-row items-start gap-2 p-2 bg-base-100 rounded-field text-left text-sm cursor-pointer hover:bg-base-300">
              <span className="badge badge-sm badge-neutral shrink-0">{t("text_grades.badge")}</span>
              <span className="line-clamp-2">{grade.grade}</span>
            </button>
          ))}
        </div>
      )}
      {special.length > 0 && (
        <div className="flex flex-row flex-wrap gap-2 pt-2 border-t border-base-300">
          {special.map(grade => {
            const kind = GradeMath.special(grade);
            return (
              <button key={`${grade.kind}-${grade.id}`} type="button" onClick={() => onOpen(grade)}
                      className="badge badge-lg badge-accent badge-soft cursor-pointer gap-1">
                {kind && t(`special.${kind}`)}: <span className="font-bold">{grade.grade}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Subject;
