import "@/styles/globals.css";

import NoSSR from "@/components/no-srr";
import { ThemeProvider } from "next-themes";
import { appWithTranslation } from "next-i18next";

const App = ({ Component, pageProps }) => {
  return (
    <NoSSR>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </NoSSR>
  );
};
export default appWithTranslation(App);
