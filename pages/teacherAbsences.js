import Layout from "@/components/layout";
import { useTeachers } from "@/lib/school";
import { useTeacherAbsences } from "@/lib/timetable";
import { deduplicate, sortTeacherAbsences } from "@/lib/utils";
import dayjs from "dayjs";

const TeacherAbsences = () => {
  // Teacher absences data
  const {
    data: teacherAbsencesData,
    loading: teacherAbsencesLoading,
    error: teacherAbsencesError,
  } = useTeacherAbsences();
  const {
    data: teachersData,
    loading: teachersLoading,
    error: teachersError,
  } = useTeachers(
    deduplicate([
      ...(teacherAbsencesData
        ? teacherAbsencesData.TeacherFreeDays.map((x) => x.Teacher.Id)
        : []),
    ]).join(",")
  );

  return (
    <Layout>
      <span className="text-3xl font-semibold mb-4">Teacher absences</span>
      <div className="grid grid-cols-6 gap-2 mt-4">
        {!teacherAbsencesError &&
        !teacherAbsencesLoading &&
        !teachersLoading &&
        !teachersError
          ? sortTeacherAbsences(teacherAbsencesData.TeacherFreeDays)
              .filter((x) =>
                teachersData.Users.find((y) => y.Id == x.Teacher.Id)
              )
              .map((absence) => (
                <div
                  key={absence.Id}
                  className={`col-span-6 sm:col-span-3 md:col-span-2 flex flex-col justify-between p-4 bg-base-200 rounded-box ${
                    dayjs().valueOf() >= dayjs(absence.DateFrom).startOf('day').valueOf() &&
                    dayjs().valueOf() <= dayjs(absence.DateTo).endOf('day').valueOf()
                      ? `border border-primary`
                      : ``
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xl font-bold">
                      {!teachersLoading &&
                        !teachersError &&
                        `${
                          teachersData.Users.find(
                            (x) => x.Id == absence.Teacher.Id
                          )?.FirstName
                        } ${
                          teachersData.Users.find(
                            (x) => x.Id == absence.Teacher.Id
                          )?.LastName
                        }`}
                    </span>
                  </div>
                  <div className="flex flex-row justify-between items-center">
                    <span>
                      {dayjs(absence.DateFrom).format("DD.MM.YYYY")} -{" "}
                      {dayjs(absence.DateTo).format("DD.MM.YYYY")}
                    </span>
                    {dayjs(absence.DateFrom).startOf('day').valueOf() >= dayjs().valueOf() && (
                      <div className="badge badge-primary">
                        In{" "}
                        {Math.ceil(
                            dayjs(absence.DateFrom).diff(dayjs(), "day", true)
                          )}{" "}
                        days
                      </div>
                    )}
                  </div>
                </div>
              ))
          : Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="col-span-6 sm:col-span-3 md:col-span-2 skeleton h-24"
              ></div>
            ))}
      </div>
    </Layout>
  );
};
export default TeacherAbsences;
