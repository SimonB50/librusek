import "@/styles/globals.css";

import NoSSR from "@/components/no-srr";
import { ThemeProvider } from "next-themes";

const App = ({ Component, pageProps }) => {
  return (
    <NoSSR>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </NoSSR>
  );
};
export default App;
