import remotePaths from "./paths.js";
import HttpClient from "../lib/http.js";
import {queryClient} from "./query/client.js";
import {ROOT_KEY} from "./query/resource.js";
import {TRANSLATION_KEY} from "../lib/translation/keys.js";
import {Session} from "./session.js";
import type {TokenInfo} from "./types/index.js";

type AuthErrorCode = "invalidUser" | "invalidCredentials" | "invalidCaptcha" | "unknown";

class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? `Authorization failed: ${code}`);
    this.name = "AuthError";
    this.code = code;
  }
}

/** Librus error messages -> stable codes (same mapping as the old app). */
const authErrorMessages: Record<string, AuthErrorCode> = {
  "Minął termin ważności konta - skontaktuj się z Administratorem Szkoły.": "invalidUser",
  "Nieprawidłowy login i/lub hasło.": "invalidCredentials",
  "Proszę zaznaczyć pole \"Nie jestem robotem\".": "invalidCaptcha",
};

const ensureOk = (response: Response) => {
  if (!response.ok) throw new AuthError("unknown", `Authorization step failed (${response.status}): ${response.url}`);
  return response;
};

export default abstract class AuthManager {
  private static getBaner = () => {
    const encode = (value: string) => value
      .split("")
      .map(l => String.fromCharCode(l.charCodeAt(0) + 20))
      .join("");
    return encode(Math.random().toString()) + String.fromCharCode(95) + encode(Date.now().toString());
  }

  static authorize = async (login: string, password: string) => {
    // Prepare client for auth
    const initRequest = ensureOk(await HttpClient.fetch(remotePaths.auth.init(), {
      headers: {"Referer": "https://portal.librus.pl/"},
    }));
    // TODO: verify native (CapacitorHttp) redirect handling - it may follow redirects on its own
    const prepUrl = HttpClient.redirectOf(initRequest, remotePaths.auth.init());
    if (prepUrl) await HttpClient.fetch(prepUrl, {
      headers: {"Referer": "https://portal.librus.pl/"},
    });
    await HttpClient.fetch(remotePaths.auth.login);

    // Perform login with provided credentials
    const formData = new FormData();
    formData.append("action", "login");
    formData.append("login", login);
    formData.append("pass", password);
    const authRequest = await HttpClient.fetch(remotePaths.auth.login, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-Baner": this.getBaner(),
        "Referer": remotePaths.auth.login,
      },
    });
    if (!authRequest.ok) {
      const body = await authRequest.json().catch(() => null) as { errors?: { message: string }[] } | null;
      const message = body?.errors?.[0]?.message;
      throw new AuthError(message ? authErrorMessages[message] ?? "unknown" : "unknown", message);
    }

    // Post auth tasks
    ensureOk(await HttpClient.fetch(remotePaths.auth.mfa));
    ensureOk(await HttpClient.fetch(remotePaths.auth.perform));
    const grantRequest = ensureOk(await HttpClient.fetch(remotePaths.auth.grant));
    const portalUrl = HttpClient.redirectOf(grantRequest, remotePaths.auth.grant);
    if (portalUrl) await HttpClient.fetch(portalUrl);

    // Activate Synergia session
    const tokenRequest = ensureOk(await HttpClient.fetch(remotePaths.auth.token));
    const tokenInfo = await tokenRequest.json() as TokenInfo;
    const userRequest = ensureOk(await HttpClient.fetch(remotePaths.auth.user(tokenInfo.UserIdentifier)));

    // Drop Librus data of a previous account - app preferences and saved accounts stay
    queryClient.removeQueries({queryKey: [ROOT_KEY]});
    queryClient.removeQueries({queryKey: TRANSLATION_KEY});
    Session.reset();
    return await userRequest.json() as unknown;
  }

  /** Extends the Synergia session (also done automatically on `401`, see `Request.get`). */
  static refreshSession = () => Session.refreshSynergia();

  static logout = async () => {
    queryClient.removeQueries({queryKey: [ROOT_KEY]});
    queryClient.removeQueries({queryKey: TRANSLATION_KEY});
    Session.reset();
    await HttpClient.fetch(remotePaths.auth.logout, {credentials: "include"}).catch(() => undefined);
  }
}

export {AuthError};
export type {AuthErrorCode};
