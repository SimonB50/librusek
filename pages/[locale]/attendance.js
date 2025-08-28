import Layout from "@/components/layout";
import { useAttendance, useAttendancesTypes, useLessons } from "@/lib/lessons";
import { useSubjects, useTeachers } from "@/lib/school";
import { upperFirst, groupAbsences } from "@/lib/utils";
import { useState } from "react";
import { getStaticPaths, makeStaticProps } from "@/lib/i18n/getStatic";
import { useTranslation } from "react-i18next";

const getStaticProps = makeStaticProps(["attendance", "common"]);
export { getStaticPaths, getStaticProps };

const Attendance = () => {
  const { t } = useTranslation(["attendance", "common"]);

  // Page data
  const [focusedSubject, setFocusedSubject] = useState(null);
  const [focusedAbsence, setFocusedAbsence] = useState(null);

  // Attendance data
  const {
    data: attendanceData,
    loading: attendanceLoading,
    error: attendanceError,
  } = useAttendance();
  const {
    data: attendanceTypesData,
    loading: attendanceTypesLoading,
    error: attendanceTypesError,
  } = useAttendancesTypes(
    attendanceData && attendanceData.length
      ? attendanceData.map((x) => x.Type.Id).join(",")
      : false
  );
  const {
    data: lessonsData,
    loading: lessonsLoading,
    error: lessonsError,
  } = useLessons(
    attendanceData && attendanceData.length
      ? attendanceData.map((x) => x.Lesson.Id).join(",")
      : false
  );
  const {
    data: subjectsData,
    loading: subjectsLoading,
    error: subjectsError,
  } = useSubjects(
    lessonsData && lessonsData.length
      ? lessonsData.map((x) => x.Subject.Id).join(",")
      : false
  );
  const {
    data: teachersData,
    loading: teachersLoading,
    error: teachersError,
  } = useTeachers(
    attendanceData && attendanceData.length
      ? attendanceData.map((x) => x.AddedBy.Id).join(",")
      : false
  );

  return (
    <Layout>
      <dialog
        id="attendanceDetails"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="text-2xl font-bold">
            {focusedSubject &&
              upperFirst(subjectsData.find((x) => x.Id == focusedSubject).Name)}
          </h3>
          <div className="flex flex-col mt-4">
            <span className="text-lg font-semibold">
              {t("common.school.semester", { ns: "common", semester: "I" })}
            </span>
            <div className="flex flex-col">
              <div className="flex flex-row gap-2">
                <span>
                  {t("subject_details.presence")}:{" "}
                  <span className="font-bold">
                    {attendanceData &&
                      lessonsData &&
                      attendanceData.filter(
                        (x) =>
                          x.Semester == 1 &&
                          lessonsData.find((y) => x.Lesson.Id === y.Id).Subject
                            .Id === focusedSubject &&
                          attendanceTypesData.find((y) => y.Id == x.Type.Id)
                            .IsPresenceKind == true
                      ).length}
                  </span>
                </span>
                <span>
                  {t("subject_details.absences")}:{" "}
                  <span className="font-bold">
                    {attendanceData &&
                      lessonsData &&
                      attendanceData.filter(
                        (x) =>
                          x.Semester == 1 &&
                          lessonsData.find((y) => x.Lesson.Id === y.Id).Subject
                            .Id === focusedSubject &&
                          attendanceTypesData.find((y) => y.Id == x.Type.Id)
                            .IsPresenceKind == false
                      ).length}
                  </span>
                </span>
                <span>
                  {t("subject_details.total")}:{" "}
                  <span className="font-bold">
                    {attendanceData &&
                      lessonsData &&
                      attendanceData.filter(
                        (x) =>
                          x.Semester == 1 &&
                          lessonsData.find((y) => x.Lesson.Id === y.Id).Subject
                            .Id === focusedSubject
                      ).length}
                  </span>
                </span>
              </div>
              <span>
                {t("subject_details.percentage")}:{" "}
                <span className="font-bold">
                  {attendanceData &&
                    lessonsData &&
                    (
                      (1 -
                        attendanceData.filter(
                          (x) =>
                            x.Semester == 1 &&
                            lessonsData.find((y) => x.Lesson.Id === y.Id)
                              .Subject.Id === focusedSubject &&
                            attendanceTypesData.find((y) => y.Id == x.Type.Id)
                              .IsPresenceKind == false
                        ).length /
                          attendanceData.filter(
                            (x) =>
                              x.Semester == 1 &&
                              lessonsData.find((y) => x.Lesson.Id === y.Id)
                                .Subject.Id === focusedSubject
                          ).length) *
                      100
                    ).toFixed()}
                  %
                </span>
              </span>
            </div>
          </div>
          <div className="flex flex-col mt-4">
            <span className="text-lg font-semibold">
              {t("common.school.semester", { ns: "common", semester: "II" })}
            </span>
            <div className="flex flex-col">
              <div className="flex flex-row gap-2">
                <span>
                  {t("subject_details.presence")}:{" "}
                  <span className="font-bold">
                    {attendanceData &&
                      lessonsData &&
                      attendanceData.filter(
                        (x) =>
                          x.Semester == 2 &&
                          lessonsData.find((y) => x.Lesson.Id === y.Id).Subject
                            .Id === focusedSubject &&
                          attendanceTypesData.find((y) => y.Id == x.Type.Id)
                            .IsPresenceKind == true
                      ).length}
                  </span>
                </span>
                <span>
                  {t("subject_details.absences")}:{" "}
                  <span className="font-bold">
                    {attendanceData &&
                      lessonsData &&
                      attendanceData.filter(
                        (x) =>
                          x.Semester == 2 &&
                          lessonsData.find((y) => x.Lesson.Id === y.Id).Subject
                            .Id === focusedSubject &&
                          attendanceTypesData.find((y) => y.Id == x.Type.Id)
                            .IsPresenceKind == false
                      ).length}
                  </span>
                </span>
                <span>
                  {t("subject_details.total")}:{" "}
                  <span className="font-bold">
                    {attendanceData &&
                      lessonsData &&
                      attendanceData.filter(
                        (x) =>
                          x.Semester == 2 &&
                          lessonsData.find((y) => x.Lesson.Id === y.Id).Subject
                            .Id === focusedSubject
                      ).length}
                  </span>
                </span>
              </div>
              <span>
                {t("subject_details.percentage")}:{" "}
                <span className="font-bold">
                  {attendanceData &&
                    lessonsData &&
                    (
                      (1 -
                        attendanceData.filter(
                          (x) =>
                            x.Semester == 2 &&
                            lessonsData.find((y) => x.Lesson.Id === y.Id)
                              .Subject.Id === focusedSubject &&
                            attendanceTypesData.find((y) => y.Id == x.Type.Id)
                              .IsPresenceKind == false
                        ).length /
                          attendanceData.filter(
                            (x) =>
                              x.Semester == 2 &&
                              lessonsData.find((y) => x.Lesson.Id === y.Id)
                                .Subject.Id === focusedSubject
                          ).length) *
                      100
                    ).toFixed()}
                  %
                </span>
              </span>
            </div>
          </div>
          <div className="flex flex-col mt-4">
            <span className="text-lg font-semibold">
              {t("common.summary", { ns: "common" })}
            </span>
            <div className="flex flex-col">
              <div className="flex flex-row gap-2">
                <span>
                  {t("subject_details.presence")}:{" "}
                  <span className="font-bold">
                    {attendanceData &&
                      lessonsData &&
                      attendanceData.filter(
                        (x) =>
                          lessonsData.find((y) => x.Lesson.Id === y.Id).Subject
                            .Id === focusedSubject &&
                          attendanceTypesData.find((y) => y.Id == x.Type.Id)
                            .IsPresenceKind == true
                      ).length}
                  </span>
                </span>
                <span>
                  {t("subject_details.absences")}:{" "}
                  <span className="font-bold">
                    {attendanceData &&
                      lessonsData &&
                      attendanceData.filter(
                        (x) =>
                          lessonsData.find((y) => x.Lesson.Id === y.Id).Subject
                            .Id === focusedSubject &&
                          attendanceTypesData.find((y) => y.Id == x.Type.Id)
                            .IsPresenceKind == false
                      ).length}
                  </span>
                </span>
                <span>
                  {t("subject_details.total")}:{" "}
                  <span className="font-bold">
                    {attendanceData &&
                      lessonsData &&
                      attendanceData.filter(
                        (x) =>
                          lessonsData.find((y) => x.Lesson.Id === y.Id).Subject
                            .Id === focusedSubject
                      ).length}
                  </span>
                </span>
              </div>
              <span>
                Attendance percentage:{" "}
                <span className="font-bold">
                  {attendanceData &&
                    lessonsData &&
                    (
                      (1 -
                        attendanceData.filter(
                          (x) =>
                            lessonsData.find((y) => x.Lesson.Id === y.Id)
                              .Subject.Id === focusedSubject &&
                            attendanceTypesData.find((y) => y.Id == x.Type.Id)
                              .IsPresenceKind == false
                        ).length /
                          attendanceData.filter(
                            (x) =>
                              lessonsData.find((y) => x.Lesson.Id === y.Id)
                                .Subject.Id === focusedSubject
                          ).length) *
                      100
                    ).toFixed()}
                  %
                </span>
              </span>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <dialog
        id="abscenseDetails"
        className="modal modal-bottom sm:modal-middle"
        onClose={() => setFocusedAbsence(null)}
      >
        <div className="modal-box">
          {focusedAbsence && attendanceData && attendanceTypesData && (
            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-2xl text-base-content mb-2">
                {t("absences.entry.title")}
              </h3>
              <div className="flex flex-row gap-2 items-center">
                <span
                  className={`text-4xl font-semibold ${
                    attendanceTypesData.find(
                      (x) =>
                        x.Id ==
                        attendanceData.find((x) => x.Id == focusedAbsence).Type
                          .Id
                    ).Short == "nb"
                      ? "bg-error text-error-content"
                      : "bg-warning text-warning-content"
                  } w-20 h-20 flex items-center justify-center rounded-field`}
                >
                  {
                    attendanceTypesData.find(
                      (x) =>
                        x.Id ==
                        attendanceData.find((x) => x.Id == focusedAbsence).Type
                          .Id
                    ).Short
                  }
                </span>
                <div className="flex flex-col h-max items-start justify-center">
                  <span className="text-xl font-semibold">
                    {upperFirst(
                      attendanceTypesData.find(
                        (x) =>
                          x.Id ==
                          attendanceData.find((x) => x.Id == focusedAbsence)
                            .Type.Id
                      ).Name
                    )}
                  </span>
                  <span className="text-lg">
                    {attendanceData.find((x) => x.Id == focusedAbsence).Date}
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg">
                  <span className="font-semibold">
                    {t("absences.entry.lesson.title")}:
                  </span>{" "}
                  {!subjectsLoading &&
                    !subjectsError &&
                    !lessonsLoading &&
                    !lessonsError &&
                    t("absences.entry.lesson.value", {
                      subject: upperFirst(
                        subjectsData.find(
                          (x) =>
                            x.Id ==
                            lessonsData.find(
                              (x) =>
                                x.Id ==
                                attendanceData.find(
                                  (x) => x.Id == focusedAbsence
                                ).Lesson.Id
                            ).Subject.Id
                        ).Name
                      ),
                      lesson: attendanceData.find((x) => x.Id == focusedAbsence)
                        .LessonNo,
                    })}
                </span>
                {!teachersLoading && !teachersError && (
                  <span className="text-lg">
                    <span className="font-semibold">
                      {t("absences.entry.teacher")}:
                    </span>{" "}
                    {
                      teachersData.find(
                        (x) =>
                          x.Id ==
                          attendanceData.find((x) => x.Id == focusedAbsence)
                            ?.AddedBy?.Id
                      ).FirstName
                    }{" "}
                    {
                      teachersData.find(
                        (x) =>
                          x.Id ==
                          attendanceData.find((x) => x.Id == focusedAbsence)
                            ?.AddedBy?.Id
                      ).LastName
                    }
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <span className="text-3xl font-semibold mb-4">{t("title")}</span>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {!subjectsLoading && !subjectsError && (
          <div role="alert" class="alert border border-base-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              class="stroke-info h-6 w-6 shrink-0"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>{t("hint")}</span>
          </div>
        )}
        {!subjectsLoading && !subjectsError ? (
          subjectsData && subjectsData.length ? (
            subjectsData
            .filter((subject) => attendanceData.some((x) => {
              const lesson = lessonsData.find((y) => y.Id === x.Lesson.Id);
              return lesson && lesson.Subject.Id === subject.Id;
            }))
            .map((subject) => {
              const attendancePercentage = (
                (1 -
                  attendanceData.filter(
                    (x) =>
                      lessonsData.find((y) => x.Lesson.Id === y.Id).Subject
                        .Id === subject.Id &&
                      attendanceTypesData.find((y) => y.Id == x.Type.Id)
                        .IsPresenceKind == false
                  ).length /
                    attendanceData.filter(
                      (x) =>
                        lessonsData.find((y) => x.Lesson.Id === y.Id).Subject
                          .Id === subject.Id
                    ).length) *
                100
              ).toFixed();
              return (
                <div
                  key={subject.Id}
                  className="relative overflow-hidden flex flex-col gap-4 p-4 bg-base-200 border border-base-300 rounded-box shadow-md cursor-pointer"
                  onClick={() => {
                    setFocusedSubject(subject.Id);
                    document.getElementById("attendanceDetails").showModal();
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold">
                      {upperFirst(subject.Name)}
                    </span>
                    <span className="text-lg font-semibold">
                      {attendancePercentage}%
                    </span>
                  </div>
                  <div className="absolute left-0 bottom-0 w-full h-1 rounded-full bg-error">
                    <div
                      className={`h-1 bg-success`}
                      style={{
                        width: `${attendancePercentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col gap-4">
              <span className="text-lg">{t("empty")}</span>
            </div>
          )
        ) : (
          Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton w-full h-10 rounded-box"></div>
          ))
        )}
      </div>
      <div className="flex flex-col mt-4">
        <span className="text-3xl font-semibold mb-4">
          {t("absences.title")}
        </span>
        <div className="flex flex-col gap-2">
          {attendanceData && attendanceTypesData ? (
            groupAbsences(
              attendanceData.filter(
                (x) =>
                  attendanceTypesData.find((y) => y.Id == x.Type.Id)
                    .IsPresenceKind == false
              )
            ).map((absenceGroup) => {
              const selectedAbsences = attendanceData.filter(
                (x) =>
                  x.Date == absenceGroup &&
                  attendanceTypesData.find((y) => y.Id == x.Type.Id)
                    .IsPresenceKind == false
              );
              return (
                <div
                  key={absenceGroup}
                  className="flex flex-col gap-2 bg-base-200 border border-base-300 p-4 rounded-box"
                >
                  <span className="text-lg font-semibold">{absenceGroup}</span>
                  <div className="flex flex-row gap-2">
                    {selectedAbsences.map((absence) => {
                      const absenceType = attendanceTypesData.find(
                        (x) => x.Id == absence?.Type?.Id
                      );
                      return (
                        <button
                          key={absence.Id}
                          className={`flex items-center justify-center w-10 h-10 p-2 ${
                            absenceType.Short == "nb"
                              ? "bg-error"
                              : "bg-warning"
                          } rounded-field`}
                          onClick={() => {
                            setFocusedAbsence(absence.Id);
                            document
                              .getElementById("abscenseDetails")
                              .showModal();
                          }}
                        >
                          <span
                            className={
                              absenceType.Short == "nb"
                                ? "text-error-content"
                                : "text-warning-content"
                            }
                          >
                            {absenceType.Short}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <span className="text-lg">{t("absences.empty")}</span>
          )}
        </div>
      </div>
    </Layout>
  );
};
export default Attendance;
