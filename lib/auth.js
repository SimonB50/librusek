import { fetch } from "@tauri-apps/plugin-http";

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
    const userData = await userResponse.json();
    return userData;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const authenticate = async (login, password) => {
  try {
    const initRequest =  await fetch(authUrls.init, {
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
      if (!errorBody || errorBody.errors.length <= 0) return { error: "unknown" };
      switch (errorBody.errors[0].message) {
        case "Minął termin ważności konta - skontaktuj się z Administratorem Szkoły.":
          return { error: "invalidUser" };
        case "Nieprawidłowy login i/lub hasło.":
          return { error: "invalidCredentials" };
        case "Proszę zaznaczyć pole \"Nie jestem robotem\".":
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


/**
 * Checks if messages are authenticated.
 * @returns {boolean} True if messages are authenticated, false otherwise.
 */
const isMessagesAuthenticated = () => {
  return sessionStorage.getItem('isMessagesAuthenticated') === 'true';
};

/**
 * Authenticates with the Synergia API.
 * @returns {Promise<boolean>} True if authentication succeeds, false otherwise.
 */
const authenticateMessages = async () => {
  if (isMessagesAuthenticated()) return true;

  try {
    const response = await fetch('https://synergia.librus.pl/wiadomosci3');
    if (!response.ok) {
      throw new Error(`Authentication failed with status: ${response.status}`);
    }
    sessionStorage.setItem('isMessagesAuthenticated', 'true');
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    sessionStorage.removeItem('isMessagesAuthenticated');
    return false;
  }
};


export { authenticate, refreshSession, logout, authenticateMessages, isMessagesAuthenticated };
