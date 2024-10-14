import Layout from "@/components/layout";
import { useAttendance, useAttendancesTypes, useLessons } from "@/lib/lessons";
import { useSubjects } from "@/lib/school";
import { upperFirst, deduplicate } from "@/lib/utils";

const Attendance = () => {
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
                        .Subject.Id === subject.Id && attendanceTypesData.Types.find((y) => y.Id == x.Type.Id).IsPresenceKind == false
                  ).length /
                    attendanceData.Attendances.filter(
                      (x) =>
                        lessonsData.Lessons.find((y) => x.Lesson.Id === y.Id)
                          .Subject.Id === subject.Id && attendanceTypesData.Types.find((y) => y.Id == x.Type.Id).IsPresenceKind == true
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
                    <span className="text-lg font-semibold">{attendancePercentage}%</span>
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
    </Layout>
  );
};
export default Attendance;
