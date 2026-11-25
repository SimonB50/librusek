import {useEffect} from "react";
import AuthManager from "../client/auth.js";

const REFRESH_INTERVAL = 2 * 60 * 1000;

/** Keeps the Synergia session alive while the app is open (same interval as the old app). */
const useSessionKeepAlive = () => {
  useEffect(() => {
    const intervalId = setInterval(() => {
      void AuthManager.refreshSession().catch((error: unknown) => console.warn("Session refresh failed", error));
    }, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, []);
};

export {useSessionKeepAlive};
