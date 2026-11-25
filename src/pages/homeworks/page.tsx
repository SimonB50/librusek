import {useState} from "react";
import {RiBookOpenLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {HomeworkCategories, Homeworks} from "../../client/resources/index.js";
import type {HomeworkData} from "../../client/types/index.js";
import {DetailList, DetailRow, Modal} from "../../components/modal.js";
import {LessonSubjectName, TeacherName} from "../../components/names.js";
import {EmptyState, PageHeader, SkeletonList} from "../../components/page.js";
import {QueryState} from "../../components/queryState.js";
import RichText from "../../components/richText.js";
import {T, TranslateToggle, TranslationScope} from "../../components/translate.js";
import TaskCard from "../../components/taskCard.js";
import UpcomingFilter from "../../components/upcomingFilter.js";
import DateUtils from "../../lib/date.js";
import Display from "../../lib/display.js";
import Html from "../../lib/html.js";
import {useOpenFromLink} from "../../lib/deepLink.js";
import {sortTasks} from "../../lib/tasks.js";

const CategoryName = ({id}: { id?: number }) => {
  const {data} = HomeworkCategories.useOne(id);
  return data?.categoryName ? <T text={data.categoryName} name/> : <>...</>;
};

/**
 * `HomeWorkAssignments` - empty for the tested account, so the field usage follows the old app
 * (`topic`, `text` as HTML, `dueDate`, `lesson` -> subject, `category.categoryName`).
 */
const Page = () => {
  const {t} = useTranslation("homeworks");
  const [all, setAll] = useState(false);
  const [focused, setFocused] = useState<HomeworkData | null>(null);
  const homeworks = Homeworks.useQuery(undefined, {
    select: list => sortTasks(all ? list : list.filter(hw => DateUtils.daysFromToday(hw.dueDate) >= 0), hw => hw.dueDate),
  });
  useOpenFromLink(Homeworks.useQuery().data, homework => homework.id, setFocused);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")} actions={<UpcomingFilter namespace="homeworks" all={all} onChange={setAll}/>}/>
      <QueryState query={homeworks} loading={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"><SkeletonList count={6}/></div>}>
        {list => list.length === 0
          ? <EmptyState icon={<RiBookOpenLine/>}>{t("empty")}</EmptyState>
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {list.map(homework => (
                <TaskCard
                  key={homework.id}
                  title={homework.category ? <CategoryName id={homework.category.id}/> : <T text={Display.upperFirst(homework.topic ?? "")}/>}
                  subject={<LessonSubjectName lessonId={homework.lesson?.id}/>}
                  date={homework.dueDate}
                  onClick={() => setFocused(homework)}
                >
                  {homework.topic && <span className="font-semibold"><T text={Display.upperFirst(homework.topic)}/> </span>}
                  <T text={Html.toText(homework.text)}/>
                </TaskCard>
              ))}
            </div>
          )}
      </QueryState>
      <TranslationScope id={focused?.id}>
      <Modal
        open={focused !== null}
        onClose={() => setFocused(null)}
        title={focused?.topic ? <T text={Display.upperFirst(focused.topic)}/> : t("details.title")}
        subtitle={focused?.lesson && <LessonSubjectName lessonId={focused.lesson.id}/>}
        className="sm:max-w-2xl"
      >
        {focused && (
          <>
            <TranslateToggle/>
            <DetailList>
              {focused.category && <DetailRow label={t("details.category")}><CategoryName id={focused.category.id}/></DetailRow>}
              <DetailRow label={t("details.given")}>{DateUtils.formatDate(focused.date)}</DetailRow>
              <DetailRow label={t("details.due")}>{DateUtils.formatDate(focused.dueDate)} ({DateUtils.relative(focused.dueDate)})</DetailRow>
              {focused.teacher && <DetailRow label={t("details.teacher")}><TeacherName id={focused.teacher.id}/></DetailRow>}
            </DetailList>
            <RichText html={focused.text} className="text-base-content/90"/>
          </>
        )}
      </Modal>
      </TranslationScope>
    </div>
  );
};

export default Page;
