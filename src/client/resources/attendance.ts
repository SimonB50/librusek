import remotePaths from "../paths.js";
import {defineDictionary, defineResource} from "../query/resource.js";
import type {AttendanceData, AttendanceTypeData, JustificationData} from "../types/index.js";

const paths = remotePaths.resources;

interface AttendanceParams {
  /** Include plain presences - huge payload, the official client always sends `false`. */
  showPresences?: boolean;
  /** Only entries added since the last login. */
  onlyNew?: boolean;
}

/** `Attendances.useQuery()` - absences, lates, excused... (`useQuery({onlyNew: true})` for new ones) */
// biome-ignore lint/suspicious/noConfusingVoidType: `void` makes the params argument optional (`useQuery()`)
const Attendances = defineResource<AttendanceData[], AttendanceParams | void>({
  name: "attendances",
  url: paths.attendances,
  request: ({showPresences = false, onlyNew} = {}) => ({
    query: {showPresences, fromLatestLogin: onlyNew ? true : undefined},
  }),
});
const AttendanceTypes = defineDictionary<AttendanceTypeData>({name: "attendanceTypes", url: paths.attendanceTypes});

/** eUsprawiedliwienia - `403` when the module is disabled (check `SchoolModuleAccess` first). */
const Justifications = defineResource<JustificationData[]>({name: "justifications", url: paths.justifications});

export {Attendances, AttendanceTypes, Justifications};
export type {AttendanceParams};
