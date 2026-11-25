import {useState} from "react";
import {RiChatQuoteLine, RiMailLine, RiUserLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {
  BehaviourGrades, BehaviourGradeTypes, BehaviourPointGrades, Class, Me, NoteCategories, Notes,
} from "../../client/resources/index.js";
import {isFlagSet, type NoteData, type NotePositivity} from "../../client/types/index.js";
import {DetailList, DetailRow, Modal} from "../../components/modal.js";
import {TeacherName} from "../../components/names.js";
import {EmptyState, PageHeader, SectionTitle, SkeletonList, Tile} from "../../components/page.js";
import {QueryState} from "../../components/queryState.js";
import {T, TranslateToggle, TranslationScope} from "../../components/translate.js";
import DateUtils from "../../lib/date.js";
import Display from "../../lib/display.js";

const positivity: Record<NotePositivity, { key: "negative" | "neutral" | "positive"; tone: string; border: string }> = {
  0: {key: "negative", tone: "badge-error", border: "border-error"},
  1: {key: "positive", tone: "badge-success", border: "border-success"},
  2: {key: "neutral", tone: "badge-neutral", border: "border-base-300"},
};

const AccountCard = () => {
  const {t} = useTranslation("profile");
  const {data: classData} = Class.useQuery();
  return (
    <QueryState query={Me.useQuery()}>
      {me => (
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center p-4 bg-base-200 border border-base-300 rounded-box">
          <div className="avatar avatar-placeholder">
            <div className="bg-primary text-primary-content w-20 rounded-box">
              <span className="text-3xl font-semibold">{me.account.firstName[0]}{me.account.lastName[0]}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-2xl font-semibold">{Display.fullName(me.account)}</span>
            <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/70">
              {me.account.email && <span className="flex items-center gap-1"><RiMailLine/>{me.account.email}</span>}
              <span className="flex items-center gap-1"><RiUserLine/>{me.account.login}</span>
              {classData && <span>{t("account.class")}: {classData.number}{classData.symbol}</span>}
              {me.account.isPremium && <span className="badge badge-sm badge-accent">{t("account.premium")}</span>}
            </div>
          </div>
        </div>
      )}
    </QueryState>
  );
};

const BehaviourTypeName = ({id}: { id: string | number }) => {
  const {data} = BehaviourGradeTypes.useOne(id);
  return data ? <T text={Display.upperFirst(data.name)} name/> : <>...</>;
};

const Behaviour = () => {
  const {t} = useTranslation(["profile", "common"]);
  const grades = BehaviourGrades.useQuery(undefined, {
    select: list => [...list].sort((a, b) => a.semester - b.semester || a.addDate.localeCompare(b.addDate)),
  });
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>{t("behaviour.title")}</SectionTitle>
      <QueryState query={grades} loading={<SkeletonList count={1}/>}>
        {list => list.length === 0
          ? <EmptyState>{t("behaviour.empty")}</EmptyState>
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {list.map(grade => (
                <div key={grade.id} className="flex flex-col gap-1 p-4 bg-base-200 border border-base-300 rounded-box">
                  <span className="text-xl font-semibold"><BehaviourTypeName id={grade.gradeType.id}/></span>
                  <div className="flex flex-row flex-wrap gap-1">
                    <span className="badge badge-sm badge-soft">{t("common:common.school.semester", {semester: "I".repeat(grade.semester)})}</span>
                    <span className={`badge badge-sm ${isFlagSet(grade.isProposal) ? "badge-warning badge-soft" : "badge-success badge-soft"}`}>
                      {isFlagSet(grade.isProposal) ? t("behaviour.proposal") : t("behaviour.final")}
                    </span>
                  </div>
                </div>
              ))}
              {list.every(grade => isFlagSet(grade.isProposal)) && (
                <div className="flex items-center justify-center p-4 border border-dashed border-base-300 rounded-box text-primary text-center">
                  {t("behaviour.awaiting_final")}
                </div>
              )}
            </div>
          )}
      </QueryState>
    </div>
  );
};

/** Point based behaviour - only some schools; hidden when empty or unavailable. */
const BehaviourPoints = () => {
  const {t} = useTranslation("profile");
  const {data} = BehaviourPointGrades.useQuery();
  if (!data?.length) return null;
  const total = data.reduce((sum, item) => sum + (Number(item.points) || 0), 0);
  return (
    <div className="stats bg-base-200 border border-base-300">
      <div className="stat">
        <div className="stat-title">{t("behaviour.points")}</div>
        <div className="stat-value">{t("behaviour.points_total", {points: total})}</div>
      </div>
    </div>
  );
};

const NoteCategoryName = ({id}: { id?: number }) => {
  const {data} = NoteCategories.useOne(id);
  return data ? <T text={data.categoryName} name/> : null;
};

const NotesSection = () => {
  const {t} = useTranslation("profile");
  const [focused, setFocused] = useState<NoteData | null>(null);
  const notes = Notes.useQuery(undefined, {select: list => [...list].sort((a, b) => b.date.localeCompare(a.date))});
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>{t("notes.title")}</SectionTitle>
      <QueryState query={notes} loading={<SkeletonList count={2}/>}>
        {list => list.length === 0
          ? <EmptyState icon={<RiChatQuoteLine/>}>{t("notes.empty")}</EmptyState>
          : (
            <div className="flex flex-col gap-2">
              {list.map(note => {
                const kind = positivity[note.positive] ?? positivity[2];
                return (
                  <Tile key={note.id} onClick={() => setFocused(note)} className={kind.border}>
                    <div className="flex flex-row justify-between items-center gap-2 w-full">
                      <span className={`badge badge-sm ${kind.tone}`}>{t(`notes.${kind.key}`)}</span>
                      <span className="text-xs text-base-content/60">{DateUtils.formatDate(note.date)}</span>
                    </div>
                    <span className="line-clamp-2"><T text={note.text}/></span>
                    <span className="text-sm text-base-content/60"><TeacherName id={note.teacher.id}/></span>
                  </Tile>
                );
              })}
            </div>
          )}
      </QueryState>
      <TranslationScope id={focused?.id}>
      <Modal open={focused !== null} onClose={() => setFocused(null)} title={t("notes.details.title")}>
        {focused && (
          <>
            <TranslateToggle/>
            <p className="p-3 bg-base-200 rounded-box whitespace-pre-wrap"><T text={focused.text}/></p>
            <DetailList>
              <DetailRow label={t("notes.details.type")}>{t(`notes.${(positivity[focused.positive] ?? positivity[2]).key}`)}</DetailRow>
              {focused.category && <DetailRow label={t("notes.details.category")}><NoteCategoryName id={focused.category.id}/></DetailRow>}
              <DetailRow label={t("notes.details.teacher")}><TeacherName id={focused.teacher.id}/></DetailRow>
              <DetailRow label={t("notes.details.date")}>{DateUtils.formatDate(focused.date)}</DetailRow>
            </DetailList>
          </>
        )}
      </Modal>
      </TranslationScope>
    </div>
  );
};

const Page = () => {
  const {t} = useTranslation("profile");
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")}/>
      <AccountCard/>
      <Behaviour/>
      <BehaviourPoints/>
      <NotesSection/>
    </div>
  );
};

export default Page;
