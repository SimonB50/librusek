import {useState} from "react";
import {RiFileEditLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {Colors, ExamCategories, Exams} from "../../client/resources/index.js";
import type {ExamData} from "../../client/types/index.js";
import {DetailList, DetailRow, Modal} from "../../components/modal.js";
import {SubjectName, TeacherName} from "../../components/names.js";
import {EmptyState, PageHeader, SkeletonList} from "../../components/page.js";
import {QueryState} from "../../components/queryState.js";
import TaskCard from "../../components/taskCard.js";
import {T, TranslateToggle, TranslationScope} from "../../components/translate.js";
import UpcomingFilter from "../../components/upcomingFilter.js";
import DateUtils from "../../lib/date.js";
import Display from "../../lib/display.js";
import {useOpenFromLink} from "../../lib/deepLink.js";
import {sortTasks} from "../../lib/tasks.js";

const useCategory = (exam: ExamData | null) => {
  const {data: category} = ExamCategories.useOne(exam?.category.id);
  const {data: color} = Colors.useOne(category?.color.id);
  return {name: category?.name, color: color?.rGB};
};

const ExamCard = ({exam, onOpen}: { exam: ExamData; onOpen: (exam: ExamData) => void }) => {
  const {t} = useTranslation("exams");
  const category = useCategory(exam);
  return (
    <TaskCard
      title={category.name ? <T text={Display.upperFirst(category.name)} name/> : "..."}
      color={category.color}
      subject={exam.subject ? <SubjectName id={exam.subject.id}/> : "-"}
      date={exam.date}
      meta={exam.lessonNo ? `${t("details.lesson")} ${exam.lessonNo}` : DateUtils.time(exam.timeFrom)}
      onClick={() => onOpen(exam)}
    >
      <T text={exam.content}/>
    </TaskCard>
  );
};

const ExamDetails = ({exam, onClose}: { exam: ExamData | null; onClose: () => void }) => {
  const {t} = useTranslation("exams");
  const category = useCategory(exam);
  return (
    <TranslationScope id={exam?.id}>
    <Modal
      open={exam !== null}
      onClose={onClose}
      title={category.name ? <T text={Display.upperFirst(category.name)} name/> : t("details.title")}
      subtitle={exam?.subject && <SubjectName id={exam.subject.id}/>}
    >
      {exam && (
        <>
          <TranslateToggle/>
          <DetailList>
            <DetailRow label={t("details.date")}>
              {DateUtils.weekday(exam.date)}, {DateUtils.formatDate(exam.date)} ({DateUtils.relative(exam.date)})
            </DetailRow>
            {exam.lessonNo && <DetailRow label={t("details.lesson")}>{exam.lessonNo}</DetailRow>}
            {exam.timeFrom && <DetailRow label={t("details.time")}>{DateUtils.time(exam.timeFrom)} – {DateUtils.time(exam.timeTo)}</DetailRow>}
            {exam.classroom && <DetailRow label={t("details.classroom")}>{exam.classroom.symbol}</DetailRow>}
            <DetailRow label={t("details.teacher")}><TeacherName id={exam.createdBy.id}/></DetailRow>
            <DetailRow label={t("details.added")}>{DateUtils.formatDateTime(exam.addDate)}</DetailRow>
          </DetailList>
          {exam.content && (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-base-content/70">{t("details.description")}</span>
              <p className="p-3 bg-base-200 rounded-box whitespace-pre-wrap"><T text={exam.content}/></p>
            </div>
          )}
        </>
      )}
    </Modal>
    </TranslationScope>
  );
};

/** `HomeWorks` endpoint - tests, quizzes and other class events. */
const Page = () => {
  const {t} = useTranslation("exams");
  const [all, setAll] = useState(false);
  const [focused, setFocused] = useState<ExamData | null>(null);
  const exams = Exams.useQuery(undefined, {
    select: list => sortTasks(all ? list : list.filter(exam => DateUtils.daysFromToday(exam.date) >= 0), exam => exam.date),
  });
  // `?open=<id>` from the home page / calendar - looked up in the full list (past exams included)
  useOpenFromLink(Exams.useQuery().data, exam => exam.id, setFocused);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")} actions={<UpcomingFilter namespace="exams" all={all} onChange={setAll}/>}/>
      <QueryState query={exams} loading={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"><SkeletonList count={6}/></div>}>
        {list => list.length === 0
          ? <EmptyState icon={<RiFileEditLine/>}>{t("empty")}</EmptyState>
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {list.map(exam => <ExamCard key={exam.id} exam={exam} onOpen={setFocused}/>)}
            </div>
          )}
      </QueryState>
      <ExamDetails exam={focused} onClose={() => setFocused(null)}/>
    </div>
  );
};

export default Page;
