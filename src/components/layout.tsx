import {Suspense, useState, type ReactNode} from "react";
import {
  RiBookOpenLine, RiCalendarEventLine, RiCalendarScheduleLine, RiCheckboxMultipleLine, RiCodeSSlashLine,
  RiFileEditLine, RiHome4Line, RiListOrdered2, RiLogoutBoxRLine, RiMailLine, RiMenuLine, RiSchoolLine,
  RiSettings3Line, RiUserAddLine, RiUserLine, RiUserSharedLine, RiUserUnfollowLine,
} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {Link, useLocation} from "wouter";
import Accounts, {AutoLogin, enterApp, type SavedAccount, useAccounts} from "../client/accounts.js";
import AuthManager from "../client/auth.js";
import {useError} from "../providers/errorProvider.js";
import {Me, UnreadMessagesCount} from "../client/resources/index.js";
import Display from "../lib/display.js";
import Logo from "./logo.js";
import {SkeletonList} from "./page.js";
import {useDevMode} from "../lib/preferences.js";
import {useSessionKeepAlive} from "../lib/session.js";

interface NavItem {
  href: string;
  /** `common:navigation.*` key */
  label: string;
  icon: ReactNode;
  badge?: ReactNode;
}

const UnreadBadge = () => {
  // Errors are ignored on purpose - a broken messages session must not break navigation
  const {data} = UnreadMessagesCount.useQuery(undefined, {select: counts => counts.inbox});
  if (!data) return null;
  return <span className="badge badge-sm badge-primary">{data > 99 ? "99+" : data}</span>;
};

const navigation: NavItem[] = [
  {href: "/home", label: "home", icon: <RiHome4Line/>},
  {href: "/grades", label: "grades", icon: <RiListOrdered2/>},
  {href: "/homeworks", label: "homeworks", icon: <RiBookOpenLine/>},
  {href: "/exams", label: "exams", icon: <RiFileEditLine/>},
  {href: "/timetable", label: "timetable", icon: <RiCalendarScheduleLine/>},
  {href: "/calendar", label: "calendar", icon: <RiCalendarEventLine/>},
  {href: "/teacherAbsences", label: "teacherAbsences", icon: <RiUserUnfollowLine/>},
  {href: "/attendance", label: "attendance", icon: <RiCheckboxMultipleLine/>},
  {href: "/messages", label: "messages", icon: <RiMailLine/>, badge: <UnreadBadge/>},
  {href: "/school", label: "school", icon: <RiSchoolLine/>},
];

const AccountButton = () => {
  const {t} = useTranslation();
  // Same cache entry as <AccountInfo/> on the home page - one request for both
  const {data: me, isPending} = Me.useQuery();

  if (isPending) return (
    <div tabIndex={0} role="button" className="btn btn-ghost">
      <div className="skeleton size-6 rounded-full"></div>
      <div className="skeleton h-2 w-16"></div>
    </div>
  );
  return (
    <div tabIndex={0} role="button" className="btn btn-ghost">
      <RiUserLine className="text-xl"/>
      <span className="hidden sm:inline">{me ? Display.fullName(me.account) : t("navigation.account.fallback")}</span>
    </div>
  );
};

const PageFallback = () => (
  <div className="flex flex-col gap-4" aria-busy="true">
    <div className="skeleton h-9 w-48"></div>
    <div className="skeleton h-5 w-72"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><SkeletonList count={4}/></div>
  </div>
);

/** daisyUI dropdowns stay open while focused - drop focus after picking an item. */
const closeDropdown = () => (document.activeElement as HTMLElement | null)?.blur();

