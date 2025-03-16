"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { Preferences } from "@capacitor/preferences";

import { useState, useEffect } from "react";
import {
  Person,
  House,
  List,
  ListOl,
  VectorPen,
  Calendar2Week,
  PersonExclamation,
  ClipboardCheck,
  ChatLeftDots,
  CodeSlash,
} from "react-bootstrap-icons";

import { getUser } from "@/lib/user";
import { logout, refreshSession } from "@/lib/auth";

const Layout = ({ children }) => {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [devmode, setDevmode] = useState(false);

  useEffect(() => {
    // Fetch user data
    const fetchData = async () => {
      const data = await getUser();
      if (!data) return router.push("/auth");
      setUserData(data); // Local
    };
    if (!userData) fetchData();

    // Setup session refresh
    const intervalId = setInterval(
      async () => {
        console.log("Refreshing session...");
        await refreshSession();
      },
      1000 * 60 * 2
    ); // 2 minutes

    // Check if devmode is enabled
    Preferences.get({ key: "devmode" }).then((res) => {
      if (res.value === "true") setDevmode(true);
    });

    // Cleanup
    return () => clearInterval(intervalId);
  }, [router, setUserData, userData]);

  return (
    <div className="drawer lg:drawer-open">
      <input id="navigation-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        <div className="navbar bg-base-300 lg:pl-4">
          <div className="flex-1">
            <label
              htmlFor="navigation-drawer"
              className="btn btn-square btn-ghost drawer-button lg:hidden"
            >
              <List className="text-xl" />
            </label>
          </div>
          <div className="flex-none">
            <div className="dropdown dropdown-end">
              {userData ? (
                <div
                  tabIndex="0"
                  role="button"
                  className="flex flex-row btn btn-ghost"
                >
                  <Person className="text-3xl" />
                  <span>
                    {userData.Account.FirstName} {userData.Account.LastName}
                  </span>
                </div>
              ) : (
                <div
                  tabIndex="0"
                  role="button"
                  className="flex flex-row btn btn-ghost"
                >
                  <div className="skeleton size-10 rounded-full"></div>
                  <div className="skeleton h-2 w-10"></div>
                </div>
              )}
              <ul
                tabIndex="0"
                className="menu menu-sm dropdown-content bg-base-300 border border-base-200 rounded-box z-1 mt-3 w-52 p-2 shadow-sm"
              >
                <li>
                  <Link href="/profile">Profile</Link>
                </li>
                <li>
                  <Link href="/settings">Settings</Link>
                </li>
                <li>
                  <button
                    onClick={async () => {
                      await logout();
                      router.push("/auth");
                    }}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="p-4">{children}</div>
      </div>
      <div className="drawer-side">
        <label
          htmlFor="navigation-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4 gap-1" onClick={() => document.getElementById("navigation-drawer").checked = false}>
          <li className="text-2xl text-center font-semibold">Librusek</li>
          <div className="divider"></div>
          <li>
            <Link href="/" className="flex flex-row items-center text-xl">
              <House />
              Home
            </Link>
          </li>
          <li>
            <Link href="/grades" className="flex flex-row items-center text-xl">
              <ListOl />
              Grades
            </Link>
          </li>
          <li>
            <Link href="/exams" className="flex flex-row items-center text-xl">
              <VectorPen />
              Exams
            </Link>
          </li>
          <li>
            <Link
              href="/timetable"
              className="flex flex-row items-center text-xl"
            >
              <Calendar2Week />
              Timetable
            </Link>
          </li>
          <li>
            <Link
              href="/teacherAbsences"
              className="flex flex-row items-center text-xl"
            >
              <PersonExclamation />
              Teacher absences
            </Link>
          </li>
          <li>
            <Link
              href="/attendance"
              className="flex flex-row items-center text-xl"
            >
              <ClipboardCheck />
              Attendance
            </Link>
          </li>
          <li>
            <Link
              href="/messages"
              className="flex flex-row items-center text-xl"
            >
              <ChatLeftDots />
              Messages
            </Link>
          </li>
          {devmode && (
            <li>
              <Link
                href="/developer"
                className="flex flex-row items-center text-xl"
              >
                <CodeSlash />
                Developer
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
export default Layout;
