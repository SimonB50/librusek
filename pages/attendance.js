import Layout from "@/components/layout";
import { useAttendance, useAttendancesTypes, useLessons } from "@/lib/lessons";
import { useSubjects, useTeachers } from "@/lib/school";
import { upperFirst, deduplicate, groupAbsences } from "@/lib/utils";
import { useState } from "react";

const Attendance = () => {
  // Page data
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
    deduplicate([
      ...(attendanceData
        ? attendanceData.Attendances.map((x) => x.Type.Id)
        : []),
    ]).join(",")
  );
  const {
    data: lessonsData,
    loading: lessonsLoading,
    error: lessonsError,
  } = useLessons(
    deduplicate([
      ...(attendanceData
        ? attendanceData.Attendances.map((x) => x.Lesson.Id)
        : []),
    ]).join(",")
  );
  const {
    data: subjectsData,
    loading: subjectsLoading,
    error: subjectsError,
  } = useSubjects(
    deduplicate([
      ...(lessonsData ? lessonsData.Lessons.map((x) => x.Subject.Id) : []),
    ]).join(",")
  );
  const {
    data: teachersData,
    loading: teachersLoading,
    error: teachersError,
  } = useTeachers(
    deduplicate([
      ...(attendanceData
        ? attendanceData.Attendances.map((x) => x.AddedBy.Id)
        : []),
    ]).join(",")
  );

  return (
    <Layout>
      <span className="text-3xl font-semibold mb-4">Attendance</span>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {!subjectsLoading && !subjectsError
          ? subjectsData.Subjects.map((subject) => {
              const attendancePercentage =
                (
                  1 -
                  attendanceData.Attendances.filter(
                    (x) =>
                      lessonsData.Lessons.find((y) => x.Lesson.Id === y.Id)
                        .Subject.Id === subject.Id &&
                      attendanceTypesData.Types.find((y) => y.Id == x.Type.Id)
                        .IsPresenceKind == false
                  ).length /
                    attendanceData.Attendances.filter(
                      (x) =>
                        lessonsData.Lessons.find((y) => x.Lesson.Id === y.Id)
                          .Subject.Id === subject.Id
                    ).length
                ).toFixed(2) * 100;
              return (
                <div
                  key={subject.Id}
                  className="relative overflow-hidden flex flex-col gap-4 p-4 bg-base-200 rounded-box shadow-md"
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
          : Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="skeleton w-full h-10 rounded-box"></div>
            ))}
      </div>
      <div className="flex flex-col mt-4">
        <span className="text-3xl font-semibold mb-4">Your absences</span>
        <div className="flex flex-col gap-2">
          {!attendanceLoading &&
          !attendanceError &&
          !attendanceTypesLoading &&
          !attendanceTypesError ? (
            groupAbsences(
              attendanceData.Attendances.filter(
                (x) =>
                  attendanceTypesData.Types.find((y) => y.Id == x.Type.Id)
                    .IsPresenceKind == false
              )
            ).map((absenceGroup) => {
              const selectedAbsences = attendanceData.Attendances.filter(
                (x) =>
                  x.Date == absenceGroup &&
                  attendanceTypesData.Types.find((y) => y.Id == x.Type.Id)
                    .IsPresenceKind == false
              );
              return (
                <div key={absenceGroup} className="flex flex-col gap-2 bg-base-200 p-4 rounded-box">
                  <span className="text-lg font-semibold">{absenceGroup}</span>
                  <div className="flex flex-row gap-2">
                    {selectedAbsences.map((absence) => (
                      <button
                        key={absence.Id}
                        className={`flex items-center justify-center w-10 h-10 p-2 ${
                          attendanceTypesData.Types.find(
                            (x) => x.Id == absence.Type.Id
                          ).Short == "nb"
                            ? "bg-error"
                            : "bg-warning"
                        } rounded-md`}
                        onClick={() =>
                          focusedAbsence == absence.Id
                            ? setFocusedAbsence(null)
                            : setFocusedAbsence(absence.Id)
                        }
                      >
                        <span
                          className={
                            attendanceTypesData.Types.find(
                              (x) => x.Id == absence.Type.Id
                            ).Short == "nb"
                              ? "text-error-content"
                              : "text-warning-content"
                          }
                        >
                          {
                            attendanceTypesData.Types.find(
                              (x) => x.Id == absence.Type.Id
                            ).Short
                          }
                        </span>
                      </button>
                    ))}
                  </div>
                  {focusedAbsence &&
                    selectedAbsences.find((x) => x.Id == focusedAbsence) && (
                      <div className="flex flex-col gap-2 mt-2 bg-base-100 p-3 rounded-md">
                        <div className="flex flex-row gap-2 items-center">
                          <span
                            class={`text-4xl font-semibold ${
                              attendanceTypesData.Types.find(
                                (x) =>
                                  x.Id ==
                                  attendanceData.Attendances.find(
                                    (x) => x.Id == focusedAbsence
                                  ).Type.Id
                              ).Short == "nb"
                                ? "bg-error"
                                : "bg-warning"
                            } w-20 h-20 flex items-center justify-center text-primary-content rounded-md`}
                          >
                            {
                              attendanceTypesData.Types.find(
                                (x) =>
                                  x.Id ==
                                  attendanceData.Attendances.find(
                                    (x) => x.Id == focusedAbsence
                                  ).Type.Id
                              ).Short
                            }
                          </span>
                          <div className="flex flex-col h-max items-start justify-center">
                            <span className="text-xl font-semibold">
                              {upperFirst(
                                attendanceTypesData.Types.find(
                                  (x) =>
                                    x.Id ==
                                    attendanceData.Attendances.find(
                                      (x) => x.Id == focusedAbsence
                                    ).Type.Id
                                ).Name
                              )}
                            </span>
                            <span className="text-lg">
                              {
                                attendanceData.Attendances.find(
                                  (x) => x.Id == focusedAbsence
                                ).Date
                              }
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-lg">
                            <span className="font-semibold">Lesson:</span>{" "}
                            {!subjectsLoading &&
                              !subjectsError &&
                              !lessonsLoading &&
                              !lessonsError &&
                              upperFirst(
                                `${
                                  subjectsData.Subjects.find(
                                    (x) =>
                                      x.Id ==
                                      lessonsData.Lessons.find(
                                        (x) =>
                                          x.Id ==
                                          attendanceData.Attendances.find(
                                            (x) => x.Id == focusedAbsence
                                          ).Lesson.Id
                                      ).Subject.Id
                                  ).Name
                                } (No. ${
                                  attendanceData.Attendances.find(
                                    (x) => x.Id == focusedAbsence
                                  ).LessonNo
                                })`
                              )}
                          </span>
                          {!teachersLoading && !teachersError && (
                            <span className="text-lg">
                              <span className="font-semibold">Teacher:</span>{" "}
                              {
                                teachersData.Users.find(
                                  (x) =>
                                    x.Id ==
                                    attendanceData.Attendances.find(
                                      (x) => x.Id == focusedAbsence
                                    )?.AddedBy?.Id
                                ).FirstName
                              }{" "}
                              {
                                teachersData.Users.find(
                                  (x) =>
                                    x.Id ==
                                    attendanceData.Attendances.find(
                                      (x) => x.Id == focusedAbsence
                                    )?.AddedBy?.Id
                                ).LastName
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              );
            })
          ) : (
            <></>
          )}
        </div>
        {/*         {attendanceData &&
          lessonsData &&
          attendanceTypesData &&
          JSON.stringify(
            attendanceData.Attendances.filter(
              (x) =>
                attendanceTypesData.Types.find((y) => y.Id == x.Type.Id)
                  .IsPresenceKind == false
            )
          )} */}
      </div>
    </Layout>
  );
};
export default Attendance;
