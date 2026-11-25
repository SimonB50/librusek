import i18n from "i18next";
import {initReactI18next} from "react-i18next";

/**
 * Translations live in `src/locales/<language>/<namespace>.json` (ported from the old app) and are bundled.
 * Pick the namespace per page: `const {t} = useTranslation("grades")`, shared strings: `t("common:actions.close")`.
 */
const files = import.meta.glob<Record<string, unknown>>("../locales/*/*.json", {eager: true, import: "default"});

const resources: Record<string, Record<string, Record<string, unknown>>> = {};
for (const [path, content] of Object.entries(files)) {
  const [, language, namespace] = /locales\/([^/]+)\/([^/]+)\.json$/.exec(path) ?? [];
  if (!language || !namespace) continue;
  resources[language] ??= {};
  resources[language][namespace] = content;
}

const languages = [
  {code: "en", name: "English"},
  {code: "pl", name: "Polski"},
  {code: "ru", name: "Русский"},
  {code: "uk", name: "Українська"},
] as const;

type Language = typeof languages[number]["code"];

/** Picks the first supported language from the browser preferences ("ua" is a common misspelling of Ukrainian). */
const detect = (): Language => {
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of preferred) {
    const code = tag?.toLowerCase().split("-")[0];
    const match = code === "ua" ? "uk" : code;
    if (languages.some(language => language.code === match)) return match as Language;
  }
  return "en";
};

void i18n.use(initReactI18next).init({
  resources,
  lng: detect(),
  fallbackLng: "en",
  defaultNS: "common",
  ns: Object.keys(resources.en ?? {}),
  interpolation: {escapeValue: false},
  returnNull: false,
});

i18n.on("languageChanged", (language) => {
  document.documentElement.lang = language;
});
document.documentElement.lang = i18n.language;

export {languages, detect};
export type {Language};
export default i18n;
