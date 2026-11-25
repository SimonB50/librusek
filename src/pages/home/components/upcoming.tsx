import {RiCalendarCheckLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {Link} from "wouter";
import {ExamCategories, Exams} from "../../../client/resources/index.js";
import type {ExamData} from "../../../client/types/index.js";
import DueBadge from "../../../components/dueBadge.js";
import {SubjectName} from "../../../components/names.js";
import {EmptyState, SectionTitle, SkeletonList} from "../../../components/page.js";
import {QueryState} from "../../../components/queryState.js";
import {T} from "../../../components/translate.js";
import DateUtils from "../../../lib/date.js";
import {detailsHref} from "../../../lib/deepLink.js";
import {sortTasks} from "../../../lib/tasks.js";

const HORIZON = 7;

const ExamRow = ({exam}: { exam: ExamData }) => {
  const {data: category} = ExamCategories.useOne(exam.category.id);
  return (
    <li>
      <Link href={detailsHref("/exams", exam.id)} className="list-row items-center hover:bg-base-300 transition-colors rounded-box">
      <div className="flex flex-col items-center w-12">
        <span className="text-xs uppercase text-base-content/60">{DateUtils.weekday(exam.date, "short")}</span>
        <span className="text-xl font-bold">{DateUtils.parse(exam.date).getDate()}</span>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-semibold truncate">{category?.name ? <T text={category.name} name/> : "..."}</span>
        <span className="text-sm text-base-content/70 truncate">
          {exam.subject ? <SubjectName id={exam.subject.id}/> : <T text={exam.content}/>}
        </span>
      </div>
      <DueBadge date={exam.date}/>
      </Link>
    </li>
  );
};

/** Exams of the next week - a shortcut to the most asked question ("what's coming?"). */
const Upcoming = () => {
  const {t} = useTranslation("landing");
  const exams = Exams.useQuery(undefined, {
    select: list => sortTasks(list.filter(exam => {
      const days = DateUtils.daysFromToday(exam.date);
      return days >= 0 && days <= HORIZON;
    }), exam => exam.date),
  });

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle aside={<Link href="/exams" className="link link-hover text-sm">{t("upcoming.all")}</Link>}>
        {t("upcoming.title")}
      </SectionTitle>
      <QueryState query={exams} loading={<SkeletonList count={1}/>}>
        {list => list.length === 0
          ? <EmptyState icon={<RiCalendarCheckLine/>}>{t("upcoming.empty")}</EmptyState>
          : (
            <ul className="list bg-base-200 border border-base-300 rounded-box">
              {list.map(exam => <ExamRow key={exam.id} exam={exam}/>)}
            </ul>
          )}
      </QueryState>
    </div>
  );
};

export default Upcoming;
