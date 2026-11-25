import {Preferences} from "@capacitor/preferences";
import {useEffect} from "react";
import {queryOptions, useQuery} from "@tanstack/react-query";
import {queryClient} from "../client/query/client.js";

/**
 * App preferences (Capacitor Preferences on device, localStorage on web)
 * exposed through the query cache, so every component sees updates instantly.
 */
const preferenceQuery = (key: string) => queryOptions({
  queryKey: ["app", "preference", key],
  queryFn: async () => (await Preferences.get({key})).value,
  staleTime: Infinity,
});

const setPreference = async (key: string, value: string | null) => {
  if (value === null) await Preferences.remove({key});
  else await Preferences.set({key, value});
  queryClient.setQueryData(preferenceQuery(key).queryKey, value);
};

const usePreference = (key: string) => {
  const {data, isPending} = useQuery(preferenceQuery(key));
  return {value: data ?? null, isPending, set: (value: string | null) => setPreference(key, value)};
};

const DEVMODE_KEY = "devmode";

/** Developer tools are always on in `vite dev`, on device they have to be enabled manually. */
const useDevMode = () => {
  const {value, set} = usePreference(DEVMODE_KEY);
  const stored = value === "true";
  return {
    enabled: import.meta.env.DEV || stored,
    stored,
    forced: import.meta.env.DEV,
    set: (enabled: boolean) => set(enabled ? "true" : "false"),
  };
};

export {usePreference, setPreference, preferenceQuery, useDevMode};

/* Appearance -----------------------------------------------------------------------------------*/

/** Every built-in daisyUI theme (`themes: all` in `index.css`). */
const THEMES = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave", "retro", "cyberpunk", "valentine",
  "halloween", "garden", "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
  "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee", "winter", "dim", "nord", "sunset",
  "caramellatte", "abyss", "silk",
] as const;

const THEME_KEY = "theme";
const LANGUAGE_KEY = "language";

/** `"system"` (follows `prefers-color-scheme`) or a daisyUI theme name. */
const useTheme = () => {
  const {value, set} = usePreference(THEME_KEY);
  return {theme: value ?? "system", set: (theme: string) => set(theme === "system" ? null : theme)};
};

const useLanguage = () => usePreference(LANGUAGE_KEY);

/** Applies stored theme & language - mounted once in `MasterProvider`. */
const useAppearanceSync = (onLanguage: (language: string) => void) => {
  const {theme} = useTheme();
  const {value: language} = useLanguage();

  useEffect(() => {
    if (theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (language) onLanguage(language);
  }, [language, onLanguage]);
};

export {THEMES, useTheme, useLanguage, useAppearanceSync};
