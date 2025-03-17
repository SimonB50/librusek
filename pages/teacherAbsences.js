import Layout from "@/components/layout";
import { useTeachers } from "@/lib/school";
import { useTeacherAbsences } from "@/lib/timetable";
import { sortTeacherAbsences } from "@/lib/utils";
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
    teacherAbsencesData && teacherAbsencesData.length
      ? teacherAbsencesData.map((x) => x.Teacher.Id).join(",")
      : false
  );

  return (
    <Layout>
      <span className="text-3xl font-semibold mb-4">Teacher absences</span>
      <div className="grid grid-cols-6 gap-2 mt-4">
        {!teacherAbsencesError &&
        !teacherAbsencesLoading &&
        !teachersLoading &&
        !teachersError
          ? sortTeacherAbsences(teacherAbsencesData)
              .filter((x) => teachersData.find((y) => y.Id == x.Teacher.Id))
              .map((absence) => (
                <div
                  key={absence.Id}
                  className={`col-span-6 sm:col-span-3 md:col-span-2 flex flex-col justify-between p-4 bg-base-200 border border-base-300 rounded-box ${
                    dayjs().valueOf() >=
                      dayjs(absence.DateFrom).startOf("day").valueOf() &&
                    dayjs().valueOf() <=
                      dayjs(absence.DateTo).endOf("day").valueOf()
                      ? `border border-primary`
                      : ``
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xl font-bold">
                      {!teachersLoading &&
                        !teachersError &&
                        `${
                          teachersData.find((x) => x.Id == absence.Teacher.Id)
                            ?.FirstName
                        } ${
                          teachersData.find((x) => x.Id == absence.Teacher.Id)
                            ?.LastName
                        }`}
                    </span>
                  </div>
                  <div className="flex flex-row justify-between items-center">
                    <div className="flex flex-row items-start gap-x-2 gap-y-1 flex-wrap">
                      {absence.DateFrom === absence.DateTo ? (
                        <span className="text-nowrap">
                          {dayjs(absence.DateFrom).format("DD.MM.YYYY")}
                        </span>
                      ) : (
                        <span className="text-nowrap">
                          {dayjs(absence.DateFrom).format("DD.MM.YYYY")} -{" "}
                          {dayjs(absence.DateTo).format("DD.MM.YYYY")}
                        </span>
                      )}
                      {absence.TimeFrom && absence.TimeTo && (
                        <span className="text-nowrap">
                          {absence.TimeFrom.split(":").slice(0, 2).join(":")} -{" "}
                          {absence.TimeTo.split(":").slice(0, 2).join(":")}
                        </span>
                      )}
                    </div>
                    {dayjs(absence.DateFrom).startOf("day").valueOf() >=
                      dayjs().valueOf() && (
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
