import type {ReactNode} from "react";
import {I18nextProvider} from "react-i18next";
import {TranslatorProvider} from "../components/translate.js";
import i18n from "../i18n/index.js";
import {useAppearanceSync} from "../lib/preferences.js";
import {ErrorProvider} from "./errorProvider.js";
import QueryProvider from "./queryProvider.js";

const changeLanguage = (language: string) => {
  if (i18n.language !== language) void i18n.changeLanguage(language);
};

/** Needs the query client (preferences live in the cache). */
const AppearanceSync = () => {
  useAppearanceSync(changeLanguage);
  return null;
};

const MasterProvider = ({children}: { children: ReactNode }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <ErrorProvider>
        <QueryProvider>
          <AppearanceSync/>
          <TranslatorProvider>{children}</TranslatorProvider>
        </QueryProvider>
      </ErrorProvider>
    </I18nextProvider>
  )
}

export default MasterProvider;
