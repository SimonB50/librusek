import type {DateString, DateTimeString, Entity, Ref, Semester} from "./common.js";

/** `GET /Attendances?showPresences=false` */
interface AttendanceData extends Entity {
  lesson: Ref;
  student: Ref;
  date: DateString;
  addDate: DateTimeString;
  lessonNo: number;
  semester: Semester;
  type: Ref;
  addedBy: Ref;
}

/** `GET /Attendances/Types/{ids}` */
interface AttendanceTypeData extends Entity {
  name: string;
  short: string;
  /** Hex without `#` */
  colorRGB: string;
  color: Ref;
  standard: boolean;
  /** `true` for presence-like types (obecność, spóźnienie...) */
  isPresenceKind: boolean;
  order: number;
  identifier: string;
  /** School-defined types point at the standard type they map to */
  standardType?: Ref;
}

/**
 * `GET /Justifications` - eUsprawiedliwienia, `403` when the module is disabled for the school.
 * Shape unknown (module disabled for the tested account).
 */
type JustificationData = Entity & Record<string, unknown>;

export type {AttendanceData, AttendanceTypeData, JustificationData};
