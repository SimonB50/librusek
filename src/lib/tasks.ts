import DateUtils from "./date.js";

/**
 * Old app ordering for homeworks/exams: due today -> upcoming (soonest first) -> overdue (most recent first).
 * Returns a new array.
 */
const sortTasks = <T, >(tasks: readonly T[], dateOf: (task: T) => string) =>
  [...tasks].sort((a, b) => {
    const da = DateUtils.daysFromToday(dateOf(a));
    const db = DateUtils.daysFromToday(dateOf(b));
    if (da === 0 && db !== 0) return -1;
    if (db === 0 && da !== 0) return 1;
    if (da < 0 && db < 0) return db - da;
    if (da < 0) return 1;
    if (db < 0) return -1;
    return da - db;
  });

type RangeState = "active" | "future" | "past";

const rangeState = (from: string, to: string): RangeState => {
  if (DateUtils.daysFromToday(from) > 0) return "future";
  if (DateUtils.daysFromToday(to) < 0) return "past";
  return "active";
};

/** Old app ordering for teacher absences: active -> future (soonest) -> past (most recent). */
const sortRanges = <T, >(items: readonly T[], rangeOf: (item: T) => { from: string; to: string }) => {
  const order: Record<RangeState, number> = {active: 0, future: 1, past: 2};
  return [...items].sort((a, b) => {
    const ra = rangeOf(a);
    const rb = rangeOf(b);
    const sa = rangeState(ra.from, ra.to);
    const sb = rangeState(rb.from, rb.to);
    if (sa !== sb) return order[sa] - order[sb];
    if (sa === "past") return DateUtils.parse(rb.to).getTime() - DateUtils.parse(ra.to).getTime();
    return DateUtils.parse(ra.from).getTime() - DateUtils.parse(rb.from).getTime();
  });
};

export {sortTasks, sortRanges, rangeState};
export type {RangeState};
