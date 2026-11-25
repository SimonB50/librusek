import {Capacitor} from "@capacitor/core";
import {useEffect} from "react";
import {useLocation} from "wouter";
import {usePreference} from "./preferences.js";

/**
 * Firebase Analytics (project `librusek-3401c`, same as the old app) - **Android and iOS only**.
 * Config comes from `android/app/google-services.json` and `ios/App/App/GoogleService-Info.plist` (iOS pod without IDFA),
 * web has no Firebase app config, so it is a no-op there.
 * The plugin is imported lazily so it stays out of the start-up bundle.
 *
 * Never send personal data: no user id, login, names, school, class or message subjects - screen paths only.
 * Users can opt out in Settings (`analytics` preference) - Firebase keeps that choice natively across launches.
 */
const native = Capacitor.isNativePlatform();
/** Whether the setting is shown - on device, and in dev builds so it can be tested in the browser. */
const analyticsAvailable = native || import.meta.env.DEV;
const plugin = () => import("@capacitor-firebase/analytics").then(module => module.FirebaseAnalytics);

const ANALYTICS_KEY = "analytics";

/** Opt-out setting - on unless the user turned it off. */
const useAnalyticsConsent = () => {
  const {value, isPending, set} = usePreference(ANALYTICS_KEY);
  return {enabled: value !== "false", isPending, set: (enabled: boolean) => set(enabled ? null : "false")};
};

/** Screen name from a route path - `/app/grades?x=1` -> `grades`, `/auth` -> `auth`. */
const screenName = (path: string) => path.split(/[?#]/)[0].replace(/^\/(app\/)?/, "").replace(/\/$/, "") || "home";

const run = async (action: string, call: (analytics: Awaited<ReturnType<typeof plugin>>) => Promise<void>) => {
  if (!native) return;
  try {
    await call(await plugin());
  } catch (error) {
    console.warn(`Analytics: could not ${action}`, error);
  }
};

let lastScreen: string | null = null;

const logScreen = (path: string) => {
  // `/` only redirects to `/app/home` - skip it, and skip repeats (redirects, re-renders)
  if (path === "/" || screenName(path) === lastScreen) return;
  lastScreen = screenName(path);
  return run("log the screen", analytics => analytics.setCurrentScreen({screenName: screenName(path)}));
};

/**
 * Applies the opt-out setting and logs a `screen_view` on every route change while allowed -
 * render once inside the root `<Router>`.
 */
const ScreenTracker = () => {
  const [location] = useLocation();
  const consent = useAnalyticsConsent();
  const ready = !consent.isPending;

  useEffect(() => {
    if (ready) void run("change collection", analytics => analytics.setEnabled({enabled: consent.enabled}));
  }, [ready, consent.enabled]);

  useEffect(() => {
    if (ready && consent.enabled) void logScreen(location);
  }, [ready, consent.enabled, location]);

  return null;
};

export {ScreenTracker, screenName, analyticsAvailable, useAnalyticsConsent};
