import {type ReactNode, useState} from "react";
import {
  RiCheckLine, RiDeleteBinLine, RiDownloadLine, RiFilePdf2Line, RiLogoutBoxRLine, RiPaletteLine, RiShieldKeyholeLine, RiTranslate2,
} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {useLocation} from "wouter";
import Accounts, {AutoLogin, useAccounts} from "../../client/accounts.js";
import AuthManager from "../../client/auth.js";
import Printouts, {PrintoutError} from "../../client/printouts.js";
import {queryClient} from "../../client/query/client.js";
import {ROOT_KEY} from "../../client/query/resource.js";
import {Modal} from "../../components/modal.js";
import {PageHeader} from "../../components/page.js";
import SavedAccountList from "../../components/savedAccounts.js";
import {saveFile} from "../../lib/files.js";
import i18n, {languages} from "../../i18n/index.js";
import Display from "../../lib/display.js";
import {analyticsAvailable, useAnalyticsConsent} from "../../lib/analytics.js";
import {THEMES, useDevMode, useLanguage, useTheme} from "../../lib/preferences.js";
import {useTranslator} from "../../lib/translation/index.js";

const Section = ({title, description, children}: { title: string; description: string; children: ReactNode }) => (
  <section className="flex flex-col">
    <h2 className="text-2xl font-semibold">{title}</h2>
    <span className="text-base-content/70">{description}</span>
    <div className="divider my-1"></div>
    <div className="flex flex-col gap-4">{children}</div>
  </section>
);

const Row = ({title, description, children}: { title: string; description: ReactNode; children: ReactNode }) => (
  <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-2">
    <div className="flex flex-col">
      <span className="text-lg font-semibold">{title}</span>
      <span className="text-sm text-base-content/70">{description}</span>
    </div>
    <div className="flex flex-row flex-wrap gap-2 items-center">{children}</div>
  </div>
);

/** Usage statistics opt-out - turning it off asks first, explaining why the statistics help. */
const PrivacySection = () => {
  const {t} = useTranslation("settings");
  const consent = useAnalyticsConsent();
  const [confirming, setConfirming] = useState(false);

  if (!analyticsAvailable) return null;

  const disable = () => {
    setConfirming(false);
    void consent.set(false);
  };

  return (
    <Section title={t("privacy.title")} description={t("privacy.description")}>
      <Row title={t("privacy.analytics.title")} description={t("privacy.analytics.description")}>
        <input type="checkbox" className="toggle toggle-primary" checked={consent.enabled} disabled={consent.isPending}
               aria-label={t("privacy.analytics.title")}
               onChange={event => (event.target.checked ? void consent.set(true) : setConfirming(true))}/>
      </Row>
      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={t("privacy.analytics.disable.title")}
        actions={(
          <>
            <button type="button" className="btn btn-ghost" onClick={disable}>{t("privacy.analytics.disable.confirm")}</button>
            <button type="button" className="btn btn-primary" onClick={() => setConfirming(false)}>{t("privacy.analytics.disable.keep")}</button>
          </>
        )}
      >
        <div className="flex flex-col gap-2">
          <p>{t("privacy.analytics.disable.message")}</p>
          <p className="text-sm text-base-content/70">{t("privacy.analytics.disable.note")}</p>
        </div>
      </Modal>
    </Section>
  );
};

