interface FollowResult {
  /** Last response in the chain (no further redirect). */
  response: Response;
  /** URL that produced {@link response}. */
  url: string;
  /** Every visited URL, starting with the requested one - tokens masked, safe to display/log. */
  hops: string[];
}

/** Masks SSO tokens (long path segments and query values) so redirect chains can be shown/logged. */
const maskUrl = (url: string) => url
  .replace(/\/[A-Za-z0-9_-]{32,}(?=\/|$|\?)/g, "/…")
  .replace(/([?&][^=&]+=)[^&]{16,}/g, "$1…");

export default abstract class HttpClient {
  private static isProxy = import.meta.env.DEV;
  private static remoteRegex = /^https:\/\/(?:[A-Za-z0-9-]+\.)?librus\.pl(?:\/.*)?$/;

  /** Dev: `https://host/path?q` -> `/proxy/host/path?q` (see vite.config.ts). */
  private static parseUrl = (url: string) => {
    const isSafe = this.remoteRegex.test(url);
    if (!isSafe) throw new Error(`Provided request URL "${url}" is not allowed to be fetched.`);
    if (!this.isProxy) return url;
    const parsed = new URL(url);
    return `/proxy/${parsed.host}${parsed.pathname}${parsed.search}`;
  };

  static fetch = (url: string, options?: RequestInit) => {
    return fetch(this.parseUrl(url), {
      redirect: "manual",
      ...options,
    });
  };

  /**
   * Redirect target of a response, or `null`.
   * - dev proxy turns redirects into `200` + `x-upstream-location`
   * - native (CapacitorHttp) exposes a regular `3xx` + `location`
   */
  static redirectOf = (response: Response, url: string) => {
    const location = response.headers.get("x-upstream-location")
      ?? (response.status >= 300 && response.status < 400 ? response.headers.get("location") : null);
    return location ? new URL(location, url).href : null;
  };

  /**
   * Follows a redirect chain hop by hop, so every `Set-Cookie` on the way is stored.
   * Needed for SSO style flows (e.g. Synergia -> wiadomosci.librus.pl) - `fetch` with
   * `redirect: "follow"` cannot be used through the proxy and loses cross-origin cookies.
   */
  static follow = async (url: string, options?: RequestInit, maxHops = 10): Promise<FollowResult> => {
    const hops = [maskUrl(url)];
    let current = url;
    for (let hop = 0; hop <= maxHops; hop++) {
      const response = await this.fetch(current, {credentials: "include", ...options});
      const next = this.redirectOf(response, current);
      if (!next) return {response, url: current, hops};
      // Only follow redirects that stay within librus.pl
      if (!this.remoteRegex.test(next)) return {response, url: current, hops: [...hops, maskUrl(next)]};
      current = next;
      hops.push(maskUrl(next));
    }
    throw new Error(`Too many redirects (${maxHops}) starting at ${url}`);
  };
}

export {maskUrl};
export type {FollowResult};
