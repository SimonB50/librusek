import type {DateString, Entity, Ref} from "./common.js";

/** `GET /Me` */
interface AccountData {
  account: {
    id: number;
    userId: number;
    email: string;
    firstName: string;
    lastName: string;
    login: string;
    groupId: number;
    isActive: boolean;
    isPremium: boolean;
    isPremiumDemo: boolean;
    premiumAddons: unknown[];
    expiredPremiumDate: number;
  };
  class: Ref;
  refresh: number;
  user: {
    firstName: string;
    lastName: string;
  };
}

/** `GET /Users/{ids}` - teachers, staff and other users referenced by `addedBy`, `teacher` etc. */
interface UserData extends Entity {
  /** `null` for some accounts (e.g. system users) */
  firstName: string | null;
  lastName: string;
  accountId: string;
  accountNumericIdentifier: number;
  isEmployee: boolean;
  isSchoolAdministrator: boolean;
  groupId: number;
}

/** `GET /Notes` - remarks (uwagi) */
interface NoteData extends Entity {
  text: string;
  date: DateString;
  teacher: Ref;
  student: Ref;
  /** `0` negative, `1` positive (verified on live data, the old app used it as a boolean), `2` presumably neutral (unverified) */
  positive: NotePositivity;
  public: boolean;
  category?: Ref;
}

type NotePositivity = 0 | 1 | 2;

/** `GET /Notes/Categories` - empty for the tested account; the official client reads `Id` + `CategoryName`. */
interface NoteCategoryData extends Entity {
  categoryName: string;
}

/** `GET /Auth/SchoolInfo` - unwrapped `SchoolYear` (e.g. `2026`) */
type SchoolYearData = number;

/** `GET /Auth/SchoolModuleAccess` - modules enabled for the school (surveys, homeworks, eUsprawiedliwienia...) */
interface SchoolModuleAccessData {
  identifier: number;
  name: string;
}

/** `GET /Auth/Photos` - student ID card photo */
interface PhotoData {
  status: string;
  photo: unknown | null;
  awaitingPhoto: unknown | null;
}

/** `GET /Surveys/{accountId}` (envelope `data`) - empty for the tested account, shape unknown */
type SurveyData = Record<string, unknown>;

/** `GET /NotificationCenterDeferrals/{accountId}` - postponed notification-center prompts (empty for the tested account) */
type NotificationDeferralData = Record<string, unknown>;

/** `GET /WcagSettings/{accountId}` (envelope `data`) */
interface AccessibilitySettingsData {
  wcagSettingsId: number;
  fontSizeSetting: unknown;
  contrastSetting: unknown;
}

/** `GET /StudentDuty/{userId}` - class duties (dyżury); the official client maps `DutyId`, `DutyStart`, `DutyEnd` */
interface StudentDutyData {
  dutyId?: number;
  dutyStart?: string;
  dutyEnd?: string;
  [key: string]: unknown;
}

/** `GET /ExamResult/{userId}` - external exam results (egzamin ósmoklasisty...), empty for the tested account */
type ExamResultData = Record<string, unknown>;

/** `GET /NotificationCenter` - answers 500 for the tested account, shape unknown. */
type NotificationCenterData = Record<string, unknown>;

/** `GET /Auth/TokenInfo` - raw (not camelized) */
interface TokenInfo {
  UserIdentifier: string;
  [key: string]: unknown;
}

export type {
  AccountData, UserData, NoteData, NotePositivity, NoteCategoryData, SchoolYearData,
  SchoolModuleAccessData, PhotoData, NotificationCenterData, TokenInfo, SurveyData, NotificationDeferralData,
  AccessibilitySettingsData, StudentDutyData, ExamResultData,
};