/** Account dropdown: profile, settings, switching between saved accounts, logout. */
const AccountMenu = () => {
  const {t} = useTranslation();
  const {t: tAuth} = useTranslation("auth");
  const [, navigate] = useLocation();
  const {openError} = useError();
  const {accounts, currentId} = useAccounts();
  const [switching, setSwitching] = useState<SavedAccount | null>(null);
  const others = accounts.filter(account => account.id !== currentId);

  /** Explicit logout keeps the login screen up - no automatic login of the default account. */
  const toLogin = async () => {
    closeDropdown();
    AutoLogin.suppress();
    await AuthManager.logout();
    await Accounts.setCurrent(null);
    navigate("~/auth");
  };

  const switchTo = async (account: SavedAccount) => {
    closeDropdown();
    setSwitching(account);
    try {
      await Accounts.switchTo(account);
      enterApp();
    } catch (error) {
      AutoLogin.suppress();
      setSwitching(null);
      openError(error instanceof Error ? error : new Error(String(error)));
      navigate("~/auth");
    }
  };

  return (
    <div className="dropdown dropdown-end">
      <AccountButton/>
      <ul tabIndex={0}
          className="menu dropdown-content bg-base-200 border border-base-300 rounded-box z-20 mt-3 w-64 p-2 shadow-sm">
        <li><Link href="/profile" onClick={closeDropdown}><RiUserLine/>{t("navigation.account.profile")}</Link></li>
        <li><Link href="/settings" onClick={closeDropdown}><RiSettings3Line/>{t("navigation.account.settings")}</Link></li>
        {others.length > 0 && (
          <>
            <li className="menu-title mt-1">{tAuth("accounts.switch")}</li>
            {others.map(account => (
              <li key={account.id}>
                <button type="button" onClick={() => void switchTo(account)}>
                  <RiUserSharedLine/>
                  <span className="flex flex-col items-start min-w-0">
                    <span className="truncate max-w-40">{account.name}</span>
                    <span className="text-xs text-base-content/60">{account.login}</span>
                  </span>
                </button>
              </li>
            ))}
          </>
        )}
        <div className="divider my-1"></div>
        <li><button type="button" onClick={() => void toLogin()}><RiUserAddLine/>{tAuth("accounts.add")}</button></li>
        <li>
          <button type="button" className="text-error" onClick={() => void toLogin()}>
            <RiLogoutBoxRLine/>{t("navigation.account.logout")}
          </button>
        </li>
      </ul>
      {switching && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-base-100/80 backdrop-blur-sm">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <span className="text-lg">{tAuth("accounts.auto_login", {name: switching.name})}</span>
        </div>
      )}
    </div>
  );
};

const linkClass = (active: boolean) =>
  `flex flex-row items-center gap-3 text-lg ${active ? "menu-active" : ""}`;

const Layout = ({children}: { children: ReactNode }) => {
  const {t} = useTranslation();
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const devMode = useDevMode();
  useSessionKeepAlive();

  const items: NavItem[] = devMode.enabled
    ? [...navigation, {href: "/developer", label: "developer", icon: <RiCodeSSlashLine/>}]
    : navigation;
  const current = items.find(item => location.startsWith(item.href));

  return (
    <div className="drawer lg:drawer-open">
      <input id="navigation-drawer" type="checkbox" className="drawer-toggle" checked={drawerOpen}
             onChange={event => setDrawerOpen(event.target.checked)}/>
      <div className="drawer-content flex flex-col min-h-screen">
        <div className="navbar bg-base-300 lg:pl-4 sticky top-0 z-10">
          <div className="flex-1 flex flex-row items-center gap-1">
            <label htmlFor="navigation-drawer" aria-label={t("navigation.menu")}
                   className="btn btn-square btn-ghost drawer-button lg:hidden">
              <RiMenuLine className="text-xl"/>
            </label>
            <span className="text-lg font-semibold lg:hidden">{current ? t(`navigation.${current.label}`) : t("app")}</span>
          </div>
          <div className="flex-none">
            <AccountMenu/>
          </div>
        </div>
        <main className="p-4 w-full max-w-6xl mx-auto">
          {/* Pages are lazy chunks - the shell stays mounted while one loads */}
          <Suspense fallback={<PageFallback/>}>{children}</Suspense>
        </main>
      </div>
      <div className="drawer-side z-20">
        <label htmlFor="navigation-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <ul className="menu bg-base-200 text-base-content min-h-full w-72 p-4 gap-1">
          <li className="menu-title flex flex-row items-center justify-center gap-3 text-2xl text-base-content font-semibold">
            <Logo className="size-9"/>{t("app")}
          </li>
          <div className="divider my-1"></div>
          {items.map(item => (
            <li key={item.href}>
              <Link href={item.href} className={linkClass} onClick={() => setDrawerOpen(false)}>
                {item.icon}
                <span className="grow">{t(`navigation.${item.label}`)}</span>
                {item.badge}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Layout;
