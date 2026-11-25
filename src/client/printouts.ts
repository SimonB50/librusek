import HttpClient from "../lib/http.js";
import remotePaths from "./paths.js";

class PrintoutError extends Error {
  readonly code: "session" | "unavailable";

  constructor(code: "session" | "unavailable", message: string) {
    super(message);
    this.name = "PrintoutError";
    this.code = code;
  }
}

/**
 * Synergia printouts (PDF). Read only - a plain `GET` with the Synergia session cookies.
 * An expired session answers with a redirect to the login page instead of a PDF,
 * so the content type is checked before anything is saved.
 */
const fetchPdf = async (url: string) => {
  const response = await HttpClient.fetch(url, {credentials: "include"});
  if (HttpClient.redirectOf(response, url)) throw new PrintoutError("session", "Synergia session expired (redirected)");
  if (!response.ok) throw new PrintoutError("unavailable", `Printout request failed (${response.status})`);
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("pdf")) throw new PrintoutError("unavailable", `Expected a PDF, got "${type || "nothing"}"`);
  return await response.blob();
};

const Printouts = {
  /** Personal data stored by Synergia (the old app's "Download data stored by Synergia"). */
  personalData: () => fetchPdf(remotePaths.printouts.personalData),
};

export default Printouts;
export {PrintoutError};
