import {Capacitor} from "@capacitor/core";

/**
 * On-device translators of school content (always from Polish).
 * - native: ML Kit (`@capacitor-mlkit/translation`) - ~30 MB model per language, works offline afterwards
 * - web: the browser's built-in `Translator` API (desktop Chrome 138+)
 * - dev builds: a pseudo engine for testing the UI anywhere
 * Text never leaves the device.
 */

type EngineStatus = "unsupported" | "downloadable" | "downloading" | "ready";

interface TranslationEngine {
  id: "mlkit" | "browser" | "pseudo";
  status: (target: string) => Promise<EngineStatus>;
  /** Downloads / prepares the models - the browser engine must be called from a click. */
  prepare: (target: string, onProgress?: (fraction: number) => void) => Promise<void>;
  /** Language codes of the downloaded models - `undefined` when the engine can't list them (the browser manages its own). */
  models?: () => Promise<string[]>;
  /** Deletes one downloaded model. */
  deleteModel?: (language: string) => Promise<void>;
  /** Only called once {@link status} is `ready` - ML Kit would otherwise download a model silently. */
  translate: (text: string, target: string) => Promise<string>;
}

const SOURCE = "pl";

/* ML Kit ---------------------------------------------------------------------------------------*/

/** Loaded lazily - keeps the plugin out of the web bundle's start-up path. */
const mlkit = () => import("@capacitor-mlkit/translation");
let mlkitDownloading = false;

const MlKitEngine: TranslationEngine = {
  id: "mlkit",
  status: async (target) => {
    if (mlkitDownloading) return "downloading";
    const {Translation} = await mlkit();
    const {languages} = await Translation.getDownloadedModels();
    const downloaded = new Set<string>(languages);
    return downloaded.has(SOURCE) && downloaded.has(target) ? "ready" : "downloadable";
  },
  prepare: async (target) => {
    const {Translation, Language} = await mlkit();
    const {languages} = await Translation.getDownloadedModels();
    mlkitDownloading = true;
    try {
      for (const language of [SOURCE, target]) {
        if (!(languages as string[]).includes(language)) await Translation.downloadModel({language: language as typeof Language[keyof typeof Language]});
      }
    } finally {
      mlkitDownloading = false;
    }
  },
  models: async () => {
    const {Translation} = await mlkit();
    const {languages} = await Translation.getDownloadedModels();
    return [...languages];
  },
  // ML Kit may refuse to delete a built-in model (English) - the error is shown in settings
  deleteModel: async (language) => {
    const {Translation, Language} = await mlkit();
    await Translation.deleteDownloadedModel({language: language as typeof Language[keyof typeof Language]});
  },
  translate: async (text, target) => {
    const {Translation, Language} = await mlkit();
    const result = await Translation.translate({
      text,
      sourceLanguage: SOURCE as typeof Language[keyof typeof Language],
      targetLanguage: target as typeof Language[keyof typeof Language],
    });
    return result.text;
  },
};

/* Browser Translator API -----------------------------------------------------------------------*/

const translators = new Map<string, Promise<BrowserTranslator>>();

const createTranslator = (target: string, onProgress?: (fraction: number) => void) => {
  let pending = translators.get(target);
  if (!pending) {
    pending = Translator.create({
      sourceLanguage: SOURCE,
      targetLanguage: target,
      monitor: monitor => monitor.addEventListener("downloadprogress", event => onProgress?.(event.loaded)),
    });
    // A failed create (e.g. no user activation) must not be cached
    pending.catch(() => translators.delete(target));
    translators.set(target, pending);
  }
  return pending;
};

const BrowserEngine: TranslationEngine = {
  id: "browser",
  status: async (target) => {
    // Some embedded Chromium builds expose the API but never answer - treat that as unsupported
    const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 8000));
    const availability = await Promise.race([Translator.availability({sourceLanguage: SOURCE, targetLanguage: target}), timeout]);
    if (availability === "available") {
      // `create()` may still require a click (e.g. right after a reload) - then the toggle's dialog does it
      try {
        await createTranslator(target);
        return "ready";
      } catch {
        return "downloadable";
      }
    }
    if (availability === "downloadable" || availability === "downloading") return availability;
    return "unsupported";
  },
  prepare: async (target, onProgress) => {
    await createTranslator(target, onProgress);
  },
  translate: async (text, target) => (await createTranslator(target)).translate(text),
};

/* Pseudo (dev builds only) ---------------------------------------------------------------------*/

/** Starts "not downloaded" like ML Kit, so the download dialog / settings can be tested too. */
const pseudoModels = new Set<string>();

const PseudoEngine: TranslationEngine = {
  id: "pseudo",
  status: async target => (pseudoModels.has(SOURCE) && pseudoModels.has(target) ? "ready" : "downloadable"),
  prepare: async (target, onProgress) => {
    for (let step = 1; step <= 10; step++) {
      await new Promise(resolve => setTimeout(resolve, 150));
      onProgress?.(step / 10);
    }
    pseudoModels.add(SOURCE).add(target);
  },
  models: async () => [...pseudoModels],
  deleteModel: async (language) => {
    pseudoModels.delete(language);
  },
  translate: async (text, target) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return `⟦${target.toUpperCase()}⟧ ${text}`;
  },
};

const hasBrowserTranslator = () => typeof self !== "undefined" && "Translator" in self;

const pickEngine = (pseudo: boolean): TranslationEngine | null => {
  if (import.meta.env.DEV && pseudo) return PseudoEngine;
  if (Capacitor.isNativePlatform()) return MlKitEngine;
  if (hasBrowserTranslator()) return BrowserEngine;
  return null;
};

export {pickEngine, SOURCE};
export type {EngineStatus, TranslationEngine};
