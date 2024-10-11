import { useHomeworks, useHomeworksCategories } from "@/lib/timetable";
import Layout from "../components/layout";
import { useState } from "react";
import { upperFirst, sortTasks } from "@/lib/utils";
import { useSubjects } from "@/lib/school";

const Exams = () => {
  // User info
  const [userData, setUserData] = useState(null);

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
  } = useSubjects();
  const {
    data: homeworkCategoriesData,
    loading: homeworkCategoriesLoading,
    error: homeworkCategoriesError,
  } = useHomeworksCategories(
    [
      ...(!homeworkLoading && !homeworkError ? homeworkData.HomeWorks.map(x => x.Category.Id) : []),
    ].join(","),
  );

  return (
    <Layout setAuthData={setUserData}>
      <span className="text-3xl font-semibold mb-4">Exams</span>
      <div className="grid grid-cols-6 gap-2 mt-4">
        {!homeworkLoading && !homeworkError
          ? sortTasks(homeworkData.HomeWorks).map((homework) => (
              <div
                key={homework.Id}
                className={`col-span-6 sm:col-span-3 md:col-span-2 flex flex-col justify-between p-4 bg-base-200 rounded-box ${
                  Math.ceil(
                    (new Date(homework.Date) - new Date()) /
                      (1000 * 60 * 60 * 24)
                  ) == 0
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
                  {Math.ceil(
                    (new Date(homework.Date) - new Date()) /
                      (1000 * 60 * 60 * 24)
                  ) >= 0 && (
                    <div className="badge badge-primary">
                      {Math.ceil(
                        (new Date(homework.Date) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      ) == 0
                        ? `Today`
                        : `In ${Math.ceil(
                            (new Date(homework.Date) - new Date()) /
                              (1000 * 60 * 60 * 24)
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
