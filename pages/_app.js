import "@/styles/globals.css";

import NoSSR from "react-no-ssr";

const App = ({ Component, pageProps }) => {
  return (
    <NoSSR>
      <Component {...pageProps} />
    </NoSSR>
  );
};
export default App;
