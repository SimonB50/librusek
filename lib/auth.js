import { apiUrl } from "./core";

const authUrls = {
  init: "https://api.librus.pl/OAuth/Authorization?client_id=46&response_type=code&scope=mydata",
  final: "https://api.librus.pl/OAuth/Authorization?client_id=46",
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

const authenticate = async (login, password) => {
  try {
    const initRequest = await fetch(authUrls.init, {
      connectTimeout: 5000,
    });
    if (!initRequest.ok) return { error: "unknown" };
    const formData = new FormData();
    formData.append("action", "login");
    formData.append("login", login);
    formData.append("pass", password);
    const authorization = await fetch(authUrls.final, {
      method: "POST",
      body: formData,
      credentials: "include",
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
    const grant = await fetch(authUrls.grant);
    if (!grant.ok) return false;
    return await activate();
  } catch (error) {
    console.error(error);
    return false;
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
