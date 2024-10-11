import { useRouter } from "next/router";
import Link from "next/link";

import { useState, useEffect } from "react";
import { Person, House, List, ListOl, VectorPen, Calendar2Week, PersonExclamation } from "react-bootstrap-icons";

import { getUser } from "@/lib/user";
import { logout, refreshSession } from "@/lib/auth";

const Layout = ({ children, setAuthData }) => {
  const router = useRouter();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Fetch user data
    const fetchData = async () => {
      const data = await getUser();
      if (!data) return window.location.replace("/auth");
      setUserData(data); // Local
      if (setAuthData) setAuthData(data); // Global
    };
    if (!userData) fetchData();

    // Setup refresh
    const intervalId = setInterval(async () => {
      console.log("Refreshing session...");
      await refreshSession();
    }, 1000 * 60 * 2); // 2 minutes
    return () => clearInterval(intervalId);
  }, [router, setUserData, setAuthData, userData]);

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
                    {userData.Me.Account.FirstName}{" "}
                    {userData.Me.Account.LastName}
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
                className="menu menu-sm dropdown-content bg-base-300 rounded-box z-[1] mt-3 w-52 p-2 shadow"
              >
{/*                 <li>
                  <a className="justify-between">
                    Profile
                    <span className="badge">New</span>
                  </a>
                </li> */}
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
        <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4 gap-1">
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
            <Link
              href="/exams"
              className="flex flex-row items-center text-xl"
            >
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
        </ul>
      </div>
    </div>
  );
};
export default Layout;
