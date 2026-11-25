/** Built-in browser Translator API (Chrome 138+ desktop) - https://developer.mozilla.org/docs/Web/API/Translator */

type TranslatorAvailability = "unavailable" | "downloadable" | "downloading" | "available";

interface TranslatorCreateMonitor extends EventTarget {
  addEventListener(type: "downloadprogress", listener: (event: Event & { loaded: number }) => void): void;
}

interface BrowserTranslator {
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
  translate(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  destroy(): void;
}

interface TranslatorLanguages {
  sourceLanguage: string;
  targetLanguage: string;
}

declare const Translator: {
  availability(options: TranslatorLanguages): Promise<TranslatorAvailability | null>;
  create(options: TranslatorLanguages & {
    monitor?: (monitor: TranslatorCreateMonitor) => void;
    signal?: AbortSignal;
  }): Promise<BrowserTranslator>;
};
