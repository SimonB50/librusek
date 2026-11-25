import {createContext, useContext, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {queryClient} from "../../client/query/client.js";
import {usePreference} from "../preferences.js";
import {pickEngine, SOURCE, type EngineStatus, type TranslationEngine} from "./engines.js";
import {STATUS_KEY, TRANSLATION_KEY} from "./keys.js";

const AUTO_KEY = "translation.auto";
const PSEUDO_KEY = "translation.pseudo";

/* Queue ----------------------------------------------------------------------------------------*/

/** One queue for the whole app - a list in auto mode would otherwise start dozens of translations at once. */
const CONCURRENCY = 3;
let running = 0;
const waiting: (() => void)[] = [];

/** Waiting tasks of a closed view (aborted `signal`) are dropped instead of blocking the queue. */
const enqueue = async <T, >(task: () => Promise<T>, signal?: AbortSignal): Promise<T> => {
  if (running >= CONCURRENCY) await new Promise<void>(resolve => waiting.push(resolve));
  if (signal?.aborted) {
    waiting.shift()?.();
    throw signal.reason ?? new DOMException("Aborted", "AbortError");
  }
  running++;
  try {
    return await task();
  } finally {
    running--;
    waiting.shift()?.();
  }
};

/* Text & HTML ----------------------------------------------------------------------------------*/

/** Translates line by line (keeps line breaks and the whitespace around every piece). */
const translateText = async (engine: TranslationEngine, text: string, target: string, signal?: AbortSignal): Promise<string> => {
  const parts = text.split(/(\r?\n+)/);
  const translated = await Promise.all(parts.map(async (part) => {
    const [, before, core, after] = /^(\s*)([\s\S]*?)(\s*)$/.exec(part) ?? ["", "", part, ""];
    if (!core || !/\p{L}/u.test(core)) return part;
    return `${before}${await enqueue(() => engine.translate(core, target), signal)}${after}`;
  }));
  return translated.join("");
};

const URL_ONLY = /^\s*(https?:\/\/|www\.)\S+\s*$/i;

/** Translates the text nodes of (sanitized) HTML, keeping the markup. The result must be sanitized again before rendering. */
const translateHtml = async (engine: TranslationEngine, html: string, target: string, signal?: AbortSignal) => {
  // DOMPurify stays out of the start-up bundle - rich text pages load it anyway
  const {default: Html} = await import("../html.js");
  const document = new DOMParser().parseFromString(`<body>${Html.sanitize(html)}</body>`, "text/html");
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  await Promise.all(nodes
    .filter(node => node.data.trim() && !URL_ONLY.test(node.data))
    .map(async (node) => {
      node.data = await translateText(engine, node.data, target, signal);
    }));
  return document.body.innerHTML;
};

/** Short FNV-1a hash - query keys carry it instead of whole messages (they are listed in the developer cache tab). */
const hash = (text: string) => {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return `${(value >>> 0).toString(36)}-${text.length}`;
};

/* Hooks ----------------------------------------------------------------------------------------*/

const usePseudoTranslation = () => {
  const {value, set} = usePreference(PSEUDO_KEY);
  return {enabled: import.meta.env.DEV && value === "true", set: (enabled: boolean) => set(enabled ? "true" : null)};
};

interface TranslatorState {
  engine: TranslationEngine | null;
  /** App language, `null` when the app is in Polish - school content needs no translation then */
  target: string | null;
  /** Engine exists and the app is not in Polish */
  available: boolean;
  status: EngineStatus | undefined;
  ready: boolean;
  auto: boolean;
  setAuto: (enabled: boolean) => Promise<void>;
  preparing: boolean;
  progress: number | null;
  /** Downloads the models - call from a click (the browser engine requires it). */
  prepare: () => Promise<void>;
  /** Downloaded models (language codes) - `undefined` when the engine can't list them (browser) or still loading */
  models: string[] | undefined;
  /** Whether the engine lists its models at all */
  listsModels: boolean;
  deleteModel: (language: string) => Promise<void>;
}

/** Computed once in `TranslatorProvider` - every `<T>` reads it from context. */
const useTranslatorState = (): TranslatorState => {
  const {i18n} = useTranslation();
  const pseudo = usePseudoTranslation();
  const auto = usePreference(AUTO_KEY);
  const engine = pickEngine(pseudo.enabled);
  const language = i18n.resolvedLanguage ?? i18n.language;
  const target = language && language !== SOURCE ? language.split("-")[0] : null;
  const [progress, setProgress] = useState<number | null>(null);
  const [preparing, setPreparing] = useState(false);

  const status = useQuery({
    queryKey: [...STATUS_KEY, engine?.id, target],
    queryFn: () => (engine && target ? engine.status(target) : "unsupported" as const),
    enabled: !!engine && !!target,
    staleTime: Infinity,
  });

  const models = useQuery({
    queryKey: [...STATUS_KEY, "models", engine?.id],
    queryFn: () => engine?.models?.() ?? [],
    enabled: !!engine?.models,
    staleTime: Infinity,
  });

  /** Status and the model list both live under `STATUS_KEY`. */
  const refresh = () => queryClient.invalidateQueries({queryKey: STATUS_KEY});

  return {
    engine,
    target,
    available: !!engine && !!target && status.data !== undefined && status.data !== "unsupported",
    status: status.data,
    ready: !!engine && !!target && status.data === "ready",
    auto: auto.value === "true",
    setAuto: (enabled: boolean) => auto.set(enabled ? "true" : null),
    preparing: preparing || status.data === "downloading",
    progress,
    prepare: async () => {
      if (!engine || !target) return;
      setPreparing(true);
      setProgress(null);
      try {
        await engine.prepare(target, setProgress);
      } finally {
        setPreparing(false);
        setProgress(null);
        await refresh();
      }
    },
    models: models.data,
    listsModels: !!engine?.models,
    deleteModel: async (language) => {
      try {
        await engine?.deleteModel?.(language);
      } finally {
        // Translations made with a deleted model aren't reproducible - drop them with it
        if (language === SOURCE || language === target) queryClient.removeQueries({queryKey: TRANSLATION_KEY});
        await refresh();
      }
    },
  };
};

const OFF: TranslatorState = {
  engine: null, target: null, available: false, status: undefined, ready: false, auto: false,
  setAuto: async () => undefined, preparing: false, progress: null, prepare: async () => undefined,
  models: undefined, listsModels: false, deleteModel: async () => undefined,
};

const TranslatorContext = createContext<TranslatorState>(OFF);

const useTranslator = () => useContext(TranslatorContext);

type TranslatedKind = "text" | "html";

/** Translation of one string (cached per engine, language and text). Disabled until the engine is ready. */
const useTranslated = (kind: TranslatedKind, text: string | null | undefined, enabled: boolean) => {
  const {engine, target, ready} = useTranslator();
  const active = enabled && ready && !!engine && !!target && !!text?.trim();
  return useQuery({
    // Inactive texts share one disabled entry - the developer cache tab isn't flooded with one per string
    queryKey: active && text ? [...TRANSLATION_KEY, engine?.id, target, kind, hash(text)] : [...TRANSLATION_KEY, "off"],
    // `signal` makes TanStack cancel the query when its view closes - queued pieces are then skipped
    queryFn: ({signal}) => {
      if (!engine || !target || !text) return text ?? "";
      return kind === "html" ? translateHtml(engine, text, target, signal) : translateText(engine, text, target, signal);
    },
    enabled: active,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });
};

export {TRANSLATION_KEY, TranslatorContext, useTranslated, useTranslator, useTranslatorState, usePseudoTranslation};
export type {TranslatorState};
