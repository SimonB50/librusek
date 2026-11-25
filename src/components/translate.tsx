import {type ReactNode, useState} from "react";
import {RiTranslate2} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {TranslatorContext, useTranslated, useTranslator, useTranslatorState} from "../lib/translation/index.js";
import {ScopeContext, useScope, useShowTranslated} from "../lib/translation/scope.js";
import {Modal} from "./modal.js";

/*
 * Translation of school-written content (messages, descriptions, subject names...) into the app language.
 * - Detail views wrap their content in a <TranslationScope> (keyed by the item) with a <TranslateToggle>.
 * - Outside a scope (lists, cards) texts follow the "auto-translate" setting.
 * - Names of people are never translated - don't wrap them in <T>.
 */

/** Translator state for the whole app (engine, models, auto mode) - mounted once in `MasterProvider`. */
const TranslatorProvider = ({children}: { children: ReactNode }) => {
  const state = useTranslatorState();
  return <TranslatorContext.Provider value={state}>{children}</TranslatorContext.Provider>;
};

/**
 * One switch for a whole detail view (wrap the `<Modal>` so its title is included).
 * Starts translated when auto-translate is on; opening another item (`id`) starts over.
 */
const TranslationScope = ({id, children}: { id: string | number | null | undefined; children: ReactNode }) => {
  const {auto} = useTranslator();
  const [override, setOverride] = useState<{ id: typeof id; value: boolean } | null>(null);
  const translated = override && override.id === id ? override.value : auto;
  return (
    <ScopeContext.Provider value={{translated, set: value => setOverride({id, value})}}>
      {children}
    </ScopeContext.Provider>
  );
};

/** Short codes and abbreviations ("WF", "j. ang. R") are left as they are. */
const isCode = (text: string) => text.trim().length <= 2 || !/\p{Ll}/u.test(text);

/**
 * Translatable plain text written by the school.
 * `name` - a dictionary name (subject, category...): codes and abbreviations are skipped.
 */
const T = ({text, name = false}: { text: string | null | undefined; name?: boolean }) => {
  const {t} = useTranslation();
  const show = useShowTranslated();
  const skip = !text || (name && isCode(text));
  const {data, isError} = useTranslated("text", text, show && !skip);
  if (!show || skip) return <>{text}</>;
  if (isError) return <span title={t("translation.failed")}>{text}</span>;
  if (data === undefined) return <span className="opacity-60 animate-pulse">{text}</span>;
  return <span title={text ?? undefined}>{data}</span>;
};

/** Confirmation before the first download of language models. */
const PrepareDialog = ({open, onClose, onConfirm}: { open: boolean; onClose: () => void; onConfirm: () => void }) => {
  const {t} = useTranslation();
  const {engine, preparing, progress} = useTranslator();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("translation.prepare_title")}
      actions={(
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t("actions.cancel")}</button>
          <button type="button" className="btn btn-primary" disabled={preparing} onClick={onConfirm}>
            {preparing && <span className="loading loading-spinner loading-sm"></span>}
            {t("translation.prepare_action")}
          </button>
        </>
      )}
    >
      <p>{engine?.id === "mlkit" ? t("translation.prepare_mlkit") : t("translation.prepare_browser")}</p>
      {preparing && <progress className="progress progress-primary" value={progress === null ? undefined : progress * 100} max={100}></progress>}
    </Modal>
  );
};

/** "Translate" / "Show original" switch of the surrounding {@link TranslationScope}. Hidden when translation is unavailable. */
const TranslateToggle = ({className = ""}: { className?: string }) => {
  const {t} = useTranslation();
  const scope = useScope();
  const {available, ready, prepare} = useTranslator();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(false);
  if (!scope || !available) return null;

  const on = ready && scope.translated;

  if (on) {
    return (
      <div className={`flex flex-row flex-wrap items-center gap-x-2 text-xs text-base-content/60 ${className}`}>
        <RiTranslate2 className="text-sm"/>
        {t("translation.translated")}
        <button type="button" className="link link-hover text-primary" onClick={() => scope.set(false)}>
          {t("translation.original")}
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-row flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        className="btn btn-xs btn-ghost text-primary"
        onClick={() => {
          if (ready) scope.set(true);
          else setAsking(true);
        }}
      >
        <RiTranslate2/> {t("translation.translate")}
      </button>
      {error && <span className="text-xs text-error">{t("translation.failed")}</span>}
      <PrepareDialog
        open={asking}
        onClose={() => setAsking(false)}
        onConfirm={() => {
          setError(false);
          // Called straight from the click - the browser engine needs the user activation
          prepare()
            .then(() => scope.set(true))
            .catch((err: unknown) => {
              console.error(err);
              setError(true);
            })
            .finally(() => setAsking(false));
        }}
      />
    </div>
  );
};

export {T, TranslateToggle, TranslationScope, TranslatorProvider};
