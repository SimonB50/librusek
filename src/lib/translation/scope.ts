import {createContext, useContext} from "react";
import {useTranslated, useTranslator} from "./index.js";

/** Translation switch of one detail view - see `TranslationScope` in `components/translate.tsx`. */
interface Scope {
  translated: boolean;
  set: (translated: boolean) => void;
}

const ScopeContext = createContext<Scope | null>(null);

const useScope = () => useContext(ScopeContext);

/** Whether texts here should be shown translated (only once the engine is ready - never downloads on its own). */
const useShowTranslated = () => {
  const scope = useScope();
  const {ready, auto} = useTranslator();
  return ready && (scope ? scope.translated : auto);
};

/** Plain-text translation for attributes / string props (e.g. `title`). */
const useTranslatedString = (text: string | null | undefined) => {
  const show = useShowTranslated();
  const {data} = useTranslated("text", text, show);
  return show && data !== undefined ? data : (text ?? "");
};

/** Rich text (sanitized HTML) - translated per text node, the markup is kept. */
const useTranslatedHtml = (html: string) => {
  const show = useShowTranslated();
  const {data, isError} = useTranslated("html", html, show);
  return {html: show && !isError && data !== undefined ? data : html, pending: show && !isError && data === undefined};
};

export {ScopeContext, useScope, useShowTranslated, useTranslatedHtml, useTranslatedString};
export type {Scope};
