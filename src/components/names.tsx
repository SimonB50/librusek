import {useTranslation} from "react-i18next";
import {Classrooms, Lessons, Subjects, Users} from "../client/resources/index.js";
import type {Id} from "../client/types/index.js";
import Display from "../lib/display.js";
import {T} from "./translate.js";

/*
 * Leaf components resolving references - every instance on a page is batched into one
 * `/Users/0,...` / `/Subjects/0,...` request by the dictionary batcher.
 */

const Pending = () => <span className="skeleton inline-block h-3 w-20 align-middle"></span>;

const TeacherName = ({id}: { id?: Id | null }) => {
  const {t} = useTranslation();
  const {data, isPending, error} = Users.useOne(id);
  if (!id || error) return <>{t("unknown.teacher")}</>;
  if (isPending) return <Pending/>;
  return <>{Display.fullName(data) || t("unknown.teacher")}</>;
};

const SubjectName = ({id}: { id?: Id | null }) => {
  const {t} = useTranslation();
  const {data, isPending, error} = Subjects.useOne(id);
  if (!id || error) return <>{t("unknown.subject")}</>;
  if (isPending) return <Pending/>;
  return data ? <T text={Display.capitalize(data.name)} name/> : t("unknown.subject");
};

/** Lesson -> subject (homeworks and attendance reference lessons, not subjects). */
const LessonSubjectName = ({lessonId}: { lessonId?: Id | null }) => {
  const {t} = useTranslation();
  const lesson = Lessons.useOne(lessonId);
  if (!lessonId || lesson.error) return <>{t("unknown.subject")}</>;
  if (lesson.isPending) return <Pending/>;
  return <SubjectName id={lesson.data?.subject.id}/>;
};

const LessonTeacherName = ({lessonId}: { lessonId?: Id | null }) => {
  const lesson = Lessons.useOne(lessonId);
  if (lesson.isPending && lessonId) return <Pending/>;
  return <TeacherName id={lesson.data?.teacher.id}/>;
};

const ClassroomName = ({id}: { id?: Id | null }) => {
  const {data, isPending} = Classrooms.useOne(id);
  if (!id) return <>-</>;
  if (isPending) return <Pending/>;
  return <>{data ? `${data.symbol}${data.name && data.name !== data.symbol ? ` (${data.name})` : ""}` : "-"}</>;
};

export {TeacherName, SubjectName, LessonSubjectName, LessonTeacherName, ClassroomName};
