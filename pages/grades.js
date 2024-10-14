import Layout from "@/components/layout";

import {
  useGradeComments,
  useGrades,
  useGradesCategories,
  usePointComments,
  usePoints,
  usePointsCategories,
} from "@/lib/grades";
import { useSubjects, useTeachers } from "@/lib/school";
import {
  upperFirst,
  calculateAvarage,
  getSemester,
  deduplicate,
} from "@/lib/utils";

import { useState } from "react";
import { ChevronDown, ChevronUp, Bookmark } from "react-bootstrap-icons";
import dayjs from "dayjs";

const Grades = () => {
  // Page cache
  const [focusedSubject, setFocusedSubject] = useState(null);
  const [focusedGrade, setFocusedGrade] = useState(null);
  const [filter, setFilter] = useState("all");

  // Grades data
  const {
    data: gradesData,
    loading: gradesLoading,
    error: gradesError,
  } = useGrades();
  const {
    data: pointsData,
    loading: pointsLoading,
    error: pointsError,
  } = usePoints();
  const {
    data: gradesCategoriesData,
    loading: gradesCategoriesLoading,
    error: gradesCategoriesError,
  } = useGradesCategories(
    deduplicate([
      ...(gradesData ? gradesData.Grades.map((x) => x.Category.Id) : []),
    ]).join(",")
  );
  const {
    data: pointsCategoriesData,
    loading: pointsCategoriesLoading,
    error: pointsCategoriesError,
  } = usePointsCategories(
    deduplicate([
      ...(pointsData ? pointsData.Grades.map((x) => x.Category.Id) : []),
    ]).join(",")
  );
  const {
    data: subjectsData,
    loading: subjectsLoading,
    error: subjectsError,
  } = useSubjects(
    deduplicate([
      ...(gradesData ? gradesData.Grades.map((x) => x.Subject.Id) : []),
      ...(pointsData ? pointsData.Grades.map((x) => x.Subject.Id) : []),
    ]).join(",")
  );
  const {
    data: teachersData,
    loading: teachersLoading,
    error: teachersError,
  } = useTeachers(
    deduplicate([
      ...(gradesData ? gradesData.Grades.map((x) => x.AddedBy.Id) : []),
      ...(pointsData ? pointsData.Grades.map((x) => x.AddedBy.Id) : []),
    ]).join(",")
  );
  const {
    data: gradeCommentsData,
    loading: gradeCommentsLoading,
    error: gradeCommentsError,
  } = useGradeComments(
    deduplicate([
      ...(gradesData
        ? gradesData.Grades.filter((x) => x.Comments)
            .map((y) => y.Comments.map((z) => z.Id))
            .flat()
        : []),
    ]).join(",")
  );
  const {
    data: pointCommentsData,
    loading: pointCommentsLoading,
    error: pointCommentsError,
  } = usePointComments(
    deduplicate([
      ...(pointsData
        ? pointsData.Grades.filter((x) => x.Comments)
            .map((y) => y.Comments.map((z) => z.Id))
            .flat()
        : []),
    ]).join(",")
  );

  const semester =
    !subjectsLoading &&
    !subjectsError &&
    getSemester(
      [
        ...(!gradesLoading && !gradesError ? gradesData.Grades : []),
        ...(!pointsLoading && !pointsError ? pointsData.Grades : []),
      ],
      subjectsData.Subjects
    );

  return (
    <Layout>
      <div className="flex flex-row justify-between items-center">
        <span className="text-3xl font-semibold">Grades</span>
        <div className="flex flex-row gap-2">
          {filter == "all" ? (
            <button
              className="btn btn-primary"
              onClick={() => {
                setFocusedGrade(null);
                setFocusedSubject(null);
                setFilter("latest");
              }}
            >
              <Bookmark className="text-lg" /> Latest grades
            </button>
          ) : (
            <button
              className="btn"
              onClick={() => {
                setFocusedGrade(null);
                setFocusedSubject(null);
                setFilter("all");
              }}
            >
              <Bookmark className="text-lg" /> All grades
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-3">
        {!subjectsLoading && !subjectsError ? (
          subjectsData.Subjects.map((subject) => (
            <div
              key={subject.Id}
              className="flex flex-col p-4 bg-base-200 rounded-box cursor-pointer"
              onClick={() => {
                if (focusedSubject === subject.Id) return;
                setFocusedSubject(subject.Id);
              }}
            >
              <div
                className="flex flex-row justify-between items-center"
                onClick={() => {
                  if (focusedSubject === subject.Id) setFocusedSubject(null);
                }}
              >
                <span className="text-2xl font-bold">
                  {upperFirst(subject.Name)}
                </span>
                {focusedSubject === subject.Id ? (
                  <ChevronUp className="text-xl" />
                ) : (
                  <ChevronDown className="text-xl" />
                )}
              </div>
              {focusedSubject === subject.Id && (
                <div className="flex flex-col mt-2">
                  <span className="text-lg font-bold">Semester I</span>
                  <span className="text-base">
                    Average:{" "}
                    {calculateAvarage(
                      [
                        ...(gradesData && gradesCategoriesData
                          ? gradesData.Grades
                          : []),
                        ...(pointsData && pointsCategoriesData
                          ? pointsData.Grades
                          : []),
                      ].filter(
                        (x) =>
                          focusedSubject == x.Subject.Id &&
                          (filter == "all" ||
                            dayjs(x.AddDate).isAfter(
                              dayjs().subtract(1, "day")
                            )) &&
                          x.Semester == 1 &&
                          !x.IsSemester &&
                          !x.IsSemesterProposition &&
                          !x.IsFinal &&
                          !x.IsFinalProposition
                      ),
                      [
                        ...(gradesData && gradesCategoriesData
                          ? gradesCategoriesData.Categories
                          : []),
                        ...(pointsData && pointsCategoriesData
                          ? pointsCategoriesData.Categories
                          : []),
                      ]
                    )}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 w-fit mt-2">
                {!pointsLoading &&
                  !pointsError &&
                  pointsData.Grades.filter(
                    (x) =>
                      x.Subject.Id == subject.Id &&
                      (filter == "all" ||
                        dayjs(x.AddDate).isAfter(dayjs().subtract(1, "day")))
                  )
                    .filter(
                      (x) =>
                        (focusedSubject != subject.Id &&
                          x.Semester == semester) ||
                        (focusedSubject == subject.Id && x.Semester == 1)
                    )
                    .sort((a, b) => dayjs(b.AddDate) - dayjs(a.AddDate))

                    .map((point) => (
                      <button
                        key={point.Id}
                        className="bg-primary text-primary-content w-fit p-2 font-semibold rounded-md text-center aspect-square"
                        onClick={() => setFocusedGrade(`p-${point.Id}`)}
                      >
                        {Math.round(parseFloat(point.Grade))}
                      </button>
                    ))}
                {!gradesLoading &&
                  !gradesError &&
                  gradesData.Grades.filter(
                    (x) =>
                      x.Subject.Id == subject.Id &&
                      (filter == "all" ||
                        dayjs(x.AddDate).isAfter(dayjs().subtract(1, "day")))
                  )
                    .sort((a, b) => dayjs(b.AddDate) - dayjs(a.AddDate))
                    .filter(
                      (x) =>
                        (focusedSubject != subject.Id &&
                          x.Semester == semester) ||
                        (focusedSubject == subject.Id && x.Semester == 1)
                    )
                    .map((grade) => (
                      <button
                        key={grade.Id}
                        className="bg-primary text-primary-content w-fit p-2 font-semibold rounded-md text-center aspect-square"
                        onClick={() => {
                          setFocusedGrade(`g-${grade.Id.toString()}`);
                        }}
                      >
                        {grade.Grade}
                      </button>
                    ))}
              </div>
              {focusedSubject === subject.Id && semester == 2 && (
                <>
                  <div className="flex flex-col mt-2">
                    <div className="flex flex-col my-2">
                      <span className="text-lg font-bold">Semester II</span>
                      <span className="text-base">
                        Average:{" "}
                        {calculateAvarage(
                          [
                            ...(gradesData && gradesCategoriesData
                              ? gradesData.Grades
                              : []),
                            ...(pointsData && pointsCategoriesData
                              ? pointsData.Grades
                              : []),
                          ].filter(
                            (x) =>
                              focusedSubject == x.Subject.Id &&
                              (filter == "all" ||
                                dayjs(x.AddDate).isAfter(
                                  dayjs().subtract(1, "day")
                                )) &&
                              x.Semester == 2 &&
                              !x.IsSemester &&
                              !x.IsSemesterProposition &&
                              !x.IsFinal &&
                              !x.IsFinalProposition
                          ),
                          [
                            ...(gradesData && gradesCategoriesData
                              ? gradesCategoriesData.Categories
                              : []),
                            ...(pointsData && pointsCategoriesData
                              ? pointsCategoriesData.Categories
                              : []),
                          ]
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 w-fit">
                    {!pointsLoading &&
                      !pointsError &&
                      pointsData.Grades.filter(
                        (x) => x.Subject.Id == subject.Id
                      )
                        .sort((a, b) => dayjs(b.AddDate) - dayjs(a.AddDate))
                        .filter((x) => x.Semester == 2)
                        .map((point) => (
                          <button
                            key={point.Id}
                            className="bg-primary text-primary-content w-fit p-2 font-semibold rounded-md text-center aspect-square"
                            onClick={() => setFocusedGrade(`p-${point.Id}`)}
                          >
                            {Math.round(parseFloat(point.Grade))}
                          </button>
                        ))}
                    {!gradesLoading &&
                      !gradesError &&
                      gradesData.Grades.filter(
                        (x) => x.Subject.Id == subject.Id
                      )
                        .sort((a, b) => dayjs(b.AddDate) - dayjs(a.AddDate))
                        .filter((x) => x.Semester == 2)
                        .map((grade) => (
                          <button
                            key={grade.Id}
                            className="bg-primary text-primary-content w-fit p-2 font-semibold rounded-md text-center aspect-square"
                            onClick={() => {
                              setFocusedGrade(`g-${grade.Id.toString()}`);
                            }}
                          >
                            {grade.Grade}
                          </button>
                        ))}
                  </div>
                </>
              )}
              {focusedSubject === subject.Id &&
                focusedGrade?.startsWith("p-") &&
                pointsData.Grades.find(
                  (x) =>
                    x.Id == focusedGrade.slice(2) && x.Subject.Id == subject.Id
                ) && (
                  <div className="flex flex-col gap-2 mt-2 bg-base-100 p-3 rounded-md">
                    <div className="flex flex-row gap-2 items-center">
                      <span class="text-4xl font-semibold bg-primary w-20 h-20 flex items-center justify-center text-primary-content rounded-md">
                        {Math.round(
                          parseFloat(
                            pointsData.Grades.find(
                              (x) => x.Id == focusedGrade.slice(2)
                            ).Grade
                          )
                        )}
                      </span>
                      <div className="flex flex-col h-max items-start justify-center">
                        <span className="text-xl font-semibold">
                          {upperFirst(
                            pointsCategoriesData.Categories.find(
                              (x) =>
                                x.Id ==
                                pointsData.Grades.find(
                                  (x) => x.Id == focusedGrade.slice(2)
                                )?.Category?.Id
                            ).Name
                          )}
                        </span>
                        <span className="text-lg">
                          {
                            pointsData.Grades.find(
                              (x) => x.Id == focusedGrade.slice(2)
                            ).AddDate
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg">
                        <span className="font-semibold">Weight:</span>{" "}
                        {
                          pointsCategoriesData.Categories.find(
                            (x) =>
                              x.Id ==
                              pointsData.Grades.find(
                                (x) => x.Id == focusedGrade.slice(2)
                              )?.Category?.Id
                          ).Weight
                        }
                      </span>
                      {!teachersLoading && !teachersError && (
                        <span className="text-lg">
                          <span className="font-semibold">Teacher:</span>{" "}
                          {
                            teachersData.Users.find(
                              (x) =>
                                x.Id ==
                                pointsData.Grades.find(
                                  (x) => x.Id == focusedGrade.slice(2)
                                )?.AddedBy?.Id
                            ).FirstName
                          }{" "}
                          {
                            teachersData.Users.find(
                              (x) =>
                                x.Id ==
                                pointsData.Grades.find(
                                  (x) => x.Id == focusedGrade.slice(2)
                                )?.AddedBy?.Id
                            ).LastName
                          }
                        </span>
                      )}
                      {!pointCommentsLoading && !pointCommentsError && (
                        <span className="text-lg">
                          <span className=" font-semibold">Description:</span>{" "}
                          {pointCommentsData.Comments.find(
                            (x) =>
                              x.Id ==
                              pointsData.Grades.find(
                                (x) => x.Id == focusedGrade.slice(2)
                              )?.Comments?.[0]?.Id
                          )?.Text || "None"}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              {focusedSubject === subject.Id &&
                focusedGrade?.startsWith("g-") &&
                gradesData.Grades.find(
                  (x) =>
                    x.Id == focusedGrade.slice(2) && x.Subject.Id == subject.Id
                ) && (
                  <div className="flex flex-col gap-2 mt-2 bg-base-100 p-3 rounded-md">
                    <div className="flex flex-row gap-2 items-center">
                      <span class="text-4xl font-semibold bg-primary w-20 h-20 flex items-center justify-center text-primary-content rounded-md">
                        {
                          gradesData.Grades.find(
                            (x) => x.Id == focusedGrade.slice(2)
                          ).Grade
                        }
                      </span>
                      <div className="flex flex-col h-max items-start justify-center">
                        <span className="text-xl font-semibold">
                          {upperFirst(
                            gradesCategoriesData.Categories.find(
                              (x) =>
                                x.Id ==
                                gradesData.Grades.find(
                                  (x) => x.Id == focusedGrade.slice(2)
                                )?.Category?.Id
                            ).Name
                          )}
                        </span>
                        <span className="text-lg">
                          {
                            gradesData.Grades.find(
                              (x) => x.Id == focusedGrade.slice(2)
                            ).AddDate
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg">
                        <span className="font-semibold">Weight:</span>{" "}
                        {
                          gradesCategoriesData.Categories.find(
                            (x) =>
                              x.Id ==
                              gradesData.Grades.find(
                                (x) => x.Id == focusedGrade.slice(2)
                              )?.Category?.Id
                          ).Weight
                        }
                      </span>
                      {!teachersLoading && !teachersError && (
                        <span className="text-lg">
                          <span className="font-semibold">Teacher:</span>{" "}
                          {
                            teachersData.Users.find(
                              (x) =>
                                x.Id ==
                                gradesData.Grades.find(
                                  (x) => x.Id == focusedGrade.slice(2)
                                )?.AddedBy?.Id
                            ).FirstName
                          }{" "}
                          {
                            teachersData.Users.find(
                              (x) =>
                                x.Id ==
                                gradesData.Grades.find(
                                  (x) => x.Id == focusedGrade.slice(2)
                                )?.AddedBy?.Id
                            ).LastName
                          }
                        </span>
                      )}
                      {!gradeCommentsLoading && !gradeCommentsError && (
                        <span className="text-lg">
                          <span className=" font-semibold">Description:</span>{" "}
                          {gradeCommentsData.Comments.find(
                            (x) =>
                              x.Id ==
                              pointsData.Grades.find(
                                (x) => x.Id == focusedGrade.slice(2)
                              )?.Comments?.[0]?.Id
                          )?.Text || "None"}
                        </span>
                      )}
                    </div>
                  </div>
                )}
            </div>
          ))
        ) : (
          <div className="skeleton h-24"></div>
        )}
      </div>
    </Layout>
  );
};
export default Grades;
