import {useState} from "react";
import {RiCheckboxMultipleLine, RiEmotionHappyLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {AttendanceTypes, Attendances, Lessons, Subjects} from "../../client/resources/index.js";
import type {AttendanceData, AttendanceTypeData, Id} from "../../client/types/index.js";
import {DetailList, DetailRow, Modal} from "../../components/modal.js";
import {LessonSubjectName, SubjectName, TeacherName} from "../../components/names.js";
import {EmptyState, PageHeader, SectionTitle, SkeletonList} from "../../components/page.js";
import {QueryState} from "../../components/queryState.js";
import {T} from "../../components/translate.js";
import {useTranslatedString} from "../../lib/translation/scope.js";
import AttendanceMath, {type AttendanceStats} from "../../lib/attendance.js";
import DateUtils from "../../lib/date.js";
import Display from "../../lib/display.js";

type SemesterView = 1 | 2 | "year";

const LATE_TYPE_ID = 2;
const DAYS_PREVIEW = 10;

const TypeBadge = ({type, onClick, label}: { type?: AttendanceTypeData; onClick?: () => void; label?: string }) => {
  const style = type?.colorRGB ? {backgroundColor: `#${type.colorRGB}`, borderColor: `#${type.colorRGB}`, color: "#000"} : undefined;
  const content = label ?? type?.short ?? "?";
  if (!onClick) return <span className="badge font-semibold" style={style} title={type?.name}>{content}</span>;
  return (
    <button type="button" className="badge badge-lg font-semibold cursor-pointer hover:scale-105 transition-transform" style={style}
            title={type?.name} onClick={onClick}>
      {content}
    </button>
  );
};

/** Readable text on a Librus type color (`"FF0000"`). */
const contrastOn = (rgb: string) => {
  const [r, g, b] = [0, 2, 4].map(offset => Number.parseInt(rgb.slice(offset, offset + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#000" : "#fff";
};

/** Square entry tile - same shape as grade buttons; the lesson number sits in the corner. */
const EntryTile = ({entry, type, onClick}: { entry: AttendanceData; type?: AttendanceTypeData; onClick: () => void }) => {
  const typeName = useTranslatedString(type ? Display.upperFirst(type.name) : null);
  const style = type?.colorRGB ? {backgroundColor: `#${type.colorRGB}`, color: contrastOn(type.colorRGB)} : undefined;
  return (
    <button type="button" onClick={onClick} style={style} title={type ? `${typeName} · ${entry.lessonNo}` : undefined}
            className={`relative min-w-10 h-10 px-2 font-semibold rounded-field text-center cursor-pointer transition-transform hover:scale-105 ${style ? "" : "bg-neutral text-neutral-content"}`}>
      {type?.short ?? "?"}
      <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center size-4.5 rounded-full bg-base-100 text-base-content text-[10px] font-bold border border-base-300">
        {entry.lessonNo}
      </span>
    </button>
  );
};

const Percent = ({stats}: { stats: AttendanceStats }) => (
  <div className="flex flex-row items-center gap-2 w-full">
    <progress className={`${AttendanceMath.tone(stats.percent)} w-full`} value={stats.percent ?? 0} max={100}></progress>
    <span className="text-sm font-semibold w-12 text-right">{stats.percent === null ? "-" : `${stats.percent.toFixed(0)}%`}</span>
  </div>
);

const SubjectStatsModal = ({subjectId, stats, getType, onClose}: {
  subjectId: Id | null;
  stats?: AttendanceStats;
  getType: (id: Id) => AttendanceTypeData | undefined;
  onClose: () => void;
}) => {
  const {t} = useTranslation("attendance");
  return (
    <Modal open={subjectId !== null} onClose={onClose} title={subjectId !== null && <SubjectName id={subjectId}/>}>
      {stats && (
        <>
          <Percent stats={stats}/>
          <DetailList>
            <DetailRow label={t("subject_details.presence")}>{stats.present}</DetailRow>
            <DetailRow label={t("subject_details.absences")}>{stats.absent}</DetailRow>
            <DetailRow label={t("subject_details.total")}>{stats.total}</DetailRow>
          </DetailList>
          <span className="text-sm font-semibold text-base-content/70">{t("subject_details.types")}</span>
          <div className="flex flex-row flex-wrap gap-2">
            {[...stats.byType.entries()].sort(([, a], [, b]) => b - a).map(([typeId, count]) => {
              const type = getType(typeId);
              return (
                <span key={typeId} className="flex flex-row items-center gap-2 p-2 pr-3 bg-base-200 rounded-box">
                  <TypeBadge type={type}/> {type ? <T text={Display.upperFirst(type.name)} name/> : "-"}: <b>{count}</b>
                </span>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
};

const EntryModal = ({entry, type, onClose}: { entry: AttendanceData | null; type?: AttendanceTypeData; onClose: () => void }) => {
  const {t} = useTranslation(["attendance", "common"]);
  return (
    <Modal open={entry !== null} onClose={onClose} title={t("absences.entry.title")}>
      {entry && (
        <>
          <div className="flex flex-row items-center gap-3">
            <TypeBadge type={type}/>
            <span className="text-lg font-semibold">{type ? <T text={Display.upperFirst(type.name)} name/> : "-"}</span>
          </div>
          <DetailList>
            <DetailRow label={t("absences.entry.date")}>{DateUtils.weekday(entry.date)}, {DateUtils.formatDate(entry.date)}</DetailRow>
            <DetailRow label={t("absences.entry.lesson.title")}>
              <LessonSubjectName lessonId={entry.lesson.id}/> ({t("common:common.lesson", {number: entry.lessonNo})})
            </DetailRow>
            <DetailRow label={t("absences.entry.teacher")}><TeacherName id={entry.addedBy.id}/></DetailRow>
            <DetailRow label={t("absences.entry.semester")}>{"I".repeat(entry.semester)}</DetailRow>
            <DetailRow label={t("absences.entry.added")}>{DateUtils.formatDateTime(entry.addDate)}</DetailRow>
          </DetailList>
        </>
      )}
    </Modal>
  );
};

const Page = () => {
  const {t} = useTranslation(["attendance", "common"]);
  // Presences are needed for the percentages - the old app also fetched them
  const attendances = Attendances.useQuery({showPresences: true});
  const [selectedView, setSelectedView] = useState<SemesterView | null>(null);
  const [focusedSubject, setFocusedSubject] = useState<Id | null>(null);
  const [focusedEntry, setFocusedEntry] = useState<AttendanceData | null>(null);
  const [showAllDays, setShowAllDays] = useState(false);

  const all = attendances.data ?? [];
  const view: SemesterView = selectedView ?? (all.some(entry => entry.semester === 2) ? 2 : 1);
  const entries = all.filter(entry => view === "year" || entry.semester === view);

  const types = AttendanceTypes.useMany(all.map(entry => entry.type.id));
  const lessons = Lessons.useMany(entries.map(entry => entry.lesson.id));
  const subjects = Subjects.useMany(lessons.data.map(lesson => lesson.subject.id));

  const {total, bySubject} = AttendanceMath.stats(entries, types.get, entry => lessons.get(entry.lesson.id)?.subject.id);
  const lates = [...total.byType.entries()]
    .filter(([id]) => (types.get(id)?.standardType?.id ?? id) === LATE_TYPE_ID)
    .reduce((sum, [, count]) => sum + count, 0);
  const subjectIds = [...bySubject.keys()].sort((a, b) =>
    Display.capitalize(subjects.get(a)?.name ?? "").localeCompare(Display.capitalize(subjects.get(b)?.name ?? "")));

  const days = AttendanceMath.groupByDate(entries.filter(entry => types.get(entry.type.id) && !AttendanceMath.isPlainPresence(types.get(entry.type.id))));
  const shownDays = showAllDays ? days : days.slice(0, DAYS_PREVIEW);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <div role="tablist" className="tabs tabs-box">
            {([1, 2, "year"] as const).map(option => (
              <button key={option} type="button" role="tab" className={`tab ${view === option ? "tab-active" : ""}`} onClick={() => setSelectedView(option)}>
                {option === "year" ? t("common:common.school.year") : t("common:common.school.semester", {semester: "I".repeat(option)})}
              </button>
            ))}
          </div>
        }
      />
      <QueryState query={attendances} loading={<SkeletonList count={3}/>}>
        {() => entries.length === 0
          ? <EmptyState icon={<RiCheckboxMultipleLine/>}>{t("empty")}</EmptyState>
          : (
            <>
              <div className="stats stats-vertical sm:stats-horizontal bg-base-200 border border-base-300 w-full">
                <div className="stat">
                  <div className="stat-title">{t("summary.percentage")}</div>
                  <div className="stat-value text-primary">{total.percent === null ? "-" : `${total.percent.toFixed(1)}%`}</div>
                  <div className="stat-desc">{total.present} / {total.total}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">{t("summary.absences")}</div>
                  <div className="stat-value">{total.absent}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">{t("summary.lates")}</div>
                  <div className="stat-value">{lates}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">{t("summary.total")}</div>
                  <div className="stat-value">{total.total}</div>
                </div>
              </div>

              <SectionTitle>{t("subjects")}</SectionTitle>
              <span className="text-sm text-base-content/60 -mt-3">{t("hint")}</span>
              {lessons.isPending || types.isPending
                ? <SkeletonList count={3} className="h-12"/>
                : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {subjectIds.map(id => {
                      const stats = bySubject.get(id);
                      if (!stats) return null;
                      return (
                        <button key={id} type="button" onClick={() => setFocusedSubject(id)}
                                className="flex flex-col gap-1 p-3 bg-base-200 border border-base-300 rounded-box text-left cursor-pointer hover:bg-base-300 transition-colors">
                          <div className="flex flex-row justify-between gap-2">
                            <span className="font-semibold truncate"><SubjectName id={id}/></span>
                            <span className="text-sm text-base-content/60 shrink-0">{stats.absent} / {stats.total}</span>
                          </div>
                          <Percent stats={stats}/>
                        </button>
                      );
                    })}
                  </div>
                )}

              <SectionTitle>{t("absences.title")}</SectionTitle>
              {days.length === 0
                ? <EmptyState icon={<RiEmotionHappyLine/>}>{t("absences.empty")}</EmptyState>
                : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {shownDays.map(day => (
                      <div key={day.date} className="flex flex-col gap-3 p-4 bg-base-200 border border-base-300 rounded-box">
                        <div className="flex flex-row items-baseline justify-between gap-2">
                          <span className="font-semibold">{Display.upperFirst(DateUtils.weekday(day.date))}</span>
                          <span className="text-sm text-base-content/60">{DateUtils.formatDate(day.date)}</span>
                        </div>
                        <div className="flex flex-row flex-wrap gap-2 pt-1">
                          {[...day.entries].sort((a, b) => a.lessonNo - b.lessonNo).map(entry => (
                            <EntryTile key={entry.id} entry={entry} type={types.get(entry.type.id)} onClick={() => setFocusedEntry(entry)}/>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              {days.length > DAYS_PREVIEW && !showAllDays && (
                <button type="button" className="btn btn-ghost" onClick={() => setShowAllDays(true)}>
                  {t("absences.show_all")} ({days.length})
                </button>
              )}
            </>
          )}
      </QueryState>
      <SubjectStatsModal subjectId={focusedSubject} stats={focusedSubject !== null ? bySubject.get(focusedSubject) : undefined}
                         getType={types.get} onClose={() => setFocusedSubject(null)}/>
      <EntryModal entry={focusedEntry} type={focusedEntry ? types.get(focusedEntry.type.id) : undefined} onClose={() => setFocusedEntry(null)}/>
    </div>
  );
};

export default Page;