/** Downloaded language models with a delete button each (ML Kit / pseudo - the browser manages its own). */
const DownloadedModels = () => {
  const {t, i18n: {language}} = useTranslation("settings");
  const translator = useTranslator();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const names = new Intl.DisplayNames([language], {type: "language"});
  const nameOf = (code: string) => Display.upperFirst(names.of(code) ?? code);
  const inUse = (code: string) => code === "pl" || code === translator.target;

  if (!translator.listsModels) {
    return <span className="text-sm text-base-content/60">{t("translation.models.browser_managed")}</span>;
  }

  const models = translator.models;
  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    setFailed(null);
    try {
      await translator.deleteModel(deleting);
    } catch (error) {
      console.error(error);
      setFailed(deleting);
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-base-content/70">{t("translation.models.downloaded")}</span>
      {models === undefined
        ? <div className="skeleton h-12"></div>
        : models.length === 0
          ? <span className="text-sm text-base-content/60">{t("translation.models.none")}</span>
          : (
            <ul className="list bg-base-200 border border-base-300 rounded-box">
              {[...models].sort((a, b) => nameOf(a).localeCompare(nameOf(b))).map(code => (
                <li key={code} className="list-row items-center">
                  <span className="badge badge-soft font-mono">{code.toUpperCase()}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold">{nameOf(code)}</span>
                    <span className="text-xs text-base-content/60">
                      {inUse(code) ? t("translation.models.in_use") : t("translation.models.unused")}
                    </span>
                  </div>
                  <button type="button" className="btn btn-sm btn-ghost btn-error" onClick={() => setDeleting(code)}
                          aria-label={t("translation.models.delete_one", {language: nameOf(code)})}>
                    <RiDeleteBinLine/> <span className="hidden sm:inline">{t("translation.models.delete")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
      {failed && <div role="alert" className="alert alert-soft alert-error">{t("translation.models.delete_failed", {language: nameOf(failed)})}</div>}
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={deleting ? t("translation.models.delete_title", {language: nameOf(deleting)}) : undefined}
        actions={(
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDeleting(null)}>{t("common:actions.cancel")}</button>
            <button type="button" className="btn btn-error" disabled={busy} onClick={() => void remove()}>
              {busy ? <span className="loading loading-spinner loading-sm"></span> : <RiDeleteBinLine/>}
              {t("translation.models.delete")}
            </button>
          </>
        )}
      >
        <p>{deleting && inUse(deleting) ? t("translation.models.delete_in_use") : t("translation.models.delete_unused")}</p>
      </Modal>
    </div>
  );
};

/** On-device translation of school content into the app language. */
const TranslationSection = () => {
  const {t} = useTranslation("settings");
  const translator = useTranslator();
  const [error, setError] = useState(false);
  const run = (action: () => Promise<void>) => {
    setError(false);
    action().catch((err: unknown) => {
      console.error(err);
      setError(true);
    });
  };

  const engineLabel = !translator.engine
    ? t("translation.engine.none")
    : t(`translation.engine.${translator.engine.id}`);

  return (
    <Section title={t("translation.title")} description={t("translation.description")}>
      <div role="note" className="alert alert-soft alert-info">
        <RiTranslate2 className="text-xl shrink-0"/>
        <span>{t("translation.privacy")}</span>
      </div>
      {!translator.target
        ? <span className="text-base-content/70">{t("translation.polish")}</span>
        : !translator.available
          ? (
            <span className="text-base-content/70">
              {!translator.engine || translator.status === "unsupported"
                ? t("translation.engine.none")
                : <span className="loading loading-dots loading-sm"></span>}
            </span>
          )
          : (
            <>
              <Row title={t("translation.models.title")} description={`${engineLabel} · ${t("translation.models.pair", {target: translator.target.toUpperCase()})}`}>
                {translator.ready
                  ? <span className="badge badge-soft badge-success">{t("translation.models.ready")}</span>
                  : (
                    <button type="button" className="btn" disabled={translator.preparing} onClick={() => run(translator.prepare)}>
                      {translator.preparing ? <span className="loading loading-spinner loading-sm"></span> : <RiDownloadLine/>}
                      {translator.engine?.id === "mlkit" ? t("translation.models.download") : t("translation.models.prepare")}
                    </button>
                  )}
              </Row>
              {translator.preparing && translator.progress !== null && (
                <progress className="progress progress-primary" value={translator.progress * 100} max={100}></progress>
              )}
              {error && <div role="alert" className="alert alert-soft alert-error">{t("translation.error")}</div>}
              <DownloadedModels/>
              <Row title={t("translation.auto.title")} description={t("translation.auto.description")}>
                <input type="checkbox" className="toggle toggle-primary" checked={translator.auto} disabled={!translator.ready}
                       onChange={event => void translator.setAuto(event.target.checked)}/>
              </Row>
            </>
          )}
    </Section>
  );
};

/** Theme preview card from the old app's theme browser. */
const ThemePreview = ({theme, active, onSelect}: { theme: string; active: boolean; onSelect: () => void }) => (
  <button type="button" onClick={onSelect}
          className={`overflow-hidden rounded-box border text-left cursor-pointer outline-2 outline-offset-2 ${active ? "outline-primary border-primary" : "outline-transparent border-base-content/20 hover:border-base-content/40"}`}>
    <div data-theme={theme} className="bg-base-100 text-base-content w-full">
      <div className="grid grid-cols-12 grid-rows-3">
        <div className="bg-base-200 col-start-1 row-span-2 row-start-1"></div>
        <div className="bg-base-300 col-start-1 row-start-3"></div>
        <div className="bg-base-100 col-span-11 col-start-2 row-span-3 row-start-1 flex flex-col gap-1 p-2">
          <div className="flex flex-row items-center justify-between font-bold">
            {theme}
            {active && <RiCheckLine/>}
          </div>
          <div className="flex flex-wrap gap-1">
            {["primary", "secondary", "accent", "neutral"].map(color => (
              <div key={color} className={`bg-${color} flex aspect-square w-6 items-center justify-center rounded-sm`}>
                <div className={`text-${color}-content text-sm font-bold`}>A</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </button>
);

// Tailwind only generates classes it can see - keep the dynamic preview colors in the bundle
// bg-primary bg-secondary bg-accent bg-neutral text-primary-content text-secondary-content text-accent-content text-neutral-content

/** Personal data PDF from Synergia - plain GET, saved / shared through `saveFile`. */
const PersonalDataButton = () => {
  const {t} = useTranslation("settings");
  const [state, setState] = useState<"idle" | "loading" | "error" | "session">("idle");
  const download = async () => {
    setState("loading");
    try {
      await saveFile(await Printouts.personalData(), "Synergia-dane-osobowe.pdf");
      setState("idle");
    } catch (error) {
      console.error(error);
      setState(error instanceof PrintoutError && error.code === "session" ? "session" : "error");
    }
  };
  return (
    <div className="flex flex-col items-start sm:items-end gap-1">
      <button type="button" className="btn" onClick={download} disabled={state === "loading"}>
        {state === "loading" ? <span className="loading loading-spinner loading-sm"></span> : <RiFilePdf2Line/>}
        {t("account.personal_data.button")}
      </button>
      {(state === "error" || state === "session") && (
        <span className="text-sm text-error">{t(`account.personal_data.${state}`)}</span>
      )}
    </div>
  );
};

const AccountSection = () => {
  const {t} = useTranslation(["settings", "auth"]);
  const [, navigate] = useLocation();
  const {accounts} = useAccounts();
  return (
    <Section title={t("account.title")} description={t("account.description")}>
      <Row title={t("account.personal_data.title")} description={t("account.personal_data.description")}>
        <PersonalDataButton/>
      </Row>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <span className="text-lg font-semibold">{t("account.saved.title")}</span>
          <span className="text-sm text-base-content/70">{t("auth:accounts.default_hint")}</span>
        </div>
        {accounts.length > 0
          ? <SavedAccountList/>
          : <span className="text-sm text-base-content/60">{t("account.saved.empty")}</span>}
        <span className={`flex flex-row gap-2 text-xs ${Accounts.insecureStorage ? "text-warning" : "text-base-content/60"}`}>
          <RiShieldKeyholeLine className="shrink-0 text-base"/>
          {Accounts.insecureStorage ? t("auth:accounts.storage_web") : t("auth:accounts.storage_device")}
        </span>
      </div>
      <Row title={t("account.logout.title")} description={t("account.logout.description")}>
        <button type="button" className="btn btn-error btn-outline" onClick={async () => {
          AutoLogin.suppress();
          await AuthManager.logout();
          await Accounts.setCurrent(null);
          navigate("~/auth");
        }}>
          <RiLogoutBoxRLine/> {t("account.logout.button")}
        </button>
      </Row>
    </Section>
  );
};

const Page = () => {
  const {t} = useTranslation("settings");
  const {theme, set: setTheme} = useTheme();
  const language = useLanguage();
  const devMode = useDevMode();
  const [browserOpen, setBrowserOpen] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const clearCache = async () => {
    // Keep app preferences (theme, language, devmode) - only Librus data is dropped
    queryClient.removeQueries({queryKey: [ROOT_KEY]});
    await queryClient.refetchQueries({type: "active"});
    setCacheCleared(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")}/>
      <AccountSection/>
      <Section title={t("appearance.title")} description={t("appearance.description")}>
        <Row title={t("appearance.languages.title")} description={t("appearance.languages.description")}>
          <select className="select" value={language.value ?? i18n.language} onChange={event => void language.set(event.target.value)}>
            {languages.map(option => (
              <option key={option.code} value={option.code}>({option.code.toUpperCase()}) {option.name}</option>
            ))}
          </select>
        </Row>
        <Row title={t("appearance.themes.standard.title")} description={t("appearance.themes.standard.description")}>
          <div className="join">
            {(["system", "light", "dark"] as const).map(option => (
              <button key={option} type="button" className={`btn join-item ${theme === option ? "btn-primary" : ""}`} onClick={() => setTheme(option)}>
                {t(`appearance.themes.standard.options.${option}`)}
              </button>
            ))}
          </div>
        </Row>
        <Row title={t("appearance.themes.custom.title")} description={t("appearance.themes.custom.description")}>
          <span className="text-sm"><b>{t("appearance.themes.custom.current")}:</b> {["system", "light", "dark"].includes(theme) ? t(`appearance.themes.standard.options.${theme}`) : Display.upperFirst(theme)}</span>
          <button type="button" className="btn" onClick={() => setBrowserOpen(true)}>
            <RiPaletteLine/> {t("appearance.themes.custom.explore")}
          </button>
        </Row>
      </Section>

      <TranslationSection/>

      <PrivacySection/>

      <Section title={t("advanced.title")} description={t("advanced.description")}>
        <Row title={t("advanced.devmode.title")}
             description={devMode.forced ? `${t("advanced.devmode.description")} ${t("advanced.devmode.forced")}` : t("advanced.devmode.description")}>
          <input type="checkbox" className="toggle toggle-primary" checked={devMode.enabled} disabled={devMode.forced}
                 onChange={event => void devMode.set(event.target.checked)}/>
        </Row>
        <Row title={t("advanced.clear_cache.title")} description={t("advanced.clear_cache.description")}>
          <button type="button" className="btn" onClick={clearCache}>{t("advanced.clear_cache.button")}</button>
        </Row>
      </Section>

      <span className="text-sm text-base-content/50 text-center">{t("about.version", {version: __APP_VERSION__})}</span>

      <Modal open={browserOpen} onClose={() => setBrowserOpen(false)} title={t("appearance.themes.custom.explorer.title")}
             subtitle={t("appearance.themes.custom.explorer.description")} className="sm:max-w-3xl"
             actions={<button type="button" className="btn" onClick={() => setBrowserOpen(false)}>{t("appearance.themes.custom.explorer.close")}</button>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {THEMES.map(option => <ThemePreview key={option} theme={option} active={theme === option} onSelect={() => setTheme(option)}/>)}
        </div>
      </Modal>
      <Modal open={cacheCleared} onClose={() => setCacheCleared(false)} title={t("advanced.clear_cache.success.title")}
             actions={<button type="button" className="btn" onClick={() => setCacheCleared(false)}>{t("advanced.clear_cache.success.button")}</button>}>
        <span>{t("advanced.clear_cache.success.message")}</span>
      </Modal>
    </div>
  );
};

export default Page;
