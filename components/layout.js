import { useRouter } from "next/router";
import Link from "@/components/i18n/link";

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
import { useTranslation } from "react-i18next";

const Layout = ({ children, setAuthData }) => {
  const { t, i18n } = useTranslation(["common"]);

  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [devmode, setDevmode] = useState(false);

  useEffect(() => {
    // Fetch user data
    const fetchData = async () => {
      const data = await getUser();
      if (!data) return router.push("/auth");
      setUserData(data); // Local
      if (setAuthData) setAuthData(data); // Global
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
  }, [router, setUserData, setAuthData, userData, i18n.language]);

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
                  <Link href="/profile">{t("navigation.account.profile")}</Link>
                </li>
                <li>
                  <Link href="/settings">
                    {t("navigation.account.settings")}
                  </Link>
                </li>
                <li>
                  <button
                    onClick={async () => {
                      await logout();
                      await router.push("/auth");
                    }}
                  >
                    {t("navigation.account.logout")}
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
        <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4 gap-1">
          <li className="text-2xl text-center font-semibold">Librusek</li>
          <div className="divider"></div>
          <li>
            <Link href="/" className="flex flex-row items-center text-xl">
              <House />
              {t("navigation.home")}
            </Link>
          </li>
          <li>
            <Link href="/grades" className="flex flex-row items-center text-xl">
              <ListOl />
              {t("navigation.grades")}
            </Link>
          </li>
          <li>
            <Link href="/exams" className="flex flex-row items-center text-xl">
              <VectorPen />
              {t("navigation.exams")}
            </Link>
          </li>
          <li>
            <Link
              href="/timetable"
              className="flex flex-row items-center text-xl"
            >
              <Calendar2Week />
              {t("navigation.timetable")}
            </Link>
          </li>
          <li>
            <Link
              href="/teacherAbsences"
              className="flex flex-row items-center text-xl"
            >
              <PersonExclamation />
              {t("navigation.teacherAbsences")}
            </Link>
          </li>
          <li>
            <Link
              href="/attendance"
              className="flex flex-row items-center text-xl"
            >
              <ClipboardCheck />
              {t("navigation.attendance")}
            </Link>
          </li>
          <li>
            <Link
              href="/messages"
              className="flex flex-row items-center text-xl"
            >
              <ChatLeftDots />
              {t("navigation.messages")}
            </Link>
          </li>
          {devmode && (
            <li>
              <Link
                href="/developer"
                className="flex flex-row items-center text-xl"
              >
                <CodeSlash />
                {t("navigation.developer")}
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
export default Layout;
