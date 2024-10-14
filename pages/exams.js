import { useHomeworks, useHomeworksCategories } from "@/lib/timetable";
import Layout from "../components/layout";
import { upperFirst, sortTasks } from "@/lib/utils";
import { useSubjects } from "@/lib/school";
import dayjs from "dayjs";

const Exams = () => {
  // Grades data
  const {
    data: homeworkData,
    loading: homeworkLoading,
    error: homeworkError,
  } = useHomeworks();
  const {
    data: subjectsData,
    loading: subjectsLoading,
    error: subjectsError,
  } = useSubjects(
    [
      ...(!homeworkLoading && !homeworkError
        ? homeworkData.HomeWorks.filter((x) => x.Subject).map(
            (y) => y.Subject.Id
          )
        : []),
    ].join(",")
  );
  const {
    data: homeworkCategoriesData,
    loading: homeworkCategoriesLoading,
    error: homeworkCategoriesError,
  } = useHomeworksCategories(
    [
      ...(!homeworkLoading && !homeworkError
        ? homeworkData.HomeWorks.map((x) => x.Category.Id)
        : []),
    ].join(",")
  );

  return (
    <Layout>
      <span className="text-3xl font-semibold mb-4">Exams</span>
      <div className="grid grid-cols-6 gap-2 mt-4">
        {!homeworkLoading && !homeworkError
          ? sortTasks(homeworkData.HomeWorks).map((homework) => (
              <div
                key={homework.Id}
                className={`col-span-6 sm:col-span-3 md:col-span-2 flex flex-col justify-between p-4 bg-base-200 rounded-box ${
                  dayjs(homework.Date).startOf("day").valueOf() -
                    dayjs().startOf("day").valueOf() ==
                  0
                    ? `border border-primary`
                    : ``
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex flex-row gap-1 items-center justify-between">
                    <span className="text-2xl font-bold">
                      {!homeworkCategoriesLoading &&
                        !homeworkCategoriesError &&
                        homeworkCategoriesData.Categories.find(
                          (x) => x.Id == homework.Category.Id
                        )?.Name}
                    </span>
                    <span className="text-lg font-semibold">
                      {!subjectsLoading &&
                        !subjectsError &&
                        homework?.Subject?.Id &&
                        upperFirst(
                          subjectsData.Subjects.find(
                            (x) => x.Id == homework?.Subject?.Id
                          )?.Name
                        )}
                    </span>
                  </div>
                  <span>{homework.Content}</span>
                </div>
                <div className="flex flex-row justify-between items-center">
                  <span>{homework.Date}</span>
                  {dayjs(homework.Date).startOf("day").valueOf() -
                    dayjs().startOf("day").valueOf() >=
                    0 && (
                    <div className="badge badge-primary">
                      {dayjs(homework.Date).startOf("day").valueOf() -
                        dayjs().startOf("day").valueOf() ==
                      0
                        ? `Today`
                        : `In ${Math.ceil(
                            dayjs(homework.Date).diff(dayjs(), "day", true)
                          )} days`}
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
export default Exams;
