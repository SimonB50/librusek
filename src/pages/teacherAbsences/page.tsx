import {useState} from "react";
import {RiArrowRightLine, RiUserUnfollowLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {Substitutions, TeacherFreeDays} from "../../client/resources/index.js";
import type {SubstitutionData, TeacherFreeDayData} from "../../client/types/index.js";
import {DetailList, DetailRow, Modal} from "../../components/modal.js";
import {SubjectName, TeacherName} from "../../components/names.js";
import {EmptyState, PageHeader, SkeletonList, Tile} from "../../components/page.js";
import {QueryState} from "../../components/queryState.js";
import {T, TranslateToggle, TranslationScope} from "../../components/translate.js";
import DateUtils from "../../lib/date.js";
import Display from "../../lib/display.js";
import {useOpenFromLink, useSearchParam} from "../../lib/deepLink.js";
import {rangeState, sortRanges} from "../../lib/tasks.js";

type Tab = "absences" | "substitutions";

const dateRange = (from: string, to: string) =>
  from === to ? DateUtils.formatDate(from) : `${DateUtils.formatDate(from)} – ${DateUtils.formatDate(to)}`;

const hours = (absence: TeacherFreeDayData) =>
  absence.timeFrom && absence.timeTo ? `${DateUtils.time(absence.timeFrom)} – ${DateUtils.time(absence.timeTo)}` : null;

const StateBadge = ({from, to}: { from: string; to: string }) => {
  const {t} = useTranslation("teacherAbsences");
  const state = rangeState(from, to);
  if (state === "active") return <span className="badge badge-sm badge-primary">{t("active")}</span>;
  if (state === "past") return null;
  return <span className="badge badge-sm badge-soft">{Display.upperFirst(DateUtils.relative(from))}</span>;
};

const Absences = () => {
  const {t} = useTranslation("teacherAbsences");
  const [focused, setFocused] = useState<TeacherFreeDayData | null>(null);
  const absences = TeacherFreeDays.useQuery(undefined, {
    select: list => sortRanges(list, item => ({from: item.dateFrom, to: item.dateTo})),
  });
  useOpenFromLink(absences.data, absence => absence.id, setFocused);

  return (
    <>
      <QueryState query={absences} loading={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"><SkeletonList count={6}/></div>}>
        {list => list.length === 0
          ? <EmptyState icon={<RiUserUnfollowLine/>}>{t("empty")}</EmptyState>
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {list.map(absence => {
                const state = rangeState(absence.dateFrom, absence.dateTo);
                return (
                  <Tile key={absence.id} highlight={state === "active"} onClick={() => setFocused(absence)}
                        className={state === "past" ? "opacity-60" : ""}>
                    <div className="flex flex-row justify-between items-start gap-2 w-full">
                      <span className="text-lg font-bold"><TeacherName id={absence.teacher.id}/></span>
                      <StateBadge from={absence.dateFrom} to={absence.dateTo}/>
                    </div>
                    {absence.name && <span className="text-base-content/80"><T text={Display.upperFirst(absence.name)}/></span>}
                    <span className="text-sm text-base-content/60">
                      {dateRange(absence.dateFrom, absence.dateTo)}{hours(absence) && ` · ${hours(absence)}`}
                    </span>
                  </Tile>
                );
              })}
            </div>
          )}
      </QueryState>
      <TranslationScope id={focused?.id}>
      <Modal open={focused !== null} onClose={() => setFocused(null)} title={t("details.title")}>
        {focused && (
          <>
          {focused.name && <TranslateToggle/>}
          <DetailList>
            <DetailRow label={t("details.teacher")}><TeacherName id={focused.teacher.id}/></DetailRow>
            {focused.name && <DetailRow label={t("details.reason")}><T text={Display.upperFirst(focused.name)}/></DetailRow>}
            <DetailRow label={t("details.from")}>{DateUtils.formatDate(focused.dateFrom)}</DetailRow>
            <DetailRow label={t("details.to")}>{DateUtils.formatDate(focused.dateTo)}</DetailRow>
            <DetailRow label={t("details.hours")}>{hours(focused) ?? t("all_day")}</DetailRow>
            <DetailRow label={t("details.added")}>{DateUtils.formatDateTime(focused.addDate)}</DetailRow>
          </DetailList>
          </>
        )}
      </Modal>
      </TranslationScope>
    </>
  );
};

const SubstitutionRow = ({item}: { item: SubstitutionData }) => {
  const {t} = useTranslation("teacherAbsences");
  const status = item.isCancelled ? "cancelled" : item.isShifted ? "shifted" : "replaced";
  const tone = item.isCancelled ? "badge-error" : item.isShifted ? "badge-warning" : "badge-info";
  return (
    <li className="list-row items-center">
      <div className="flex flex-col items-center w-14">
        <span className="text-xs uppercase text-base-content/60">{DateUtils.weekday(item.orgDate, "short")}</span>
        <span className="text-lg font-bold">{DateUtils.parse(item.orgDate).getDate()}.{DateUtils.parse(item.orgDate).getMonth() + 1}</span>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-semibold">
          <SubjectName id={item.orgSubject.id}/> · {t("substitution.lesson", {number: item.orgLessonNo})}
        </span>
        <span className="text-sm text-base-content/70">
          {item.isCancelled
            ? <TeacherName id={item.orgTeacher.id}/>
            : (
              <span className="inline-flex flex-wrap items-center gap-1">
                <TeacherName id={item.orgTeacher.id}/>
                <RiArrowRightLine className="inline"/>
                <TeacherName id={item.teacher.id}/>
                {item.subject.id !== item.orgSubject.id && <>(<SubjectName id={item.subject.id}/>)</>}
                {item.isShifted && <>· {DateUtils.formatDate(item.date)}, {t("substitution.lesson", {number: item.lessonNo})}</>}
              </span>
            )}
        </span>
      </div>
      <span className={`badge badge-sm badge-soft ${tone}`}>{t(`substitution.${status}`)}</span>
    </li>
  );
};

const SubstitutionList = () => {
  const {t} = useTranslation("teacherAbsences");
  const substitutions = Substitutions.useQuery(undefined, {
    select: list => [...list]
      .filter(item => DateUtils.daysFromToday(item.orgDate) >= -7)
      .sort((a, b) => a.orgDate.localeCompare(b.orgDate) || Number(a.orgLessonNo) - Number(b.orgLessonNo)),
  });
  return (
    <QueryState query={substitutions} loading={<SkeletonList count={3}/>}>
      {list => list.length === 0
        ? <EmptyState>{t("substitutions_empty")}</EmptyState>
        : <ul className="list bg-base-200 border border-base-300 rounded-box">{list.map(item => <SubstitutionRow key={item.id} item={item}/>)}</ul>}
    </QueryState>
  );
};

const Page = () => {
  const {t} = useTranslation("teacherAbsences");
  // `?tab=substitutions` - linked from the calendar
  const [tab, setTab] = useState<Tab>(useSearchParam("tab") === "substitutions" ? "substitutions" : "absences");
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <div role="tablist" className="tabs tabs-box">
            {(["absences", "substitutions"] as const).map(option => (
              <button key={option} type="button" role="tab" className={`tab ${tab === option ? "tab-active" : ""}`} onClick={() => setTab(option)}>
                {t(`tabs.${option}`)}
              </button>
            ))}
          </div>
        }
      />
      {tab === "absences" ? <Absences/> : <SubstitutionList/>}
    </div>
  );
};

export default Page;
