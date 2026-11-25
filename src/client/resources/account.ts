import remotePaths from "../paths.js";
import {defineDictionary, defineResource} from "../query/resource.js";
import {MINUTE} from "../query/client.js";
import type {
  AccessibilitySettingsData, AccountData, ExamResultData, NoteCategoryData, NoteData, NotificationCenterData,
  NotificationDeferralData, PhotoData, SchoolModuleAccessData, SchoolYearData, StudentDutyData, SurveyData,
} from "../types/index.js";

const paths = remotePaths.resources;

/** Logged-in account - used by the layout header, home page, profile... */
const Me = defineResource<AccountData>({name: "me", url: paths.me, staleTime: 10 * MINUTE});

/** Current school year, e.g. `2026` */
const SchoolYear = defineResource<SchoolYearData>({
  name: "schoolYear",
  url: paths.schoolInfo,
  request: () => ({envelope: "SchoolYear"}),
  staleTime: Infinity,
});

/** Modules enabled for the school - check before showing surveys, eUsprawiedliwienia etc. */
const SchoolModuleAccess = defineResource<SchoolModuleAccessData[]>({
  name: "schoolModuleAccess",
  url: paths.schoolModuleAccess,
  staleTime: Infinity,
});

/** ID card photo status */
const Photo = defineResource<PhotoData>({name: "photo", url: paths.photo, staleTime: 30 * MINUTE});

/** Remarks ("uwagi"). Old app fell back to messages (category `1,6`) when this endpoint failed. */
const Notes = defineResource<NoteData[]>({name: "notes", url: paths.notes});
const NoteCategories = defineDictionary<NoteCategoryData>({name: "noteCategories", url: paths.noteCategories});

/*
 * Per-account resources - pass ids from `Me`:
 * `const {data: me} = Me.useQuery();`
 * `Surveys.useQuery({accountId: me?.account.id ?? 0}, {enabled: !!me})`
 */

interface AccountParams {
  /** `Me.account.id` */
  accountId: number;
}

interface UserParams {
  /** `Me.account.userId` */
  userId: number;
}

const Surveys = defineResource<SurveyData[], AccountParams>({
  name: "surveys",
  url: ({accountId}) => paths.surveys(accountId),
  request: () => ({envelope: "data"}),
});
const NotificationDeferrals = defineResource<NotificationDeferralData[], AccountParams>({
  name: "notificationDeferrals",
  url: ({accountId}) => paths.notificationDeferrals(accountId),
  request: () => ({envelope: "data"}),
});
const AccessibilitySettings = defineResource<AccessibilitySettingsData, AccountParams>({
  name: "accessibilitySettings",
  url: ({accountId}) => paths.accessibilitySettings(accountId),
  request: () => ({envelope: "data"}),
  staleTime: Infinity,
});
const StudentDuties = defineResource<StudentDutyData[], UserParams>({
  name: "studentDuties",
  url: ({userId}) => paths.studentDuties(userId),
  request: () => ({envelope: "data"}),
});
const ExamResults = defineResource<ExamResultData[], UserParams>({
  name: "examResults",
  url: ({userId}) => paths.examResults(userId),
  request: () => ({envelope: "data"}),
  staleTime: Infinity,
});

/** Answers 500 for some accounts - prefer per-module resources. */
const NotificationCenter = defineResource<NotificationCenterData>({name: "notificationCenter", url: paths.notificationCenter});

export {
  Me, SchoolYear, SchoolModuleAccess, Photo, Notes, NoteCategories, NotificationCenter,
  Surveys, NotificationDeferrals, AccessibilitySettings, StudentDuties, ExamResults,
};
export type {AccountParams, UserParams};
