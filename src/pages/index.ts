import {lazy} from "react";

/**
 * Every page is its own chunk - the shell (layout, data layer, i18n) loads first,
 * a page's code only when it is opened. `<Suspense>` lives in `<Layout>` (and around `/auth`).
 */
const Attendance = lazy(() => import("./attendance/page.js"));
const Auth = lazy(() => import("./auth/page.js"));
const Calendar = lazy(() => import("./calendar/page.js"));
const Developer = lazy(() => import("./developer/page.js"));
const Exams = lazy(() => import("./exams/page.js"));
const Grades = lazy(() => import("./grades/page.js"));
const Home = lazy(() => import("./home/page.js"));
const Homeworks = lazy(() => import("./homeworks/page.js"));
const Messages = lazy(() => import("./messages/page.js"));
const Profile = lazy(() => import("./profile/page.js"));
const School = lazy(() => import("./school/page.js"));
const Settings = lazy(() => import("./settings/page.js"));
const TeacherAbsences = lazy(() => import("./teacherAbsences/page.js"));
const Timetable = lazy(() => import("./timetable/page.js"));

export {
  Attendance, Auth, Calendar, Developer, Exams, Grades, Home, Homeworks, Messages, Profile, School, Settings,
  TeacherAbsences, Timetable,
};
