import Layout from "@/components/layout";
import { useTimetable } from "@/lib/timetable";
import { useClassrooms } from "@/lib/school";
import { upperFirst } from "@/lib/utils";

import { useState } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { getStaticPaths, makeStaticProps } from "@/lib/i18n/getStatic";
import { useTranslation } from "react-i18next";

const getStaticProps = makeStaticProps(["timetable", "common"]);
export { getStaticPaths, getStaticProps };

dayjs.extend(isoWeek);

const Timetable = () => {
  const { t } = useTranslation(["timetable", "common"]);

  const [date, setDate] = useState(
    dayjs().startOf("isoWeek").format("YYYY-MM-DD")
  );
  const [focusedLesson, setFocusedLesson] = useState(null);
  
  const {
    data: timetableData,
    loading: timetableLoading,
    error: timetableError,
  } = useTimetable(date);

  // get all unique classroom ids from timetable data
  const classroomIds = timetableData ? 
    [...new Set(
      Object.values(timetableData)
        .flat()
        .filter(entry => entry.length > 0)
        .map(entry => entry[0].Classroom?.Id)
        .filter(Boolean)
    )].join(",") : false;

  const {
    data: classroomsData,
    loading: classroomsLoading,
    error: classroomsError,
  } = useClassrooms(classroomIds);

  const getClassroomName = (classroomId) => {
    if (!classroomsData || !classroomId) return t("common:unknown.room");
    
    const classrooms = Array.isArray(classroomsData) ? classroomsData : [classroomsData];
    const classroom = classrooms.find(c => c.Id == classroomId);
    
    return classroom ? (classroom.Symbol || classroom.Name) : t("common:unknown.room");
  };
  
  const weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <Layout>
      <dialog
        id="lesson_modal"
        className="modal modal-bottom sm:modal-middle"
        onClose={() => {
          setFocusedLesson(null);
          document.getElementById("lesson_modal").scrollTop = 0;
        }}
      >
        <div className="modal-box">
          {focusedLesson ? (
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-2xl text-base-content">
                {upperFirst(focusedLesson.Subject.Name)}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-base-content/70">{t("modal.teacher")}</span>
                  <span className="text-lg">
                    {focusedLesson.Teacher.FirstName} {focusedLesson.Teacher.LastName}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-base-content/70">{t("modal.time")}</span>
                  <span className="text-lg">
                    {focusedLesson.HourFrom} - {focusedLesson.HourTo}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-base-content/70">{t("modal.room")}</span>
                  <span className="text-lg">
                    {getClassroomName(focusedLesson.Classroom?.Id)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-base-content/70">{t("modal.date")}</span>
                  <span className="text-lg">
                    {dayjs(focusedLesson.Date).format("DD.MM.YYYY")}
                  </span>
                </div>
              </div>
              {focusedLesson.IsSubstitutionClass && (
                <div className="alert alert-info">
                  <span>{t("modal.substitution_alert")}</span>
                </div>
              )}
              {focusedLesson.IsCanceled && (
                <div className="alert alert-error">
                  <span>{t("modal.canceled_alert")}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-lg">{t("common:states.loading")}</span>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-col">
          <span className="text-3xl font-semibold">{t("title")}</span>
          <span className="text-lg">
            {dayjs(date).format("DD/MM/YYYY")} -{" "}
            {dayjs(date).add(4, "day").format("DD/MM/YYYY")}
          </span>
        </div>
        <div className="flex flex-row gap-2">
          <button
            className="btn btn-primary"
            onClick={() =>
              setDate(dayjs(date).subtract(1, "week").format("YYYY-MM-DD"))
            }
          >
            <ChevronLeft />
          </button>
          <button
            className="btn btn-primary"
            onClick={() =>
              setDate(dayjs(date).add(1, "week").format("YYYY-MM-DD"))
            }
          >
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className="flex flex-row flex-wrap">
        {!timetableLoading && !timetableError
          ? Object.keys(timetableData).map((day) => {
              const dayData = timetableData[day];
              if (dayjs(day).isoWeekday() > 5) return;
              return (
                <div
                  className="flex flex-col basis-full md:basis-1/2 lg:basis-1/3 shrink-0 p-2 gap-3"
                  key={day}
                >
                  <span className="text-xl font-semibold">
                    {weekDays[dayjs(day).isoWeekday() - 1]}
                  </span>
                  <div className="flex flex-col gap-2">
                    {dayData.every((x) => x.length == 0) && (
                      <div className="flex flex-row justify-center items-center bg-base-200 border border-base-300 rounded-box p-3">
                        <span className="text-lg">{t("empty")}</span>
                      </div>
                    )}
                    {dayData
                      .filter((x) => x.length)
                      .map((entry, index) => {
                        return (
                          <div
                            className={`relative flex flex-row bg-base-200 border border-base-300 rounded-box p-3 justify-between items-center cursor-pointer hover:bg-base-300 transition-colors ${
                              entry[0].IsSubstitutionClass &&
                              "border border-primary"
                            }`}
                            key={index}
                            onClick={() => {
                              setFocusedLesson(entry[0]);
                              document.getElementById("lesson_modal").showModal();
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="text-lg font-semibold">
                                {upperFirst(entry[0].Subject.Name)}
                              </span>
                              <span className="text-sm text-base-content/70">
                                {entry[0].Teacher.FirstName}{" "}
                                {entry[0].Teacher.LastName}
                              </span>
                              <span className="text-xs text-base-content/60">
                                {getClassroomName(entry[0].Classroom?.Id)}
                              </span>
                            </div>
                            <span className="text-base font-semibold">
                              {entry[0].HourFrom} - {entry[0].HourTo}
                            </span>
                            {entry[0].IsCanceled && (
                              <div className="absolute flex top-0 right-0 w-full h-full bg-base-100 opacity-90 rounded-box items-center justify-center">
                                <span className="text-2xl font-bold text-primary rotate-3">
                                  {t("canceled")}
                                </span>
                              </div>
                            )}
                            {entry[0].IsSubstitutionClass && (
                              <div className="absolute badge badge-primary -top-2 -right-2">
                                {t("substitution")}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })
          : Array.from({ length: 5 }).map((_, index) => (
              <div
                className="flex flex-col basis-full md:basis-1/2 lg:basis-1/3 shrink-0 p-2 gap-3"
                key={index}
              >
                <div className="skeleton h-16 w-full rounded-box"></div>
              </div>
            ))}
      </div>
    </Layout>
  );
};
export default Timetable;
