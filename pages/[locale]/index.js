import Layout from "@/components/layout";

import { useAnnouncements, useSchool, useTeachers, useClassrooms, useSubjects } from "@/lib/school";
import { useClass } from "@/lib/class";
import { useLuckyNumber } from "@/lib/lessons";
import { useGrades, usePoints, useGradesCategories, usePointsCategories } from "@/lib/grades";
import { useTimetable } from "@/lib/timetable";
import { useMessages } from "@/lib/messages";
import { apiUrl } from "@/lib/core";
import { useVersion, updateApp, useDevice } from "@/lib/updater";
import { getStaticPaths, makeStaticProps } from "@/lib/i18n/getStatic";
import { upperFirst, getNextLesson, getRecentGrades } from "@/lib/utils";

import { useEffect, useState } from "react";
import { Buildings, People, Star, Person, Git, Clock } from "react-bootstrap-icons";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import sanitize from "sanitize-html";
import { useTranslation } from "react-i18next";
import { Device } from "@capacitor/device";

dayjs.extend(isoWeek);

const getStaticProps = makeStaticProps(["landing", "common"]);
export { getStaticPaths, getStaticProps };

const Home = () => {
  const { t } = useTranslation(["landing", "common"]);

  const [userData, setUserData] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);

  // Landing page data
  const {
    data: schoolData,
    loading: schoolLoading,
    error: schoolError,
  } = useSchool();
  const {
    data: classData,
    loading: classLoading,
    error: classError,
  } = useClass();
  const {
    data: luckyNumberData,
    loading: luckyNumberLoading,
    error: luckyNumberError,
  } = useLuckyNumber();
  const {
    data: versionData,
    loading: versionLoading,
    error: versionError,
  } = useVersion();
  const {
    data: deviceData,
    loading: deviceLoading,
    error: deviceError,
  } = useDevice();
  const {
    data: messagesData,
    loading: messagesLoading,
    error: messagesError,
  } = useMessages();

  // timetable data for next lesson
  const {
    data: timetableData,
    loading: timetableLoading,
    error: timetableError,
  } = useTimetable(dayjs().startOf("isoWeek").format("YYYY-MM-DD"));

  const nextLesson = getNextLesson(timetableData);

  // classroom data for next lesson
  const {
    data: classroomsData,
    loading: classroomsLoading,
    error: classroomsError,
  } = useClassrooms(nextLesson?.Classroom?.Id ? nextLesson.Classroom.Id : false);

  // grades data for recent grades
  const {
    data: gradesData,
    loading: gradesLoading,
    error: gradesError,
  } = useGrades();
  const {
    data: pointsData,
    loading: pointsLoading,
    error: pointsError,
  } = usePoints();
  const {
    data: gradesCategoriesData,
    loading: gradesCategoriesLoading,
    error: gradesCategoriesError,
  } = useGradesCategories(
    gradesData && gradesData.length
      ? gradesData.map((x) => x.Category.Id).join(",")
      : false
  );
  const {
    data: pointsCategoriesData,
    loading: pointsCategoriesLoading,
    error: pointsCategoriesError,
  } = usePointsCategories(
    pointsData && pointsData.length
      ? pointsData.map((x) => x.Category.Id).join(",")
      : false
  );
  const {
    data: subjectsData,
    loading: subjectsLoading,
    error: subjectsError,
  } = useSubjects(
    (gradesData && gradesData.length) || (pointsData && pointsData.length)
      ? (gradesData ? gradesData.map((x) => x.Subject.Id) : [])
        .concat(pointsData ? pointsData.map((x) => x.Subject.Id) : [])
        .join(",")
      : false
  );

  const recentGrades = getRecentGrades(gradesData, pointsData);
  const [focusedGrade, setFocusedGrade] = useState(null);

  // Announcements data
  const [focusedAnnouncement, setFocusedAnnouncement] = useState(null);
  const {
    data: announcementsData,
    loading: announcementsLoading,
    error: announcementsError,
  } = useAnnouncements();
  const {
    data: teachersData,
    loading: teachersLoading,
    error: teachersError,
  } = useTeachers(
    announcementsData
      ? announcementsData.map((a) => a.AddedBy.Id).join(",")
      : false
  );

  // Check for updates
  useEffect(() => {
    if (
      versionData?.updateAvailable &&
      !sessionStorage.getItem("update_ignored")
    ) {
      document.getElementById("update_modal").showModal();
    }
  }, [versionData]);

  return (
    <Layout setAuthData={setUserData}>
      <dialog id="update_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">{t("updater.title")}</h3>
          <p className="py-4">
            {t("updater.message", {
              version: versionData?.latestVersion,
            })}
          </p>
          {
            deviceData && deviceData.operatingSystem == "android" ? (
              <div className="flex flex-col gap-2">
                {downloadProgress &&
                  downloadProgress.progress > 0 &&
                  downloadProgress.progress < 100 ? (
                  <progress
                    value={downloadProgress.progress}
                    max="100"
                    className="progress progress-primary w-full"
                  ></progress>
                ) : (
                  <button
                    className="btn btn-primary w-full"
                    onClick={async () => {
                      document
                        .getElementById("update_modal")
                        .classList.add("modal-open");
                      await updateApp(setDownloadProgress);
                      document
                        .getElementById("update_modal")
                        .classList.remove("modal-open");
                    }}
                  >
                    {downloadProgress
                      ? t("updater.download_again")
                      : t("updater.download")}
                  </button>
                )}
                {!downloadProgress ? (
                  <button
                    className="btn btn-neutral w-full"
                    onClick={() => {
                      sessionStorage.setItem("update_ignored", true);
                      document.getElementById("update_modal").close();
                    }}
                  >
                    {t("updater.ignore")}
                  </button>
                ) : (
                  <span className="text-sm">
                    {downloadProgress.progress < 100
                      ? t("updater.progress", {
                        progress: downloadProgress.progress,
                      })
                      : t("updater.complete")}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-base italic">{t("updater.manual")}</span>
              </div>
            )
          }
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <dialog
        id="annoucement_modal"
        className="modal modal-bottom sm:modal-middle"
        onClose={() => {
          setFocusedAnnouncement(null);
          document.getElementById("annoucement_modal").scrollTop = 0;
        }}
      >
        <div className="modal-box">
          {announcementsData && focusedAnnouncement ? (
            <div className="flex flex-col gap-2">
              <h3
                id="annoucement_title"
                className="font-bold text-2xl text-base-content"
              >
                {
                  announcementsData.find((a) => a.Id === focusedAnnouncement)
                    .Subject
                }
              </h3>
              <p
                id="annoucement_content"
                className="py-2 text-base-content/80 min-h-[100px]"
              >
                <p
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: sanitize(
                      announcementsData.find(
                        (a) => a.Id === focusedAnnouncement
                      ).Content,
                      {
                        allowedTags: [
                          "p",
                          "a",
                          "b",
                          "i",
                          "u",
                          "strong",
                          "em",
                          "br",
                        ],
                      }
                    ),
                  }}
                />
              </p>
            </div>
          ) : (
            <span className="text-lg">{t("announcements.loading")}</span>
          )}
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <dialog
        id="grade_modal"
        className="modal modal-bottom sm:modal-middle"
        onClose={() => {
          setFocusedGrade(null);
          document.getElementById("grade_modal").scrollTop = 0;
        }}
      >
        <div className="modal-box">
          {focusedGrade ? (
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-2xl text-base-content">
                {subjectsData?.find(s => s.Id === focusedGrade.Subject.Id)?.Name || focusedGrade.Subject.Name}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-base-content/70">Grade</span>
                  <span className="text-xl font-bold text-primary">
                    {focusedGrade.type === 'grade' ? focusedGrade.Grade : `${focusedGrade.Value}/${focusedGrade.ValueMax}`}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-base-content/70">Date</span>
                  <span className="text-lg">
                    {dayjs(focusedGrade.Date).format("DD.MM.YYYY")}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-base-content/70">Category</span>
                  <span className="text-lg">
                    {focusedGrade.type === 'grade' 
                      ? gradesCategoriesData?.find(c => c.Id === focusedGrade.Category.Id)?.Name || focusedGrade.Category.Name
                      : pointsCategoriesData?.find(c => c.Id === focusedGrade.Category.Id)?.Name || focusedGrade.Category.Name}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-base-content/70">Weight</span>
                  <span className="text-lg">
                    {focusedGrade.type === 'grade' ? focusedGrade.Weight : focusedGrade.Weight || 'N/A'}
                  </span>
                </div>
              </div>
              {focusedGrade.Comments && (
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-base-content/70">Comments</span>
                  <span className="text-base text-base-content/80">{focusedGrade.Comments}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-lg">Loading...</span>
          )}
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      
      <div className="flex flex-col mt-4 mb-4">
        <span className="text-2xl font-bold mb-2">Next lesson</span>
        {!timetableLoading && !timetableError && nextLesson ? (
          <div className="flex flex-row items-center justify-between p-4 bg-base-200 border border-base-300 rounded-box">
            <div className="flex flex-col">
              <span className="text-xl font-bold">{upperFirst(nextLesson.Subject.Name)}</span>
              <span className="text-base text-base-content/70">{nextLesson.Teacher.FirstName} {nextLesson.Teacher.LastName}</span>
              <span className="text-sm text-base-content/70">
                {!classroomsLoading && !classroomsError && classroomsData && classroomsData.length
                  ? classroomsData[0].Symbol || classroomsData[0].Name
                  : "Room TBA"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold">{nextLesson.HourFrom} - {nextLesson.HourTo}</span>
            </div>
          </div>
        ) : timetableLoading ? (
          <div className="skeleton h-24 rounded-box"></div>
        ) : (
          <div className="flex flex-row items-center p-4 bg-base-200 border border-base-300 rounded-box">
            <Clock className="hidden sm:block text-5xl text-base-content/50" />
            <div className="flex flex-col ml-4">
              <span className="text-2xl font-bold">No more lessons today</span>
              <span className="text-lg text-base-content/70">School day is over!</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col mt-4 mb-4">
        <span className="text-2xl font-bold mb-2">New grades</span>
        {(!gradesLoading && !pointsLoading && recentGrades?.length > 0) ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {recentGrades.map((grade, index) => {
              const subject = subjectsData?.find(s => s.Id === grade.Subject.Id);
              const category = grade.type === 'grade' 
                ? gradesCategoriesData?.find(c => c.Id === grade.Category.Id)
                : pointsCategoriesData?.find(c => c.Id === grade.Category.Id);
              
              return (
                <div
                  key={`${grade.type}-${grade.Id}-${index}`}
                  className="flex flex-col items-center justify-center p-3 bg-base-200 border border-base-300 rounded-box cursor-pointer hover:bg-base-300 transition-colors"
                  onClick={() => {
                    setFocusedGrade(grade);
                    document.getElementById("grade_modal").showModal();
                  }}
                >
                  <span className="text-xs text-base-content/70 text-center mb-1 line-clamp-2">
                    {subject?.Name || grade.Subject.Name}
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {grade.type === 'grade' ? grade.Grade : `${grade.Value}/${grade.ValueMax}`}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (gradesLoading || pointsLoading) ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-box"></div>
            ))}
          </div>
        ) : (
          <div className="flex flex-row items-center p-4 bg-base-200 border border-base-300 rounded-box">
            <div className="text-center w-full">
              <span className="text-lg text-base-content/70">No recent grades</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-6 gap-2 my-4">
        {luckyNumberData ? (
          <div className="col-span-6 md:col-span-3 flex flex-row items-center p-4 bg-base-200 border border-base-300 rounded-box">
            <Star className="hidden sm:block text-5xl text-primary" />
            <div className="flex flex-col ml-4">
              <span className="text-2xl font-bold">
                {t("blocks.lucky_number.title")}
              </span>
              <span>
                {t("blocks.lucky_number.content", {
                  number: luckyNumberData.LuckyNumber,
                  date: luckyNumberData.LuckyNumberDay,
                })}
              </span>
            </div>
          </div>
        ) : null}
      </div>
      <span className="text-3xl font-bold">{t("announcements.title")}</span>
      <div className="flex flex-col mt-4 gap-2">
        {announcementsData ? (
          announcementsData
            .sort((a, b) => {
              return (
                dayjs(b.CreationDate).valueOf() -
                dayjs(a.CreationDate).valueOf()
              );
            })
            .map((a) => (
              <div
                key={a.Id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between bg-base-200 border border-base-300 rounded-box gap-2 p-4 ${!a.WasRead && "border border-primary"
                  }`}
                onClick={async () => {
                  setFocusedAnnouncement(a.Id);
                  await fetch(`${apiUrl}/SchoolNotices/MarkAsRead/${a.Id}`, {
                    method: "POST",
                  });
                  document.getElementById("annoucement_modal").showModal();
                  document.getElementsByClassName("modal-box")[0].scrollTop = 0;
                }}
              >
                <div className="flex flex-col">
                  <span className="text-lg font-bold">{a.Subject}</span>
                  <div className="flex flex-row items-center gap-x-2 text-sm text-base-content/70">
                    <span>
                      {!teachersLoading && teachersData
                        ? `${teachersData.find((t) => t.Id === a.AddedBy.Id)
                          ?.FirstName
                        } ${teachersData.find((t) => t.Id === a.AddedBy.Id)
                          ?.LastName
                        }`
                        : t("unknown.teacher", { ns: "common" })}
                    </span>
                    <span>-</span>
                    <span>{a.CreationDate}</span>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="skeleton h-24"></div>
        )}
      </div>
      
      <div className="flex flex-col mt-8">
        <span className="text-3xl font-bold mb-4">Student</span>
        <div className="grid grid-cols-6 gap-2">
          {userData ? (
            <div className="col-span-6 md:col-span-3 flex flex-row items-center p-4 bg-base-200 border border-base-300 rounded-box">
              <Person className="hidden sm:block text-5xl text-primary" />
              <div className="flex flex-col ml-4">
                <span className="text-2xl font-bold">{t("blocks.student")}</span>
                <span>
                  {userData.Account.FirstName} {userData.Account.LastName}
                </span>
              </div>
            </div>
          ) : (
            <div className="col-span-6 md:col-span-3 skeleton h-24"></div>
          )}
          {!schoolLoading && !schoolError ? (
            <div className="col-span-6 md:col-span-3 flex flex-row items-center p-4 bg-base-200 border border-base-300 rounded-box">
              <Buildings className="hidden sm:block text-5xl text-primary" />
              <div className="flex flex-col ml-4">
                <span className="text-2xl font-bold">{t("blocks.school")}</span>
                <span>{schoolData.Name}</span>
              </div>
            </div>
          ) : (
            <div className="col-span-6 md:col-span-3 skeleton h-24"></div>
          )}
          {!classLoading && !classError ? (
            <div className="col-span-6 md:col-span-2 flex flex-row items-center p-4 bg-base-200 border border-base-300 rounded-box">
              <People className="hidden sm:block text-5xl text-primary" />
              <div className="flex flex-col ml-4">
                <span className="text-2xl font-bold">{t("blocks.class")}</span>
                <span>
                  {classData.Number}
                  {classData.Symbol} (
                  {parseInt(classData.EndSchoolYear.split("-")[0]) -
                    parseInt(classData.Number)}
                  -{classData.EndSchoolYear.split("-")[0]})
                </span>
              </div>
            </div>
          ) : (
            <div className="col-span-6 md:col-span-2 skeleton h-24"></div>
          )}
          {!versionLoading && !versionError ? (
            <div
              className="relative col-span-6 md:col-span-4 flex flex-row items-center p-4 bg-base-200 border border-base-300 rounded-box"
              onClick={async () => {
                if (!versionData.updateAvailable) return;
                document.getElementById("update_modal").showModal();
              }}
            >
              <Git className="hidden sm:block text-5xl text-primary" />
              <div className="flex flex-col ml-4">
                <span className="text-2xl font-bold">
                  {t("blocks.version.title")}
                </span>
                <span>v{versionData?.currentVersion}</span>
              </div>
              <div className="absolute top-0 right-0 p-2">
                {versionData?.updateAvailable && (
                  <span className="badge badge-primary">
                    {t("blocks.version.badge")}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="col-span-6 md:col-span-4 skeleton h-24"></div>
          )}
        </div>
      </div>
    </Layout>
  );
};
export default Home;
