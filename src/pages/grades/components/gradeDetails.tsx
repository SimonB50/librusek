import {RiDeleteBinLine, RiPencilLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {gradeDictionaries} from "../../../client/resources/index.js";
import type {AnyGrade} from "../../../client/types/index.js";
import {DetailList, DetailRow, Modal} from "../../../components/modal.js";
import {SubjectName, TeacherName} from "../../../components/names.js";
import {T, TranslateToggle, TranslationScope} from "../../../components/translate.js";
import DateUtils from "../../../lib/date.js";
import Display from "../../../lib/display.js";
import GradeMath, {hasSimulatedCategory, isSimulated} from "../../../lib/grades.js";
import {useGradeCategory, usePointMax} from "./hooks.js";

const Comments = ({grade}: { grade: AnyGrade }) => {
  const {t} = useTranslation("grades");
  const comments = gradeDictionaries[grade.kind].comments.useMany(grade.comments?.map(comment => comment.id) ?? []);
  if (!grade.comments?.length) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-base-content/70">{t("details.comment")}</span>
      {comments.isPending
        ? <div className="skeleton h-12"></div>
        : comments.data.map(comment => (
          <p key={comment.id} className="p-3 bg-base-200 rounded-box whitespace-pre-wrap"><T text={comment.text}/></p>
        ))}
    </div>
  );
};

const Details = ({grade}: { grade: AnyGrade }) => {
  const {t} = useTranslation(["grades", "common"]);
  const {data: category, isPending} = useGradeCategory(grade);
  const simulated = isSimulated(grade);
  const special = GradeMath.special(grade);
  const weight = hasSimulatedCategory(grade) ? -grade.category.id : category?.weight;
  const max = usePointMax(grade);
  const percent = GradeMath.pointPercent(grade, max);

  return (
    <>
      <TranslateToggle/>
      <div className="flex flex-row items-center gap-4">
        {GradeMath.isText(grade)
          ? <span className={`flex items-center justify-center size-16 shrink-0 rounded-box text-xl font-bold ${GradeMath.tone(grade, max)}`}>Aa</span>
          : (
            <span className={`flex items-center justify-center min-w-16 h-16 px-3 rounded-box text-3xl font-bold ${GradeMath.tone(grade, max)}`}>
              {GradeMath.label(grade)}
            </span>
          )}
        <div className="flex flex-col min-w-0">
          <span className="text-lg font-semibold"><SubjectName id={grade.subject.id}/></span>
          <span className="text-base-content/70">
            {hasSimulatedCategory(grade)
              ? t("simulator.simulated")
              : isPending ? "..." : category?.name ? <T text={Display.capitalize(category.name)} name/> : "-"}
          </span>
          <div className="flex flex-row flex-wrap gap-1 mt-1">
            {special && <span className="badge badge-sm badge-accent">{t(`special.${special}`)}</span>}
            <span className="badge badge-sm badge-soft">{t("common:common.school.semester", {semester: "I".repeat(grade.semester)})}</span>
          </div>
        </div>
      </div>
      {GradeMath.isText(grade) && <p className="p-3 bg-base-200 rounded-box whitespace-pre-wrap"><T text={grade.grade}/></p>}
      {GradeMath.marker(grade) && <span className="text-sm text-base-content/70">{t(`marker_hint.${GradeMath.marker(grade)}`)}</span>}
      <DetailList>
        {weight !== undefined && grade.kind !== "point" && <DetailRow label={t("details.weight")}>{weight}</DetailRow>}
        {grade.kind === "point" && max !== undefined && (
          <DetailRow label={t("details.points")}>{grade.gradeValue} / {max}{percent !== null && ` (${percent.toFixed(0)}%)`}</DetailRow>
        )}
        {category && (
          <DetailRow label={t("details.counts")}>{category.countToTheAverage ? t("details.yes") : t("details.no")}</DetailRow>
        )}
        <DetailRow label={t("details.date")}>{DateUtils.formatDate(grade.date)}</DetailRow>
        {!simulated && <DetailRow label={t("details.added")}>{DateUtils.formatDateTime(grade.addDate)}</DetailRow>}
        {!simulated && <DetailRow label={t("details.teacher")}><TeacherName id={grade.addedBy.id}/></DetailRow>}
      </DetailList>
      {!simulated && <Comments grade={grade}/>}
    </>
  );
};

interface GradeDetailsProps {
  grade: AnyGrade | null;
  onClose: () => void;
  /** Simulation mode - show edit/delete */
  onEdit?: (grade: AnyGrade, max?: number) => void;
  onDelete?: (grade: AnyGrade) => void;
}

/** Grade details modal (old app: `grade_details`) - edit/delete actions only in simulation mode. */
/** Edit needs the point maximum, which only the category knows. */
const EditButton = ({grade, onEdit}: { grade: AnyGrade; onEdit: (grade: AnyGrade, max?: number) => void }) => {
  const {t} = useTranslation("grades");
  const max = usePointMax(grade);
  return (
    <button type="button" className="btn" onClick={() => onEdit(grade, max)}>
      <RiPencilLine/> {t("details.edit_actions.edit")}
    </button>
  );
};

const GradeDetails = ({grade, onClose, onEdit, onDelete}: GradeDetailsProps) => {
  const {t} = useTranslation("grades");
  const editable = grade && grade.kind !== "text" && !GradeMath.special(grade) && onEdit && onDelete;

  return (
    <TranslationScope id={grade ? `${grade.kind}-${grade.id}` : null}>
    <Modal
      open={grade !== null}
      onClose={onClose}
      title={t("details.title")}
      actions={editable && grade && (
        <>
          <button type="button" className="btn btn-error btn-soft" onClick={() => onDelete(grade)}>
            <RiDeleteBinLine/> {t("details.edit_actions.delete")}
          </button>
          <EditButton grade={grade} onEdit={onEdit}/>
        </>
      )}
    >
      {grade && <Details grade={grade}/>}
    </Modal>
    </TranslationScope>
  );
};

export default GradeDetails;
