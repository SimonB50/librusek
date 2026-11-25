import remotePaths from "../paths.js";
import {defineDictionary, defineResource} from "../query/resource.js";
import {MINUTE, queryClient} from "../query/client.js";
import Request from "../request.js";
import type {
  ClassData, ClassroomData, ColorData, HelpArticleData, LessonData, LibraryLendingsData, LuckyNumberData,
  SchoolData, SchoolFileData, SchoolNoticeData, SchoolTripData, SubjectData, UnitData, UserData, VirtualClassData,
} from "../types/index.js";

const paths = remotePaths.resources;

const School = defineResource<SchoolData>({name: "school", url: paths.school, staleTime: Infinity});
/** Class of the logged-in student */
const Class = defineResource<ClassData>({name: "class", url: paths.class, staleTime: Infinity});
const LuckyNumber = defineResource<LuckyNumberData>({name: "luckyNumber", url: paths.luckyNumber, staleTime: 10 * MINUTE});
const SchoolNotices = defineResource<SchoolNoticeData[]>({name: "schoolNotices", url: paths.schoolNotices});

/**
 * Marks a notice as read on Synergia. The cached list is updated right away and restored when the request fails.
 */
const markNoticeRead = async (id: SchoolNoticeData["id"]) => {
  const setRead = (wasRead: boolean) => queryClient.setQueryData<SchoolNoticeData[]>(
    SchoolNotices.key(),
    notices => notices?.map(notice => (notice.id === id ? {...notice, wasRead} : notice)),
  );
  setRead(true);
  try {
    await Request.send(paths.schoolNoticeMarkAsRead(id));
  } catch (error) {
    setRead(false);
    throw error;
  }
};

const SchoolFiles =defineResource<SchoolFileData[]>({name: "schoolFiles", url: paths.schoolFiles, staleTime: 10 * MINUTE});
const SchoolTrips = defineResource<SchoolTripData[]>({name: "schoolTrips", url: paths.schoolTrips, staleTime: 10 * MINUTE});
const Help = defineResource<HelpArticleData[]>({name: "help", url: paths.help, staleTime: Infinity});
/** eBiblioteka lendings - payload has two keys, so it is fetched raw */
const LibraryLendings = defineResource<LibraryLendingsData>({
  name: "libraryLendings",
  url: paths.libraryLendings,
  request: () => ({format: "raw"}),
  transform: (raw) => ({lastSynchronizationTimestamp: raw.lastSynchronizationTimestamp, lendings: raw.lendings ?? []}),
});

/** Teachers & other users referenced by `addedBy` / `teacher` fields. */
const Users = defineDictionary<UserData>({name: "users", url: paths.users});
const Subjects = defineDictionary<SubjectData>({name: "subjects", url: paths.subjects});
/** Lesson = teacher + subject + class binding, referenced by attendance and homework. */
const Lessons = defineDictionary<LessonData>({name: "lessons", url: paths.lessons});
const VirtualClasses = defineDictionary<VirtualClassData>({name: "virtualClasses", url: paths.virtualClasses});
const Units = defineDictionary<UnitData>({name: "units", url: paths.units});
const Classrooms = defineDictionary<ClassroomData>({name: "classrooms", url: paths.classrooms});
/** Colors of grade / homework categories (`category.color.id`) */
const Colors = defineDictionary<ColorData>({name: "colors", url: paths.colors});

export {
  School, Class, LuckyNumber, SchoolNotices, markNoticeRead, SchoolFiles, SchoolTrips, Help, LibraryLendings,
  Users, Subjects, Lessons, VirtualClasses, Units, Classrooms, Colors,
};
