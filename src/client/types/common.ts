/**
 * Shared primitives for Synergia API payloads.
 *
 * All types in this folder describe data **after** `Request.get` normalization:
 * envelope unwrapped and keys camelCased (`Subject.Id` -> `subject.id`).
 *
 * Shapes were checked against live responses of the official web client (Nov 2026).
 * Fields marked optional (`?`) were missing or empty for the tested account - verify
 * them with the Developer tab before relying on them.
 *
 * Note: camelCasing only lowercases the first letter - `ColorRGB` becomes `colorRGB`,
 * `RGB` becomes `rGB`.
 */

/** Numeric id - most Synergia entities. */
type Id = number;
/** String id - e.g. school notices, calendars, realizations, messages. */
type StringId = string;

/** Reference to another resource, e.g. `grade.subject = { id: 12, url: ".../Subjects/12" }` */
interface Ref<TId extends Id | StringId = Id> {
  id: TId;
  url: string;
}

interface Entity<TId extends Id | StringId = Id> {
  id: TId;
}

/** `YYYY-MM-DD` */
type DateString = string;
/** `YYYY-MM-DD HH:mm:ss` */
type DateTimeString = string;
/** `HH:mm:ss` or `HH:mm` */
type TimeString = string;

/** Synergia mixes real booleans with `"0"`/`"1"` strings - normalize with {@link isFlagSet}. */
type Flag = boolean | "0" | "1" | 0 | 1;

const isFlagSet = (flag: Flag | null | undefined) =>
  flag === true || flag === "1" || flag === 1;

/** Semester number - `1` or `2` */
type Semester = 1 | 2;

export {isFlagSet};
export type {Id, StringId, Ref, Entity, DateString, DateTimeString, TimeString, Flag, Semester};
