import {Capacitor} from "@capacitor/core";
import {queryOptions, useQuery} from "@tanstack/react-query";
import {SecureStoragePlugin} from "capacitor-secure-storage-plugin";
import {preferenceQuery, setPreference, usePreference} from "../lib/preferences.js";
import AuthManager from "./auth.js";
import {queryClient} from "./query/client.js";

/**
 * Saved Synergia accounts.
 *
 * Stored with `capacitor-secure-storage-plugin`: Android Keystore / iOS Keychain on device.
 * **On the web the plugin only base64-encodes values in `localStorage`** - passwords are
 * effectively plain text there (the UI says so).
 *
 * The default account (logged in automatically at start) is a regular preference - it holds only the id.
 */

interface SavedAccount {
  id: string;
  /** Nickname shown in the UI */
  name: string;
  login: string;
  password: string;
}

const STORAGE_KEY = "accounts";
const DEFAULT_KEY = "defaultAccount";
const CURRENT_KEY = "currentAccount";

/** The web plugin uses `btoa`, which throws on anything outside Latin-1 (Polish letters) - keep the JSON ASCII only. */
const toAscii = (json: string) => json.replace(/[\u0080-￿]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);

const read = async (): Promise<SavedAccount[]> => {
  try {
    const {value} = await SecureStoragePlugin.get({key: STORAGE_KEY});
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed as SavedAccount[] : [];
  } catch {
    // The plugin rejects when the key does not exist yet
    return [];
  }
};

const write = async (accounts: SavedAccount[]) => {
  await SecureStoragePlugin.set({key: STORAGE_KEY, value: toAscii(JSON.stringify(accounts))});
  queryClient.setQueryData(accountsQuery.queryKey, accounts);
};

const accountsQuery = queryOptions({
  queryKey: ["app", "accounts"],
  queryFn: read,
  staleTime: Infinity,
});

const newId = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const Accounts = {
  /** `true` when passwords are kept in plain `localStorage` (web build). */
  insecureStorage: !Capacitor.isNativePlatform(),

  list: () => queryClient.fetchQuery(accountsQuery),

  /** Adds an account, or updates the one with the same login (new password / name). */
  save: async (input: Omit<SavedAccount, "id">) => {
    const accounts = await read();
    const existing = accounts.find(account => account.login === input.login);
    const saved: SavedAccount = {...input, id: existing?.id ?? newId()};
    await write(existing ? accounts.map(account => (account.id === saved.id ? saved : account)) : [...accounts, saved]);
    return saved;
  },

  remove: async (id: string) => {
    await write((await read()).filter(account => account.id !== id));
    if (await queryClient.fetchQuery(preferenceQuery(DEFAULT_KEY)) === id) await setPreference(DEFAULT_KEY, null);
    if (await queryClient.fetchQuery(preferenceQuery(CURRENT_KEY)) === id) await setPreference(CURRENT_KEY, null);
  },

  setDefault: (id: string | null) => setPreference(DEFAULT_KEY, id),

  getDefault: async () => {
    const id = await queryClient.fetchQuery(preferenceQuery(DEFAULT_KEY));
    if (!id) return null;
    return (await read()).find(account => account.id === id) ?? null;
  },

  /** Which saved account the current session belongs to (`null` = logged in by hand without saving). */
  setCurrent: (id: string | null) => setPreference(CURRENT_KEY, id),

  /** Logs in with a saved account (no session must be active - see {@link Accounts.switchTo}). */
  login: async (account: SavedAccount) => {
    await AuthManager.authorize(account.login, account.password);
    await Accounts.setCurrent(account.id);
    AutoLogin.reset();
  },

  /** Ends the current session first - logging in on top of an active one is not supported. */
  switchTo: async (account: SavedAccount) => {
    await AuthManager.logout();
    await Accounts.login(account);
  },
};

const useAccounts = () => {
  const accounts = useQuery(accountsQuery);
  const defaultId = usePreference(DEFAULT_KEY);
  const currentId = usePreference(CURRENT_KEY);
  return {
    accounts: accounts.data ?? [],
    isPending: accounts.isPending,
    defaultId: defaultId.value,
    currentId: currentId.value,
  };
};

/* Auto login -----------------------------------------------------------------------------------*/

const SUPPRESS_KEY = "librusek.autoLogin.suppressed";
/** Survives the reload after a login, so a session that dies right away can't cause a login loop. */
const ATTEMPTED_KEY = "librusek.autoLogin.attempted";

const session = {
  get: (key: string) => {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string | null) => {
    try {
      if (value === null) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, value);
    } catch {
      // storage unavailable - the in-memory flag still prevents a loop
    }
  },
};

/**
 * The default account is logged in automatically **once per app start**:
 * a failure (changed password, captcha...) must not turn into a login loop, and an explicit
 * logout keeps the user on the login screen until the app is restarted.
 */
const AutoLogin = {
  attempted: false,

  shouldTry: () => !AutoLogin.attempted && session.get(ATTEMPTED_KEY) !== "1" && session.get(SUPPRESS_KEY) !== "1",

  markAttempted: () => {
    AutoLogin.attempted = true;
    session.set(ATTEMPTED_KEY, "1");
  },

  /** After an explicit logout / account switch to the login screen. */
  suppress: () => {
    session.set(SUPPRESS_KEY, "1");
    AutoLogin.markAttempted();
  },

  /** After a successful login - clears the "explicit logout" flag (the per-start attempt stays used). */
  reset: () => session.set(SUPPRESS_KEY, null),
};

/**
 * After a successful login the app is reloaded into `/app/home` - every mounted component
 * (navbar, badges, an open page) starts clean for the new account instead of showing the old one.
 */
const enterApp = () => window.location.assign("/app/home");

export default Accounts;
export {AutoLogin, enterApp, useAccounts};
export type {SavedAccount};
