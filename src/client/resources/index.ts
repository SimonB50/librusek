/**
 * All Librus resources. Import from here in components:
 *
 * ```tsx
 * import {Subjects, Grades} from "../client/resources/index.js";
 *
 * const {data: grades} = Grades.useQuery();                       // collection, cached 1 min
 * const {data: subject} = Subjects.useOne(grade.subject.id); // batched with every other useOne in the tree
 * const subjects = Subjects.useMany(grades?.map(g => g.subject.id) ?? []);
 *
 * const week = Timetable.useQuery({weekStart: "2026-11-16"});    // one cache entry per week
 * const inbox = Messages.useInfinite({box: "inbox"});             // paginated, session handled automatically
 * const notes = Messages.useInfinite({box: "inbox", category: MessageCategory.notes});
 * const {data: message} = Message.useQuery({box: "inbox", id});  // marks the message as read!
 * ```
 */
export * from "./account.js";
export * from "./school.js";
export * from "./grades.js";
export * from "./attendance.js";
export * from "./schedule.js";
export * from "./messages.js";
