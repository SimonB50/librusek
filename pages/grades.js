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
import {
  ChevronDown,
  ChevronUp,
  Bookmark,
  Pencil,
  Trash,
} from "react-bootstrap-icons";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";

const Grades = () => {
  // Page cache
  const [focusedSubject, setFocusedSubject] = useState(null);
  const [focusedGrade, setFocusedGrade] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedGrade, setEditedGrade] = useState(null);
  const [tmpGrades, setTmpGrades] = useState(null);
  const [tmpPoints, setTmpPoints] = useState(null);
  const tempCategories = [
    {
      Id: -1,
      Name: "Temporary (1)",
      Weight: 1,
    },
    {
      Id: -2,
      Name: "Temporary (2)",
      Weight: 2,
    },
    {
      Id: -3,
      Name: "Temporary (3)",
      Weight: 3,
    },
    {
      Id: -4,
      Name: "Temporary (4)",
      Weight: 4,
    },
    {
      Id: -5,
      Name: "Temporary (5)",
      Weight: 5,
    },
    {
      Id: -6,
      Name: "Temporary (6)",
      Weight: 6,
    },
  ];
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

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
    resetField,
  } = useForm();

  const onSubmit = (data) => {
    const doesExist = (data.gradeType == "grade" ? tmpGrades : tmpPoints).find(
      (x) => x.Id == editedGrade.Id
    );
    if (doesExist)
      (data.gradeType == "grade" ? setTmpGrades : setTmpPoints)((current) =>
        current.map((x) =>
          x.Id == editedGrade.Id
            ? {
                ...x,
                Grade: data.gradeValue,
                GradeValue: data.gradeValue,
                Category: {
                  Id: -parseInt(data.gradeWage),
                },
              }
            : x
        )
      );
    else
      (data.gradeType == "grade" ? setTmpGrades : setTmpPoints)((current) => [
        ...current,
        {
          Id: editedGrade.Id,
          Grade: data.gradeValue,
          GradeValue: data.gradeValue,
          Category: {
            Id: -parseInt(data.gradeWage),
          },
          AddDate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          Subject: {
            Id: focusedSubject,
          },
          Semester: editedGrade.Semester,
        },
      ]);
    setEditedGrade(null);
    setValue("gradeType", "select");
    resetField("gradeValue");
    resetField("gradeWage");
    document.getElementById("edit_modal").close();
  };

  return (
    <Layout>
      <dialog id="edit_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Grades simulation</h3>
          <div className="flex flex-col gap-2 py-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Type</span>
              </label>
              <select
                className="select select-bordered w-full"
                {...register("gradeType", {
                  required: {
                    value: true,
                    message: "Please select grade type",
                  },
                  validate: (value) =>
                    value != "select" || "Please select grade type",
                })}
              >
                <option value="select" disabled selected>
                  Select type
                </option>
                <option value="grade">Grade</option>
                <option value="points">Points</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {watch("gradeType") == "grade" ? "Grade" : "Points"}
                </span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                min={1}
                max={watch("gradeType") == "grade" ? 6 : 100}
                {...register("gradeValue", {
                  required: {
                    value: true,
                    message: "Please enter valid grade value",
                  },
                  min: {
                    value: 1,
                    message: "Grade value must be at least 1",
                  },
                  max: {
                    value: watch("gradeType") == "grade" ? 6 : 100,
                    message: `Grade value must be at most ${
                      watch("gradeType") == "grade" ? 6 : 100
                    }`,
                  },
                })}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Wage</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                min={1}
                max={6}
                {...register("gradeWage", {
                  required: {
                    value: true,
                    message: "Please enter valid grade wage",
                  },
                  min: {
                    value: 1,
                    message: "Grade wage must be at least 1",
                  },
                  max: {
                    value: 6,
                    message: "Grade wage must be at most 6",
                  },
                })}
              />
            </div>
          </div>
          {Object.keys(errors).length > 0 && (
            <div className="alert alert-error">
              {errors[Object.keys(errors)[0]]?.message}
            </div>
          )}
          <div className="flex flex-row items-center justify-end gap-2 mt-3">
            <button
              className="btn"
              onClick={() => {
                setEditedGrade(null);
                setValue("gradeType", "select");
                resetField("gradeValue");
                resetField("gradeWage");
                document.getElementById("edit_modal").close();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleSubmit(onSubmit)}
            >
              Save
            </button>
          </div>
        </div>
      </dialog>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <span className="text-3xl font-semibold">Grades</span>
        <div className="flex flex-row gap-2 flex-wrap w-full sm:w-fit">
          {filter == "all" ? (
            <button
              className="btn btn-primary flex-grow"
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
              className="btn flex-grow"
              onClick={() => {
                setFocusedGrade(null);
                setFocusedSubject(null);
                setFilter("all");
              }}
            >
              <Bookmark className="text-lg" /> All grades
            </button>
          )}
          {!editMode ? (
            <button
              className="btn flex-grow"
              onClick={() => {
                if (!gradesLoading && !gradesError)
                  setTmpGrades(gradesData.Grades);
                if (!pointsLoading && !pointsError)
                  setTmpPoints(pointsData.Grades);
                setEditMode(true);
              }}
            >
              <Pencil className="text-lg" /> Edit
            </button>
          ) : (
            <button
              className="btn btn-primary flex-grow"
              onClick={() => {
                setTmpGrades(null);
                setTmpPoints(null);
                setEditMode(false);
              }}
            >
              <Pencil className="text-lg" /> Cancel
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
                          ? !editMode
                            ? gradesData.Grades
                            : tmpGrades
                          : []),
                        ...(pointsData && pointsCategoriesData
                          ? !editMode
                            ? pointsData.Grades
                            : tmpPoints
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
                        ...tempCategories,
                      ]
                    )}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 w-fit mt-2">
                {!pointsLoading &&
                  !pointsError &&
                  (!editMode ? pointsData.Grades : tmpPoints)
                    .filter(
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
                  (!editMode ? gradesData.Grades : tmpGrades)
                    .filter(
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
                {editMode && semester == 1 && (
                  <button
                    className="flex items-center justify-center bg-neutral text-neutral-content w-fit p-2 font-semibold rounded-md text-center aspect-square"
                    onClick={() => {
                      setEditedGrade({
                        Id:
                          Math.max(
                            ...gradesData.Grades.map((x) => x.Id),
                            ...pointsData.Grades.map((x) => x.Id),
                            ...tmpGrades.map((x) => x.Id),
                            ...tmpPoints.map((x) => x.Id)
                          ) + 1,
                        Semester: 1,
                      });
                      document.getElementById("edit_modal").showModal();
                    }}
                  >
                    <Pencil className="text-lg" />
                  </button>
                )}
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
                              ? !editMode
                                ? gradesData.Grades
                                : tmpGrades
                              : []),
                            ...(pointsData && pointsCategoriesData
                              ? !editMode
                                ? pointsData.Grades
                                : tmpPoints
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
                            ...tempCategories,
                          ]
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 w-fit">
                    {!pointsLoading &&
                      !pointsError &&
                      (!editMode ? pointsData.Grades : tmpPoints)
                        .filter((x) => x.Subject.Id == subject.Id)
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
                      (!editMode ? gradesData.Grades : tmpGrades)
                        .filter((x) => x.Subject.Id == subject.Id)
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
                    {editMode && semester == 2 && (
                      <button
                        className="flex items-center justify-center bg-neutral text-neutral-content w-fit p-2 font-semibold rounded-md text-center aspect-square"
                        onClick={() => {
                          setEditedGrade({
                            Id:
                              Math.max(
                                ...gradesData.Grades.map((x) => x.Id),
                                ...pointsData.Grades.map((x) => x.Id),
                                ...tmpGrades.map((x) => x.Id),
                                ...tmpPoints.map((x) => x.Id)
                              ) + 1,
                            Semester: 2,
                          });
                          document.getElementById("edit_modal").showModal();
                        }}
                      >
                        <Pencil className="text-lg" />
                      </button>
                    )}
                  </div>
                </>
              )}
              {focusedSubject === subject.Id &&
                focusedGrade?.startsWith("p-") &&
                (!editMode ? pointsData.Grades : tmpPoints).find(
                  (x) =>
                    x.Id == focusedGrade.slice(2) && x.Subject.Id == subject.Id
                ) && (
                  <div className="flex flex-col gap-2 mt-2 bg-base-100 p-3 rounded-md">
                    <div className="flex flex-row gap-2 items-center">
                      <span class="text-4xl font-semibold bg-primary w-20 h-20 flex items-center justify-center text-primary-content rounded-md">
                        {Math.round(
                          parseFloat(
                            (!editMode ? pointsData.Grades : tmpPoints).find(
                              (x) => x.Id == focusedGrade.slice(2)
                            ).Grade
                          )
                        )}
                      </span>
                      <div className="flex flex-col h-max items-start justify-center">
                        <span className="text-xl font-semibold">
                          {upperFirst(
                            [
                              ...pointsCategoriesData.Categories,
                              ...tempCategories,
                            ].find(
                              (x) =>
                                x.Id ==
                                (!editMode
                                  ? pointsData.Grades
                                  : tmpPoints
                                ).find((x) => x.Id == focusedGrade.slice(2))
                                  ?.Category?.Id
                            ).Name
                          )}
                        </span>
                        <span className="text-lg">
                          {
                            (!editMode ? pointsData.Grades : tmpPoints).find(
                              (x) => x.Id == focusedGrade.slice(2)
                            ).AddDate
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg">
                        <span className="font-semibold">Weight:</span>{" "}
                        {[
                          ...pointsCategoriesData.Categories,
                          ...tempCategories,
                        ].find(
                          (x) =>
                            x.Id ==
                            (!editMode ? pointsData.Grades : tmpPoints).find(
                              (x) => x.Id == focusedGrade.slice(2)
                            )?.Category?.Id
                        ).Weight || "None"}
                      </span>
                      {!teachersLoading && !teachersError && (
                        <span className="text-lg">
                          <span className="font-semibold">Teacher:</span>{" "}
                          {teachersData.Users.find(
                            (x) =>
                              x.Id ==
                              (!editMode ? pointsData.Grades : tmpPoints).find(
                                (x) => x.Id == focusedGrade.slice(2)
                              )?.AddedBy?.Id
                          )?.FirstName || "Gallus"}{" "}
                          {teachersData.Users.find(
                            (x) =>
                              x.Id ==
                              (!editMode ? pointsData.Grades : tmpPoints).find(
                                (x) => x.Id == focusedGrade.slice(2)
                              )?.AddedBy?.Id
                          )?.LastName || "Anonymus"}
                        </span>
                      )}
                      {!pointCommentsLoading && !pointCommentsError && (
                        <span className="text-lg">
                          <span className=" font-semibold">Description:</span>{" "}
                          {pointCommentsData.Comments.find(
                            (x) =>
                              x.Id ==
                              (!editMode ? pointsData.Grades : tmpPoints).find(
                                (x) => x.Id == focusedGrade.slice(2)
                              )?.Comments?.[0]?.Id
                          )?.Text || "None"}
                        </span>
                      )}
                    </div>
                    {editMode && (
                      <div className="flex flex-row gap-2">
                        <button
                          className="btn btn-primary flex-grow sm:flex-grow-0"
                          onClick={() => {
                            setEditedGrade(
                              (!editMode ? pointsData.Grades : tmpPoints).find(
                                (x) => x.Id == focusedGrade.slice(2)
                              )
                            );
                            setValue("gradeType", "points");
                            setValue(
                              "gradeValue",
                              Math.round(
                                parseFloat(
                                  (!editMode
                                    ? pointsData.Grades
                                    : tmpPoints
                                  ).find((x) => x.Id == focusedGrade.slice(2))
                                    .GradeValue
                                )
                              )
                            );
                            setValue(
                              "gradeWage",
                              [
                                ...pointsCategoriesData.Categories,
                                ...tempCategories,
                              ].find(
                                (x) =>
                                  x.Id ==
                                  (!editMode
                                    ? pointsData.Grades
                                    : tmpPoints
                                  ).find((x) => x.Id == focusedGrade.slice(2))
                                    ?.Category?.Id
                              ).Weight
                            );
                            document.getElementById("edit_modal").showModal();
                          }}
                        >
                          <Pencil className="text-lg" /> Edit
                        </button>
                        <button
                          className="btn btn-error flex-grow sm:flex-grow-0"
                          onClick={() => {
                            setTmpPoints((current) =>
                              current.filter(
                                (x) => x.Id != focusedGrade.slice(2)
                              )
                            );
                            setFocusedGrade(null);
                          }}
                        >
                          <Trash className="text-lg" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              {focusedSubject === subject.Id &&
                focusedGrade?.startsWith("g-") &&
                (!editMode ? gradesData.Grades : tmpGrades).find(
                  (x) =>
                    x.Id == focusedGrade.slice(2) && x.Subject.Id == subject.Id
                ) && (
                  <div className="flex flex-col gap-2 mt-2 bg-base-100 p-3 rounded-md">
                    <div className="flex flex-row gap-2 items-center">
                      <span class="text-4xl font-semibold bg-primary w-20 h-20 flex items-center justify-center text-primary-content rounded-md">
                        {
                          (!editMode ? gradesData.Grades : tmpGrades).find(
                            (x) => x.Id == focusedGrade.slice(2)
                          ).Grade
                        }
                      </span>
                      <div className="flex flex-col h-max items-start justify-center">
                        <span className="text-xl font-semibold">
                          {upperFirst(
                            [
                              ...gradesCategoriesData.Categories,
                              ...tempCategories,
                            ].find(
                              (x) =>
                                x.Id ==
                                (!editMode
                                  ? gradesData.Grades
                                  : tmpGrades
                                ).find((x) => x.Id == focusedGrade.slice(2))
                                  ?.Category?.Id
                            ).Name
                          )}
                        </span>
                        <span className="text-lg">
                          {
                            (!editMode ? gradesData.Grades : tmpGrades).find(
                              (x) => x.Id == focusedGrade.slice(2)
                            ).AddDate
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg">
                        <span className="font-semibold">Weight:</span>{" "}
                        {[
                          ...gradesCategoriesData.Categories,
                          ...tempCategories,
                        ].find(
                          (x) =>
                            x.Id ==
                            (!editMode ? gradesData.Grades : tmpGrades).find(
                              (x) => x.Id == focusedGrade.slice(2)
                            )?.Category?.Id
                        ).Weight || "None"}
                      </span>
                      {!teachersLoading && !teachersError && (
                        <span className="text-lg">
                          <span className="font-semibold">Teacher:</span>{" "}
                          {teachersData.Users.find(
                            (x) =>
                              x.Id ==
                              (!editMode ? gradesData.Grades : tmpGrades).find(
                                (x) => x.Id == focusedGrade.slice(2)
                              )?.AddedBy?.Id
                          )?.FirstName || "Gallus"}{" "}
                          {teachersData.Users.find(
                            (x) =>
                              x.Id ==
                              (!editMode ? gradesData.Grades : tmpGrades).find(
                                (x) => x.Id == focusedGrade.slice(2)
                              )?.AddedBy?.Id
                          )?.LastName || "Anonymus"}
                        </span>
                      )}
                      {!gradeCommentsLoading && !gradeCommentsError && (
                        <span className="text-lg">
                          <span className=" font-semibold">Description:</span>{" "}
                          {gradeCommentsData.Comments.find(
                            (x) =>
                              x.Id ==
                              (!editMode ? gradesData.Grades : tmpGrades).find(
                                (x) => x.Id == focusedGrade.slice(2)
                              )?.Comments?.[0]?.Id
                          )?.Text || "None"}
                        </span>
                      )}
                    </div>
                    {editMode && (
                      <div className="flex flex-row gap-2">
                        <button
                          className="btn btn-primary flex-grow sm:flex-grow-0"
                          onClick={() => {
                            setEditedGrade(
                              (!editMode ? gradesData.Grades : tmpGrades).find(
                                (x) => x.Id == focusedGrade.slice(2)
                              )
                            );
                            setValue("gradeType", "grade");
                            setValue(
                              "gradeValue",
                              (!editMode ? gradesData.Grades : tmpGrades).find(
                                (x) => x.Id == focusedGrade.slice(2)
                              ).Grade
                            );
                            setValue(
                              "gradeWage",
                              [
                                ...gradesCategoriesData.Categories,
                                ...tempCategories,
                              ].find(
                                (x) =>
                                  x.Id ==
                                  (!editMode
                                    ? gradesData.Grades
                                    : tmpGrades
                                  ).find((x) => x.Id == focusedGrade.slice(2))
                                    ?.Category?.Id
                              ).Weight
                            );
                            document.getElementById("edit_modal").showModal();
                          }}
                        >
                          <Pencil className="text-lg" /> Edit
                        </button>
                        <button
                          className="btn btn-error flex-grow sm:flex-grow-0"
                          onClick={() => {
                            setTmpGrades((current) =>
                              current.filter(
                                (x) => x.Id != focusedGrade.slice(2)
                              )
                            );
                            setFocusedGrade(null);
                          }}
                        >
                          <Trash className="text-lg" /> Delete
                        </button>
                      </div>
                    )}
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
