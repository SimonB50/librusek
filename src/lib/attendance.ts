import type {AttendanceData, AttendanceTypeData, Id} from "../client/types/index.js";

/** Standard "obecność" type id - plain presences are hidden from the entries list. */
const PRESENCE_TYPE_ID = 100;

interface AttendanceStats {
  present: number;
  absent: number;
  total: number;
  /** `null` when there are no entries */
  percent: number | null;
  /** count per type id */
  byType: Map<Id, number>;
}

const emptyStats = (): AttendanceStats => ({present: 0, absent: 0, total: 0, percent: null, byType: new Map()});

abstract class AttendanceMath {
  static isPlainPresence = (type: AttendanceTypeData | undefined) =>
    !!type && type.isPresenceKind && ((type.standardType?.id ?? type.id) === PRESENCE_TYPE_ID || type.short === "ob");

  /**
   * One pass over the entries (the old app did `find` inside loops - O(n²)).
   * @param subjectOf entry -> subject id (`Lessons` lookup), `undefined` while loading
   */
  static stats = (
    entries: readonly AttendanceData[],
    getType: (id: Id) => AttendanceTypeData | undefined,
    subjectOf: (entry: AttendanceData) => Id | undefined,
  ) => {
    const total = emptyStats();
    const bySubject = new Map<Id, AttendanceStats>();
    for (const entry of entries) {
      const type = getType(entry.type.id);
      if (!type) continue;
      const subject = subjectOf(entry);
      const targets = [total];
      if (subject !== undefined) {
        let stats = bySubject.get(subject);
        if (!stats) {
          stats = emptyStats();
          bySubject.set(subject, stats);
        }
        targets.push(stats);
      }
      for (const stats of targets) {
        stats.total++;
        if (type.isPresenceKind) stats.present++;
        else stats.absent++;
        stats.byType.set(type.id, (stats.byType.get(type.id) ?? 0) + 1);
      }
    }
    for (const stats of [total, ...bySubject.values()])
      stats.percent = stats.total ? (stats.present / stats.total) * 100 : null;
    return {total, bySubject};
  }

  /** Entries grouped by date, newest day first. */
  static groupByDate = (entries: readonly AttendanceData[]) => {
    const groups = new Map<string, AttendanceData[]>();
    for (const entry of entries) {
      const list = groups.get(entry.date) ?? [];
      list.push(entry);
      groups.set(entry.date, list);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, list]) => ({date, entries: list.sort((a, b) => a.lessonNo - b.lessonNo)}));
  }

  static tone = (percent: number | null) => {
    if (percent === null) return "progress";
    if (percent < 50) return "progress progress-error";
    if (percent < 80) return "progress progress-warning";
    return "progress progress-success";
  }
}

export default AttendanceMath;
export type {AttendanceStats};
