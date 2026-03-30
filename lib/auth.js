import { apiUrl } from "./core";

const authUrls = {
  init: "https://synergia.librus.pl/loguj/portalRodzina?v=",
  auth: "https://api.librus.pl/OAuth/Authorization?client_id=46",
  mfa: "https://api.librus.pl/OAuth/Authorization/PerformLogin?client_id=46",
  perform: "https://api.librus.pl/OAuth/Authorization/PerformLogin?client_id=46",
  grant: "https://api.librus.pl/OAuth/Authorization/Grant?client_id=46",
};

const activate = async () => {
  try {
    const tokenRequest = await fetch(`${apiUrl}/Auth/TokenInfo`);
    if (!tokenRequest.ok) return false;
    const tokenInfo = await tokenRequest.json();
    const identifier = tokenInfo.UserIdentifier;
    const userResponse = await fetch(`${apiUrl}/Auth/UserInfo/${identifier}`);
    if (!userResponse.ok) return false;
    const userData = await userResponse.json();
    await fetch("https://synergia.librus.pl/wiadomosci2");
    return userData;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const getBaner = () => {
  const turnips = Date.now()
    .toString()
    .split("")
    .map(function (l) {
      return String.fromCharCode(l.charCodeAt(0) + 20);
    })
    .join("")
  const preTurnips = Math.random()
    .toString()
    .split("")
    .map(function (l) {
      return String.fromCharCode(l.charCodeAt(0) + 20);
    })
    .join("")
  return preTurnips + String.fromCharCode(95) + turnips;
}

const authenticate = async (login, password) => {
  try {
    const initRequest = await fetch(authUrls.init + Date.now() / 1000, {
      connectTimeout: 5000,
      headers: {
        "Referer": "https://portal.librus.pl/"
      }
    });
    if (!initRequest.ok) return { error: "unknown" };
    const prep = initRequest.headers.get("location");
    await fetch(prep, {
      headers: {
        "Referer": "https://portal.librus.pl/"
      }
    })
    await fetch(authUrls.auth)
    const formData = new FormData();
    formData.append("action", "login");
    formData.append("login", login);
    formData.append("pass", password);
    const authorization = await fetch(authUrls.auth, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-Baner": getBaner(),
        "Referer": authUrls.auth
      }
    });
    if (authorization.status !== 200) {
      const errorBody = await authorization.json();
      if (!errorBody || errorBody.errors.length <= 0)
        return { error: "unknown" };
      switch (errorBody.errors[0].message) {
        case "Minął termin ważności konta - skontaktuj się z Administratorem Szkoły.":
          return { error: "invalidUser" };
        case "Nieprawidłowy login i/lub hasło.":
          return { error: "invalidCredentials" };
        case 'Proszę zaznaczyć pole "Nie jestem robotem".':
          return { error: "invalidCaptcha" };
      }
      return { error: "unknown" };
    }
    const mfa = await fetch(authUrls.mfa);
    if (!mfa.ok) return { error: "unknown" };
    const perform = await fetch(authUrls.perform);
    if (!perform.ok) return { error: "unknown" };
    const grant = await fetch(authUrls.grant);
    if (!grant.ok) return { error: "unknown" };
    return await activate();
  } catch (error) {
    console.error(error);
    return { error: "unknown" };
  }
};

const refreshSession = async () => {
  try {
    const refresh = await fetch(`https://synergia.librus.pl/refreshToken`);
    if (!refresh.ok) return await authenticate();
    await fetch("https://synergia.librus.pl/wiadomosci2");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const logout = async () => {
  try {
    sessionStorage.clear();
    await fetch(`https://synergia.librus.pl/wyloguj`);
  } catch (error) {
    console.error(error);
  }
};

export { authenticate, refreshSession, logout };
