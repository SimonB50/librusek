import {useEffect, useState} from "react";
import {
  RiCalendarScheduleLine, RiEyeLine, RiEyeOffLine, RiListOrdered2, RiLockLine, RiMailLine, RiShieldKeyholeLine, RiUserLine,
} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import Accounts, {AutoLogin, enterApp, type SavedAccount, useAccounts} from "../../client/accounts.js";
import AuthManager, {AuthError} from "../../client/auth.js";
import Logo from "../../components/logo.js";
import SavedAccountList from "../../components/savedAccounts.js";

const Feature = ({icon, title, description}: { icon: React.ReactNode; title: string; description: string }) => (
  <li className="flex flex-row items-start gap-3">
    <span className="flex items-center justify-center size-10 shrink-0 rounded-box bg-primary-content/15 text-xl">{icon}</span>
    <span className="flex flex-col">
      <span className="font-semibold">{title}</span>
      <span className="text-sm opacity-80">{description}</span>
    </span>
  </li>
);

/** Branding panel - desktop only, the phone layout starts with the form. */
const Hero = () => {
  const {t} = useTranslation("auth");
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 bg-linear-to-br from-primary to-secondary text-primary-content">
      <span className="flex flex-row items-center gap-3 text-2xl font-bold"><Logo className="size-10 ring-2 ring-primary-content/30"/>Librusek</span>
      <div className="flex flex-col gap-8 max-w-md">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-bold leading-tight">{t("hero.title")}</h2>
          <p className="text-lg opacity-90">{t("hero.description")}</p>
        </div>
        <ul className="flex flex-col gap-4">
          <Feature icon={<RiListOrdered2/>} title={t("hero.features.grades.title")} description={t("hero.features.grades.description")}/>
          <Feature icon={<RiCalendarScheduleLine/>} title={t("hero.features.timetable.title")} description={t("hero.features.timetable.description")}/>
          <Feature icon={<RiMailLine/>} title={t("hero.features.messages.title")} description={t("hero.features.messages.description")}/>
        </ul>
      </div>
      <span className="text-sm opacity-70">v{__APP_VERSION__}</span>
    </div>
  );
};

const errorKey = (error: unknown) => `errors.${error instanceof AuthError ? error.code : "unknown"}`;

const Page = () => {
  const {t} = useTranslation("auth");
  const {accounts} = useAccounts();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Saved account being logged in (click or automatic start-up login) */
  const [busyId, setBusyId] = useState<string | null>(null);
  const [autoName, setAutoName] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const loginSaved = async (account: SavedAccount) => {
    setError(null);
    setBusyId(account.id);
    try {
      await Accounts.login(account);
      enterApp();
    } catch (err) {
      setError(t(errorKey(err)));
      console.error(err);
    } finally {
      setBusyId(null);
      setAutoName(null);
    }
  };

  // Default account: one automatic attempt per app start (never after an explicit logout)
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once on mount, guarded by AutoLogin
  useEffect(() => {
    // Being here means there is no session - nothing is "signed in" any more
    void Accounts.setCurrent(null);
    if (!AutoLogin.shouldTry()) return;
    AutoLogin.markAttempted();
    void Accounts.getDefault().then(account => {
      if (!account) return;
      setAutoName(account.name);
      return loginSaved(account);
    });
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const login = (form.get("login") as string).trim();
    const password = form.get("password") as string;
    setError(null);
    setSubmitting(true);
    try {
      await AuthManager.authorize(login, password);
      AutoLogin.reset();
      if (remember) {
        const saved = await Accounts.save({name: (form.get("name") as string).trim() || login, login, password});
        await Accounts.setCurrent(saved.id);
        if (form.get("default") === "on") await Accounts.setDefault(saved.id);
      } else {
        await Accounts.setCurrent(null);
      }
      enterApp();
    } catch (err) {
      setError(t(errorKey(err)));
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || busyId !== null;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-base-200">
      <Hero/>
      <div className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="flex flex-row items-center gap-2 text-primary font-bold lg:hidden"><Logo className="size-7"/>Librusek</span>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <span className="text-base-content/70">{t("description")}</span>
          </div>

          {autoName && (
            <div role="status" className="alert alert-soft alert-info">
              <span className="loading loading-spinner loading-sm"></span>
              {t("accounts.auto_login", {name: autoName})}
            </div>
          )}
          {error && <div role="alert" className="alert alert-error alert-soft">{error}</div>}

          {accounts.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-base-content/70">{t("actions.saved_accounts")}</span>
              <SavedAccountList onSelect={account => void loginSaved(account)} busyId={busyId}/>
              <span className="text-xs text-base-content/60">{t("accounts.default_hint")}</span>
              <div className="divider my-0 text-sm text-base-content/60">{t("accounts.other")}</div>
            </div>
          )}

          <form className="flex flex-col gap-1 p-6 bg-base-100 border border-base-300 rounded-box" onSubmit={submit}>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t("fields.login")}</legend>
              <label className="input w-full validator">
                <RiUserLine className="opacity-50"/>
                <input name="login" type="text" placeholder="123456u" autoComplete="username" required disabled={busy}/>
              </label>
              <div className="validator-hint hidden mt-0">{t("fields.login_hint")}</div>
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t("fields.password")}</legend>
              <label className="input w-full validator">
                <RiLockLine className="opacity-50"/>
                <input name="password" type={showPassword ? "text" : "password"} placeholder="********" autoComplete="current-password"
                       required disabled={busy}/>
                <button type="button" className="btn btn-ghost btn-xs btn-square" aria-label={t("fields.toggle_password")}
                        onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <RiEyeOffLine/> : <RiEyeLine/>}
                </button>
              </label>
              <div className="validator-hint hidden mt-0">{t("fields.password_hint")}</div>
            </fieldset>

            <label className="label mt-2 cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={remember}
                     onChange={event => setRemember(event.target.checked)} disabled={busy}/>
              <span className="text-base-content">{t("actions.save_account")}</span>
            </label>
            {remember && (
              <div className="flex flex-col gap-2 pl-7">
                <fieldset className="fieldset py-0">
                  <legend className="fieldset-legend">{t("fields.name")}</legend>
                  <input name="name" type="text" className="input w-full" placeholder={t("fields.name_placeholder")} maxLength={40} disabled={busy}/>
                </fieldset>
                <label className="label cursor-pointer">
                  <input name="default" type="checkbox" className="checkbox checkbox-sm" defaultChecked={accounts.length === 0} disabled={busy}/>
                  <span className="text-base-content">{t("accounts.set_default")}</span>
                </label>
                <span className={`flex flex-row gap-2 text-xs ${Accounts.insecureStorage ? "text-warning" : "text-base-content/60"}`}>
                  <RiShieldKeyholeLine className="shrink-0 text-base"/>
                  {Accounts.insecureStorage ? t("accounts.storage_web") : t("accounts.storage_device")}
                </span>
              </div>
            )}

            <button type="submit" className="btn btn-primary mt-4" disabled={busy}>
              {submitting && <span className="loading loading-spinner"></span>}
              {t("actions.login")}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Page;
