import {useQueries} from "@tanstack/react-query";
import remotePaths from "../paths.js";
import {combineResults, defineDictionary, defineResource} from "../query/resource.js";
import type {
  AnyGrade, BehaviourGradeData, BehaviourGradeTypeData, BehaviourPointCategoryData, BehaviourPointGradeData,
  DescriptiveGradeData, DescriptiveSkillData, GradeAverageData, GradeCategoryData, GradeCommentData, GradeData,
  GradeScaleData, GradeTypeData, PointGradeCategoryData, PointGradeData, PointGradeDictionaryData,
  TextGradeCategoryData, TextGradeData,
} from "../types/index.js";

const paths = remotePaths.resources;

/* Grades ---------------------------------------------------------------------------------------*/

const Grades = defineResource<GradeData[]>({name: "grades", url: paths.grades});
const PointGrades = defineResource<PointGradeData[]>({name: "pointGrades", url: paths.pointGrades});
const TextGrades = defineResource<TextGradeData[]>({name: "textGrades", url: paths.textGrades});
const DescriptiveGrades = defineResource<DescriptiveGradeData[]>({name: "descriptiveGrades", url: paths.descriptiveGrades});
const DescriptiveTextGrades = defineResource<DescriptiveGradeData[]>({name: "descriptiveTextGrades", url: paths.descriptiveTextGrades});
/** Averages computed by Librus (may be `0` when the school disabled them - use `GradeMath.average` as fallback). */
const GradeAverages = defineResource<GradeAverageData[]>({name: "gradeAverages", url: paths.gradeAverages});

/* Dictionaries --------------------------------------------------------------------------------*/

const GradeCategories = defineDictionary<GradeCategoryData>({name: "gradeCategories", url: paths.gradeCategories});
const GradeComments = defineDictionary<GradeCommentData>({name: "gradeComments", url: paths.gradeComments});
const PointGradeCategories = defineDictionary<PointGradeCategoryData>({name: "pointGradeCategories", url: paths.pointGradeCategories});
const PointGradeComments = defineDictionary<GradeCommentData>({name: "pointGradeComments", url: paths.pointGradeComments});
const TextGradeCategories = defineDictionary<TextGradeCategoryData>({name: "textGradeCategories", url: paths.textGradeCategories});
const TextGradeComments = defineDictionary<GradeCommentData>({name: "textGradeComments", url: paths.textGradeComments});
const DescriptiveGradeSkills = defineDictionary<DescriptiveSkillData>({name: "descriptiveGradeSkills", url: paths.descriptiveGradeSkills});
const DescriptiveTextGradeSkills = defineDictionary<DescriptiveSkillData>({name: "descriptiveTextGradeSkills", url: paths.descriptiveTextGradeSkills});

/** Small, static lists - fetched whole */
const GradeTypes = defineResource<GradeTypeData[]>({name: "gradeTypes", url: paths.gradeTypes, staleTime: Infinity});
const GradeScales = defineResource<GradeScaleData[]>({name: "gradeScales", url: paths.gradeScales, staleTime: Infinity});
const PointGradeDictionaries = defineResource<PointGradeDictionaryData[]>({name: "pointGradeDictionaries", url: paths.pointGradeDictionaries, staleTime: Infinity});

/**
 * Picks the dictionaries matching a grade kind - categories/comments live under different endpoints.
 * Every kind has comments (the official client builds `/<Kind>/Comments/{id}` for all of them).
 */
const gradeDictionaries = {
  grade: {categories: GradeCategories, comments: GradeComments},
  point: {categories: PointGradeCategories, comments: PointGradeComments},
  text: {categories: TextGradeCategories, comments: TextGradeComments},
} as const;

/**
 * Regular, point and text grades as one list tagged with `kind`.
 * Shares cache with `Grades.useQuery()` / `PointGrades.useQuery()` / `TextGrades.useQuery()`.
 */
const useAllGrades = () => useQueries({
  queries: [Grades.options(), PointGrades.options(), TextGrades.options()],
  combine: (results) => combineResults(results, ([grades, points, texts]): AnyGrade[] => [
    ...(grades.data ?? []).map(grade => ({...grade, kind: "grade" as const})),
    ...(points.data ?? []).map(grade => ({...grade, kind: "point" as const})),
    ...(texts.data ?? []).map(grade => ({...grade, kind: "text" as const})),
  ]),
});

/* Behaviour ------------------------------------------------------------------------------------*/

const BehaviourGrades = defineResource<BehaviourGradeData[]>({name: "behaviourGrades", url: paths.behaviourGrades});
const BehaviourGradeTypes = defineDictionary<BehaviourGradeTypeData>({name: "behaviourGradeTypes", url: paths.behaviourGradeTypes});
/** Point based behaviour - used instead of `BehaviourGrades` by some schools (see `Units` → `behaviourType`). */
const BehaviourPointGrades = defineResource<BehaviourPointGradeData[]>({name: "behaviourPointGrades", url: paths.behaviourPointGrades});
const BehaviourPointCategories = defineResource<BehaviourPointCategoryData[]>({
  name: "behaviourPointCategories",
  url: paths.behaviourPointGradeCategories,
  staleTime: Infinity,
});
const BehaviourPointComments = defineDictionary<GradeCommentData>({name: "behaviourPointComments", url: paths.behaviourPointGradeComments});

export {
  Grades, PointGrades, TextGrades, DescriptiveGrades, DescriptiveTextGrades, GradeAverages,
  GradeCategories, GradeComments, PointGradeCategories, PointGradeComments, TextGradeCategories, TextGradeComments,
  DescriptiveGradeSkills, DescriptiveTextGradeSkills, GradeTypes, GradeScales, PointGradeDictionaries,
  gradeDictionaries, useAllGrades,
  BehaviourGrades, BehaviourGradeTypes, BehaviourPointGrades, BehaviourPointCategories, BehaviourPointComments,
};
