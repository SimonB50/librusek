import Layout from "@/components/layout";

import { useAnnouncements, useSchool, useTeachers } from "@/lib/school";
import { useClass } from "@/lib/class";
import { useLuckyNumber } from "@/lib/lessons";
import { apiUrl, useVersion } from "@/lib/core";

import { useState } from "react";
import { Buildings, People, Star, Person, Git } from "react-bootstrap-icons";
import { deduplicate } from "@/lib/utils";
import { fetch } from "@tauri-apps/plugin-http";
import dayjs from "dayjs";

const Home = () => {
  // User info
  const [userData, setUserData] = useState(null);

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
    deduplicate([
      ...(announcementsData
        ? announcementsData?.SchoolNotices.map((a) => a.AddedBy.Id)
        : []),
    ]).join(",")
  );

  return (
    <Layout setAuthData={setUserData}>
      <span className="text-3xl font-bold">
        Welcome to <span className="text-primary">Synergia</span>!
      </span>
      <div className="grid grid-cols-6 gap-2 my-4">
        {userData ? (
          <div className="col-span-6 md:col-span-3 flex flex-row items-center p-4 bg-base-200 rounded-box">
            <Person className="hidden sm:block text-5xl text-primary" />
            <div className="flex flex-col ml-4">
              <span className="text-2xl font-bold">Student</span>
              <span>
                {userData.Me.Account.FirstName} {userData.Me.Account.LastName}
              </span>
            </div>
          </div>
        ) : (
          <div className="col-span-6 md:col-span-3 skeleton h-24"></div>
        )}
        {!schoolLoading && !schoolError ? (
          <div className="col-span-6 md:col-span-3 flex flex-row items-center p-4 bg-base-200 rounded-box">
            <Buildings className="hidden sm:block text-5xl text-primary" />
            <div className="flex flex-col ml-4">
              <span className="text-2xl font-bold">School</span>
              <span>{schoolData.School.Name}</span>
            </div>
          </div>
        ) : (
          <div className="col-span-6 md:col-span-3 skeleton h-24"></div>
        )}
        {!classLoading && !classError ? (
          <div className="col-span-6 md:col-span-2 flex flex-row items-center p-4 bg-base-200 rounded-box">
            <People className="hidden sm:block text-5xl text-primary" />
            <div className="flex flex-col ml-4">
              <span className="text-2xl font-bold">Class</span>
              <span>
                {classData.Class.Number}
                {classData.Class.Symbol} (
                {parseInt(classData.Class.EndSchoolYear.split("-")[0]) -
                  parseInt(classData.Class.Number)}
                -{classData.Class.EndSchoolYear.split("-")[0]})
              </span>
            </div>
          </div>
        ) : (
          <div className="col-span-6 md:col-span-2 skeleton h-24"></div>
        )}
        {!luckyNumberLoading && !luckyNumberError ? (
          <div className="col-span-6 md:col-span-2 flex flex-row items-center p-4 bg-base-200 rounded-box">
            <Star className="hidden sm:block text-5xl text-primary" />
            <div className="flex flex-col ml-4">
              <span className="text-2xl font-bold">Lucky number</span>
              <span>
                {luckyNumberData.LuckyNumber.LuckyNumber} (As of{" "}
                {luckyNumberData.LuckyNumber.LuckyNumberDay})
              </span>
            </div>
          </div>
        ) : (
          <div className="col-span-6 md:col-span-2 skeleton h-24"></div>
        )}
        {!versionLoading && !versionError ? (
          <div className="relative col-span-6 md:col-span-2 flex flex-row items-center p-4 bg-base-200 rounded-box">
            <Git className="hidden sm:block text-5xl text-primary" />
            <div className="flex flex-col ml-4">
              <span className="text-2xl font-bold">Version</span>
              <span>v{versionData?.currentVersion}</span>
            </div>
            <div className="absolute top-0 right-0 p-2">
              {versionData?.updateAvailable && (
                <span className="badge badge-primary">Update available</span>
              )}
            </div>
          </div>
        ) : (
          <div className="col-span-6 md:col-span-2 skeleton h-24"></div>
        )}
      </div>
      <span className="text-3xl font-bold">Announcements</span>
      <dialog id="annoucement_modal" className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 id="annoucement_title" className="font-bold text-lg">
            Announcement title
          </h3>
          <p id="annoucement_content" className="py-4">
            Announcement content
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button
                className="btn"
                onClick={() => {
                  setFocusedAnnouncement(null);
                  document.getElementById("annoucement_modal").scrollTop = 0;
                }}
              >
                Close
              </button>
            </form>
          </div>
        </div>
      </dialog>
      <div className="flex flex-col mt-4 gap-2">
        {!announcementsLoading && !announcementsError ? (
          announcementsData.SchoolNotices.sort((a, b) => {
            return dayjs(b.CreationDate).valueOf() - dayjs(a.CreationDate).valueOf();
          }).map((a) => (
            <div
              key={a.Id}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between bg-base-200 rounded-box gap-2 p-4 ${
                !a.WasRead && "border border-primary"
              }`}
            >
              <div className="flex flex-col">
                <span className="text-lg font-bold">{a.Subject}</span>
                <div className="flex flex-row items-center gap-x-2 gap-y-1 flex-wrap">
                  <span>
                    {!teachersLoading && teachersData
                      ? `${
                          teachersData.Users.find((t) => t.Id === a.AddedBy.Id)
                            .FirstName
                        } ${
                          teachersData.Users.find((t) => t.Id === a.AddedBy.Id)
                            .LastName
                        }`
                      : "Unknown teacher"}
                  </span>
                  <span>-</span>
                  <span>{a.CreationDate}</span>
                </div>
              </div>
              <button
                className="btn btn-primary self-end"
                onClick={async () => {
                  setFocusedAnnouncement(a.Id);
                  document.getElementById("annoucement_title").innerText =
                    a.Subject;
                  document.getElementById("annoucement_content").innerText =
                    a.Content;
                  await fetch(`${apiUrl}/SchoolNotices/MarkAsRead/${a.Id}`, {
                    method: "POST",
                  });
                  document.getElementById("annoucement_modal").showModal();
                  document
                    .getElementsByClassName("modal-box")[0]
                    .scrollTop = 0;
                }}
              >
                Read more
              </button>
            </div>
          ))
        ) : (
          <div className="skeleton h-24"></div>
        )}
      </div>
    </Layout>
  );
};
export default Home;
