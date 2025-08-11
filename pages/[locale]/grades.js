import Layout from "@/components/layout";

import {
  useGradeComments,
  useGrades,
  useGradesCategories,
  usePointComments,
  usePoints,
  usePointsCategories,
  useTextGrades,
} from "@/lib/grades";
import { useSubjects, useTeachers } from "@/lib/school";
import { upperFirst, calculateAverage, getSemester } from "@/lib/utils";

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
import { getStaticPaths, makeStaticProps } from "@/lib/i18n/getStatic";
import { useTranslation } from "react-i18next";

const getStaticProps = makeStaticProps(["grades", "common"]);
export { getStaticPaths, getStaticProps };

const Grades = () => {
  const { t } = useTranslation(["grades", "common"]);

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
    data: textGradesData,
    loading: textGradesLoading,
    error: textGradesError,
  } = useTextGrades();
  const {
    data: gradesCategoriesData,
    loading: gradesCategoriesLoading,
    error: gradesCategoriesError,
  } = useGradesCategories(
    gradesData && gradesData.length
      ? gradesData.map((x) => x.Category.Id).join(",")
      : false
  );
  const {
    data: pointsCategoriesData,
    loading: pointsCategoriesLoading,
    error: pointsCategoriesError,
  } = usePointsCategories(
    pointsData && pointsData.length
      ? pointsData.map((x) => x.Category.Id).join(",")
      : false
  );
  const {
    data: subjectsData,
    loading: subjectsLoading,
    error: subjectsError,
  } = useSubjects(
    (gradesData && gradesData.length) ||
      (pointsData && pointsData.length) ||
      (textGradesData && textGradesData.length)
      ? (gradesData ? gradesData.map((x) => x.Subject.Id) : [])
          .concat(pointsData ? pointsData.map((x) => x.Subject.Id) : [])
          .concat(textGradesData ? textGradesData.map((x) => x.Subject.Id) : [])
          .join(",")
      : false
  );
  const {
    data: teachersData,
    loading: teachersLoading,
    error: teachersError,
  } = useTeachers(
    (gradesData && gradesData.length) ||
      (pointsData && pointsData.length) ||
      (textGradesData && textGradesData.length)
      ? (gradesData ? gradesData.map((x) => x.AddedBy.Id) : [])
          .concat(pointsData ? pointsData.map((x) => x.AddedBy.Id) : [])
          .concat(textGradesData ? textGradesData.map((x) => x.AddedBy.Id) : [])
          .join(",")
      : false
  );
  const {
    data: gradeCommentsData,
    loading: gradeCommentsLoading,
    error: gradeCommentsError,
  } = useGradeComments(
    gradesData && gradesData.length
      ? gradesData
          .filter((x) => x.Comments)
          .map((y) => y.Comments.map((z) => z.Id))
          .flat()
          .join(",")
      : false
  );
  const {
    data: pointCommentsData,
    loading: pointCommentsLoading,
    error: pointCommentsError,
  } = usePointComments(
    pointsData && pointsData.length
      ? pointsData
          .filter((x) => x.Comments)
          .map((y) => y.Comments.map((z) => z.Id))
          .flat()
          .join(",")
      : false
  );

  const semester =
    !subjectsLoading &&
    !subjectsError &&
    getSemester(
      [
        ...(!gradesLoading && !gradesError ? gradesData : []),
        ...(!pointsLoading && !pointsError ? pointsData : []),
      ],
      subjectsData
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
                  Id: -parseInt(data.gradeWeight),
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
            Id: -parseInt(data.gradeWeight),
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
    resetField("gradeWeight");
    document.getElementById("edit_modal").close();
  };

  return (
    <Layout>
      <dialog id="edit_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">{t("simulator.editor.title")}</h3>
          <div className="flex flex-col gap-2 py-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {t("simulator.editor.type.name")}
                </span>
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
                defaultValue={"select"}
              >
                <option value="select" disabled>
                  {t("simulator.editor.type.values.select")}
                </option>
                <option value="grade">
                  {t("simulator.editor.type.values.grade")}
                </option>
                <option value="points">
                  {t("simulator.editor.type.values.points")}
                </option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {watch("gradeType") == "points"
                    ? t("simulator.editor.type.values.points")
                    : t("simulator.editor.type.values.grade")}
                </span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                min={0}
                max={watch("gradeType") == "grade" ? 6 : 100}
                {...register("gradeValue", {
                  required: {
                    value: true,
                    message: t("simulator.editor.type.errors.required", {
                      type: watch("gradeType"),
                    }),
                  },
                  min: {
                    value: 0,
                    message: t("simulator.editor.type.errors.min", {
                      type: upperFirst(watch("gradeType")),
                    }),
                  },
                  max: {
                    value: watch("gradeType") == "grade" ? 6 : 100,
                    message: t("simulator.editor.type.errors.max", {
                      type: upperFirst(watch("gradeType")),
                      max: watch("gradeType") == "grade" ? 6 : 100,
                    }),
                  },
                })}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {t("simulator.editor.weight.name")}
                </span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                min={1}
                max={6}
                {...register("gradeWeight", {
                  required: {
                    value: true,
                    message: t("simulator.editor.weight.errors.required", {
                      type: watch("gradeType"),
                    }),
                  },
                  min: {
                    value: 1,
                    message: t("simulator.editor.weight.errors.min", {
                      type: upperFirst(watch("gradeType")),
                    }),
                  },
                  max: {
                    value: 6,
                    message: t("simulator.editor.weight.errors.max", {
                      type: upperFirst(watch("gradeType")),
                    }),
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
                resetField("gradeWeight");
                document.getElementById("edit_modal").close();
              }}
            >
              {t("simulator.editor.actions.cancel")}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleSubmit(onSubmit)}
            >
              {t("simulator.editor.actions.save")}
            </button>
          </div>
        </div>
      </dialog>
      <dialog id="grade_details" class="modal modal-bottom sm:modal-middle">
        <div class="modal-box">
          <h3 className="font-bold text-2xl text-base-content mb-2">
            {t("details.title")}
          </h3>
          {gradesData && pointsData ? (
            focusedGrade?.startsWith("p-") &&
            (!editMode ? pointsData : tmpPoints).find(
              (x) => x.Id == focusedGrade.slice(2)
            ) ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2 items-center">
                  <span className="text-4xl font-semibold bg-primary w-20 h-20 flex items-center justify-center text-primary-content rounded-field">
                    {Math.round(
                      parseFloat(
                        (!editMode ? pointsData : tmpPoints).find(
                          (x) => x.Id == focusedGrade.slice(2)
                        ).Grade
                      )
                    )}
                  </span>
                  <div className="flex flex-col h-max items-start justify-center">
                    <span className="text-xl font-semibold">
                      {upperFirst(
                        [...pointsCategoriesData, ...tempCategories].find(
                          (x) =>
                            x.Id ==
                            (!editMode ? pointsData : tmpPoints).find(
                              (x) => x.Id == focusedGrade.slice(2)
                            )?.Category?.Id
                        ).Name
                      )}
                    </span>
                    <span className="text-lg">
                      {
                        (!editMode ? pointsData : tmpPoints).find(
                          (x) => x.Id == focusedGrade.slice(2)
                        ).AddDate
                      }
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg">
                    <span className="font-semibold">
                      {t("details.weight")}:
                    </span>{" "}
                    {[...pointsCategoriesData, ...tempCategories].find(
                      (x) =>
                        x.Id ==
                        (!editMode ? pointsData : tmpPoints).find(
                          (x) => x.Id == focusedGrade.slice(2)
                        )?.Category?.Id
                    ).Weight || "None"}
                  </span>
                  {!teachersLoading && !teachersError && (
                    <span className="text-lg">
                      <span className="font-semibold">
                        {t("details.teacher")}:
                      </span>{" "}
                      {teachersData.find(
                        (x) =>
                          x.Id ==
                          (!editMode ? pointsData : tmpPoints).find(
                            (x) => x.Id == focusedGrade.slice(2)
                          )?.AddedBy?.Id
                      )?.FirstName || "Gallus"}{" "}
                      {teachersData.find(
                        (x) =>
                          x.Id ==
                          (!editMode ? pointsData : tmpPoints).find(
                            (x) => x.Id == focusedGrade.slice(2)
                          )?.AddedBy?.Id
                      )?.LastName || "Anonymus"}
                    </span>
                  )}
                  {!pointCommentsLoading && !pointCommentsError && (
                    <span className="text-lg">
                      <span className=" font-semibold">
                        {t("details.comment")}:
                      </span>{" "}
                      {pointCommentsData.find(
                        (x) =>
                          x.Id ==
                          (!editMode ? pointsData : tmpPoints).find(
                            (x) => x.Id == focusedGrade.slice(2)
                          )?.Comments?.[0]?.Id
                      )?.Text || "None"}
                    </span>
                  )}
                </div>
                {editMode && (
                  <div className="flex flex-row gap-2">
                    <button
                      className="btn btn-primary grow sm:grow-0"
                      onClick={() => {
                        setEditedGrade(
                          (!editMode ? pointsData : tmpPoints).find(
                            (x) => x.Id == focusedGrade.slice(2)
                          )
                        );
                        setValue("gradeType", "points");
                        setValue(
                          "gradeValue",
                          Math.round(
                            parseFloat(
                              (!editMode ? pointsData : tmpPoints).find(
                                (x) => x.Id == focusedGrade.slice(2)
                              ).GradeValue
                            )
                          )
                        );
                        setValue(
                          "gradeWeight",
                          [...pointsCategoriesData, ...tempCategories].find(
                            (x) =>
                              x.Id ==
                              (!editMode ? pointsData : tmpPoints).find(
                                (x) => x.Id == focusedGrade.slice(2)
                              )?.Category?.Id
                          ).Weight
                        );
                        document.getElementById("edit_modal").showModal();
                      }}
                    >
                      <Pencil className="text-lg" />{" "}
                      {t("details.edit_actions.edit")}
                    </button>
                    <button
                      className="btn btn-error grow sm:grow-0"
                      onClick={() => {
                        setTmpPoints((current) =>
                          current.filter((x) => x.Id != focusedGrade.slice(2))
                        );
                        setFocusedGrade(null);
                      }}
                    >
                      <Trash className="text-lg" />{" "}
                      {t("details.edit_actions.delete")}
                    </button>
                  </div>
                )}
              </div>
            ) : focusedGrade?.startsWith("g-") &&
              (!editMode ? gradesData : tmpGrades).find(
                (x) => x.Id == focusedGrade.slice(2)
              ) ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2 items-center">
                  <span
                    className={`text-4xl font-semibold ${
                      (!editMode ? gradesData : tmpGrades).find(
                        (x) => x.Id == focusedGrade.slice(2)
                      ).IsConstituent
                        ? "bg-primary"
                        : "bg-secondary"
                    } w-20 h-20 flex items-center justify-center text-primary-content rounded-field`}
                  >
                    {
                      (!editMode ? gradesData : tmpGrades).find(
                        (x) => x.Id == focusedGrade.slice(2)
                      ).Grade
                    }
                  </span>
                  <div className="flex flex-col h-max items-start justify-center">
                    <span className="text-xl font-semibold">
                      {upperFirst(
                        [...gradesCategoriesData, ...tempCategories].find(
                          (x) =>
                            x.Id ==
                            (!editMode ? gradesData : tmpGrades).find(
                              (x) => x.Id == focusedGrade.slice(2)
                            )?.Category?.Id
                        ).Name
                      )}
                    </span>
                    <span className="text-lg">
                      {
                        (!editMode ? gradesData : tmpGrades).find(
                          (x) => x.Id == focusedGrade.slice(2)
                        ).AddDate
                      }
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  {(!editMode ? gradesData : tmpGrades).find(
                    (x) => x.Id == focusedGrade.slice(2)
                  ).IsConstituent && (
                    <span className="text-lg">
                      <span className="font-semibold">
                        {t("details.weight")}:
                      </span>{" "}
                      {[...gradesCategoriesData, ...tempCategories].find(
                        (x) =>
                          x.Id ==
                          (!editMode ? gradesData : tmpGrades).find(
                            (x) => x.Id == focusedGrade.slice(2)
                          )?.Category?.Id
                      ).Weight || "None"}
                    </span>
                  )}
                  {!teachersLoading && !teachersError && (
                    <span className="text-lg">
                      <span className="font-semibold">
                        {t("details.teacher")}:
                      </span>{" "}
                      {teachersData.find(
                        (x) =>
                          x.Id ==
                          (!editMode ? gradesData : tmpGrades).find(
                            (x) => x.Id == focusedGrade.slice(2)
                          )?.AddedBy?.Id
                      )?.FirstName || "Gallus"}{" "}
                      {teachersData.find(
                        (x) =>
                          x.Id ==
                          (!editMode ? gradesData : tmpGrades).find(
                            (x) => x.Id == focusedGrade.slice(2)
                          )?.AddedBy?.Id
                      )?.LastName || "Anonymus"}
                    </span>
                  )}
                  {!gradeCommentsLoading && !gradeCommentsError && (
                    <span className="text-lg">
                      <span className=" font-semibold">
                        {t("details.comment")}:
                      </span>{" "}
                      {gradeCommentsData.find(
                        (x) =>
                          x.Id ==
                          (!editMode ? gradesData : tmpGrades).find(
                            (x) => x.Id == focusedGrade.slice(2)
                          )?.Comments?.[0]?.Id
                      )?.Text || "None"}
                    </span>
                  )}
                </div>
                {editMode && (
                  <div className="flex flex-row gap-2">
                    <button
                      className="btn btn-primary grow sm:grow-0"
                      onClick={() => {
                        setEditedGrade(
                          (!editMode ? gradesData : tmpGrades).find(
                            (x) => x.Id == focusedGrade.slice(2)
                          )
                        );
                        setValue("gradeType", "grade");
                        setValue(
                          "gradeValue",
                          (!editMode ? gradesData : tmpGrades).find(
                            (x) => x.Id == focusedGrade.slice(2)
                          ).Grade
                        );
                        setValue(
                          "gradeWeight",
                          [...gradesCategoriesData, ...tempCategories].find(
                            (x) =>
                              x.Id ==
                              (!editMode ? gradesData : tmpGrades).find(
                                (x) => x.Id == focusedGrade.slice(2)
                              )?.Category?.Id
                          ).Weight
                        );
                        document.getElementById("edit_modal").showModal();
                      }}
                    >
                      <Pencil className="text-lg" />{" "}
                      {t("details.edit_actions.edit")}
                    </button>
                    <button
                      className="btn btn-error grow sm:grow-0"
                      onClick={() => {
                        setTmpGrades((current) =>
                          current.filter((x) => x.Id != focusedGrade.slice(2))
                        );
                        setFocusedGrade(null);
                      }}
                    >
                      <Trash className="text-lg" />{" "}
                      {t("details.edit_actions.delete")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-lg">{t("details.invalid")}</span>
            )
          ) : (
            <div className="skeleton h-24"></div>
          )}
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <span className="text-3xl font-semibold">{t("title")}</span>
        <div className="flex flex-row gap-2 flex-wrap w-full sm:w-fit">
          {filter == "all" ? (
            <button
              className="btn btn-primary grow"
              onClick={() => {
                setFocusedGrade(null);
                setFocusedSubject(null);
                setFilter("latest");
              }}
            >
              <Bookmark className="text-lg" /> {t("filter.latest")}
            </button>
          ) : (
            <button
              className="btn grow"
              onClick={() => {
                setFocusedGrade(null);
                setFocusedSubject(null);
                setFilter("all");
              }}
            >
              <Bookmark className="text-lg" /> {t("filter.all")}
            </button>
          )}
          {!editMode ? (
            <button
              className="btn grow"
              onClick={() => {
                if (!gradesLoading && !gradesError) setTmpGrades(gradesData);
                if (!pointsLoading && !pointsError) setTmpPoints(pointsData);
                setEditMode(true);
              }}
            >
              <Pencil className="text-lg" /> {t("simulator.enable")}
            </button>
          ) : (
            <button
              className="btn btn-primary grow"
              onClick={() => {
                setTmpGrades(null);
                setTmpPoints(null);
                setEditMode(false);
              }}
            >
              <Pencil className="text-lg" /> {t("simulator.disable")}
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-3">
        {!subjectsLoading && !subjectsError ? (
          subjectsData.map((subject) => (
            <div
              key={subject.Id}
              className="flex flex-col p-4 bg-base-200 border border-base-300 rounded-box cursor-pointer"
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
                  <span className="text-lg font-bold">
                    {t("common.school.semester", {
                      ns: "common",
                      semester: "I",
                    })}
                  </span>
                  <span className="text-base">
                    {t("average")}:{" "}
                    {calculateAverage(
                      [
                        ...(gradesData && gradesCategoriesData
                          ? !editMode
                            ? gradesData
                            : tmpGrades
                          : []),
                        ...(pointsData && pointsCategoriesData
                          ? !editMode
                            ? pointsData
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
                          ? gradesCategoriesData
                          : []),
                        ...(pointsData && pointsCategoriesData
                          ? pointsCategoriesData
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
                  (!editMode ? pointsData : tmpPoints)
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
                        className="bg-primary text-primary-content w-fit p-2 font-semibold rounded-field text-center aspect-square"
                        onClick={() => {
                          setFocusedGrade(`p-${point.Id}`);
                          document.getElementById("grade_details").showModal();
                        }}
                      >
                        {Math.round(parseFloat(point.Grade))}
                      </button>
                    ))}
                {!gradesLoading &&
                  !gradesError &&
                  (!editMode ? gradesData : tmpGrades)
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
                        className={`${
                          grade.IsConstituent ? "bg-primary" : "bg-secondary"
                        } text-primary-content w-fit p-2 font-semibold rounded-field text-center aspect-square`}
                        onClick={() => {
                          setFocusedGrade(`g-${grade.Id.toString()}`);
                          document.getElementById("grade_details").showModal();
                        }}
                      >
                        {grade.Grade}
                      </button>
                    ))}
                {editMode && (
                  <button
                    className="flex items-center justify-center bg-neutral text-neutral-content w-fit p-2 font-semibold rounded-field text-center aspect-square"
                    onClick={() => {
                      setEditedGrade({
                        Id:
                          Math.max(
                            ...gradesData.map((x) => x.Id),
                            ...pointsData.map((x) => x.Id),
                            ...tmpGrades.map((x) => x.Id),
                            ...tmpPoints.map((x) => x.Id)
                          ) + 1,
                        Semester: focusedSubject != subject.Id ? semester : 1,
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
                      <span className="text-lg font-bold">
                        {t("common.school.semester", {
                          ns: "common",
                          semester: "II",
                        })}
                      </span>
                      <span className="text-base">
                        {t("average")}:{" "}
                        {calculateAverage(
                          [
                            ...(gradesData && gradesCategoriesData
                              ? !editMode
                                ? gradesData
                                : tmpGrades
                              : []),
                            ...(pointsData && pointsCategoriesData
                              ? !editMode
                                ? pointsData
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
                              ? gradesCategoriesData
                              : []),
                            ...(pointsData && pointsCategoriesData
                              ? pointsCategoriesData
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
                      (!editMode ? pointsData : tmpPoints)
                        .filter((x) => x.Subject.Id == subject.Id)
                        .sort((a, b) => dayjs(b.AddDate) - dayjs(a.AddDate))
                        .filter((x) => x.Semester == 2)
                        .map((point) => (
                          <button
                            key={point.Id}
                            className="bg-primary text-primary-content w-fit p-2 font-semibold rounded-field text-center aspect-square"
                            onClick={() => {
                              setFocusedGrade(`p-${point.Id}`);
                              document
                                .getElementById("grade_details")
                                .showModal();
                            }}
                          >
                            {Math.round(parseFloat(point.Grade))}
                          </button>
                        ))}
                    {!gradesLoading &&
                      !gradesError &&
                      (!editMode ? gradesData : tmpGrades)
                        .filter((x) => x.Subject.Id == subject.Id)
                        .sort((a, b) => dayjs(b.AddDate) - dayjs(a.AddDate))
                        .filter((x) => x.Semester == 2)
                        .map((grade) => (
                          <button
                            key={grade.Id}
                            className={`${
                              grade.IsConstituent
                                ? "bg-primary"
                                : "bg-secondary"
                            } text-primary-content w-fit p-2 font-semibold rounded-field text-center aspect-square`}
                            onClick={() => {
                              setFocusedGrade(`g-${grade.Id.toString()}`);
                              document
                                .getElementById("grade_details")
                                .showModal();
                            }}
                          >
                            {grade.Grade}
                          </button>
                        ))}
                    {editMode && semester == 2 && (
                      <button
                        className="flex items-center justify-center bg-neutral text-neutral-content w-fit p-2 font-semibold rounded-field text-center aspect-square"
                        onClick={() => {
                          setEditedGrade({
                            Id:
                              Math.max(
                                ...gradesData.map((x) => x.Id),
                                ...pointsData.map((x) => x.Id),
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
              {focusedSubject === subject.Id && (
                <div className="flex flex-col my-2">
                  <span className="text-lg font-bold">
                    {t("common.summary", { ns: "common" })}
                  </span>
                  <span className="text-base">
                    {t("average")}:{" "}
                    {calculateAverage(
                      [
                        ...(gradesData && gradesCategoriesData
                          ? !editMode
                            ? gradesData
                            : tmpGrades
                          : []),
                        ...(pointsData && pointsCategoriesData
                          ? !editMode
                            ? pointsData
                            : tmpPoints
                          : []),
                      ].filter(
                        (x) =>
                          focusedSubject == x.Subject.Id &&
                          (filter == "all" ||
                            dayjs(x.AddDate).isAfter(
                              dayjs().subtract(1, "day")
                            )) &&
                          !x.IsSemester &&
                          !x.IsSemesterProposition &&
                          !x.IsFinal &&
                          !x.IsFinalProposition
                      ),
                      [
                        ...(gradesData && gradesCategoriesData
                          ? gradesCategoriesData
                          : []),
                        ...(pointsData && pointsCategoriesData
                          ? pointsCategoriesData
                          : []),
                        ...tempCategories,
                      ]
                    )}
                  </span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="skeleton h-24"></div>
        )}
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <span className="text-3xl font-semibold">{t("text_grades.title")}</span>
        <div className="flex flex-col gap-2">
          {!textGradesLoading && !textGradesError ? (
            textGradesData && textGradesData.length ? (
              textGradesData.map((textGrade) => (
                <div
                  key={textGrade.Id}
                  className="flex flex-col gap-1 rounded-box p-4 bg-base-200 border border-base-300 justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-xl font-semibold">
                      {upperFirst(
                        !subjectsLoading &&
                          !subjectsError &&
                          subjectsData.find((x) => x.Id == textGrade.Subject.Id)
                            ?.Name
                      )}
                    </span>
                    <span className="text-md">
                      {upperFirst(textGrade.Grade)}
                    </span>
                  </div>
                  {!teachersLoading && !teachersError && (
                    <span className="text-sm text-primary">
                      {t("text_grades.added_by", {
                        teacher: `${upperFirst(
                          teachersData.find((x) => x.Id == textGrade.AddedBy.Id)
                            ?.FirstName || "Gallus"
                        )} ${upperFirst(
                          teachersData.find((x) => x.Id == textGrade.AddedBy.Id)
                            ?.LastName || "Anonymus"
                        )}`,
                        date: textGrade.Date,
                      })}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <span className="text-lg">{t("text_grades.empty")}</span>
            )
          ) : (
            <div className="skeleton h-24"></div>
          )}
        </div>
      </div>
    </Layout>
  );
};
export default Grades;
