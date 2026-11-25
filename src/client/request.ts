import HttpClient from "../lib/http.js";
import List from "../lib/list.js";
import Display from "../lib/display.js";
import {RequestError} from "./errors.js";
import {Session} from "./session.js";
import type {Id} from "./types/common.js";

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  /** Fetch only given entities - appended as `/0,1,2` to the path (Synergia convention). */
  ids?: readonly Id[];
  query?: Record<string, QueryValue>;
  pagination?: {
    page: number;
    limit: number;
  };
  /**
   * - `synergia` (default) - unwraps `{ Resource: ..., Resources, Url }` envelope and camelCases keys
   * - `raw` - returns parsed JSON untouched (messages API, or when the envelope carries metadata)
   */
  format?: "synergia" | "raw";
  /**
   * Envelope key to unwrap (`synergia` format only). Defaults to the first key that is not
   * `Resources`/`Url` - set it when a payload has several keys (`{ lendings, lastSynchronizationTimestamp }`).
   */
  envelope?: string;
  signal?: AbortSignal;
}

interface RawResponse {
  url: string;
  status: number;
  statusText: string;
  ok: boolean;
  headers: Record<string, string>;
  text: string;
  json: unknown;
  duration: number;
}

const ENVELOPE_META_KEYS = ["resources", "url"];

abstract class Request {
  static buildUrl = (url: string, options?: Omit<RequestOptions, "format" | "signal">) => {
    const parsedUrl = new URL(url);
    if (options?.ids?.length) {
      const ids = List.deduplicate([...options.ids]);
      // Leading `0` forces Synergia to always respond with a list, even for a single id.
      parsedUrl.pathname = `${parsedUrl.pathname.replace(/\/$/, "")}/0,${ids.join(",")}`;
    }
    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value === undefined || value === null) continue;
        parsedUrl.searchParams.set(key, String(value));
      }
    }
    if (options?.pagination) {
      parsedUrl.searchParams.set("page", options.pagination.page.toString());
      parsedUrl.searchParams.set("limit", options.pagination.limit.toString());
    }
    // Librus ignores encoded commas in list filters (`category=1%2C6` is treated as no filter)
    parsedUrl.search = parsedUrl.searchParams.toString().replace(/%2C/gi, ",");
    return parsedUrl.href;
  }

  /** Recursively lowercases the first letter of every key (`LuckyNumber` -> `luckyNumber`). */
  static camelize = (data: unknown): unknown => {
    if (Array.isArray(data)) return data.map(this.camelize);
    if (data !== null && typeof data === "object") {
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [Display.lowerFirst(key), this.camelize(value)])
      );
    }
    return data;
  }

  /** Synergia wraps every payload as `{ "Grades": [...], "Resources": {...}, "Url": "..." }`. */
  static unwrap = (data: unknown, envelope?: string): unknown => {
    if (data === null || typeof data !== "object" || Array.isArray(data)) return data;
    const key = envelope ?? Object.keys(data).find(k => !ENVELOPE_META_KEYS.includes(k.toLowerCase()));
    return key ? (data as Record<string, unknown>)[key] : data;
  }

  /**
   * Low level fetch - never throws on HTTP status, used by the developer tools.
   * Throws {@link RequestError} only when no response was received.
   */
  static raw = async (url: string, init?: RequestInit): Promise<RawResponse> => {
    const start = performance.now();
    const response = await HttpClient.fetch(url, {
      method: "GET",
      credentials: "include",
      ...init,
    }).catch((cause: unknown) => {
      throw new RequestError(url, "Network request failed", {kind: "network", cause});
    });
    const text = await response.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      // not JSON - keep `text` only
    }
    return {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      text,
      json,
      duration: Math.round(performance.now() - start),
    };
  }

  /**
   * GET returning normalized JSON. Throws {@link RequestError} on any failure.
   *
   * A `401` is retried once after {@link Session.recover} (Synergia `/refreshToken`,
   * or re-activating the messages session) - only a second `401` reaches the UI.
   */
  static get = async <T>(url: string, options?: RequestOptions): Promise<T> => {
    const requestUrl = this.buildUrl(url, options);
    let response = await this.raw(requestUrl, {signal: options?.signal});
    if (this.needsSession(response) && await Session.recover(requestUrl)) {
      response = await this.raw(requestUrl, {signal: options?.signal});
    }

    if (!response.ok) {
      const message = Request.errorMessage(response);
      throw new RequestError(requestUrl, message, {kind: "http", status: response.status, body: response.json ?? response.text});
    }
    // Dev proxy converts redirects into empty 200 responses with this header
    const redirect = response.headers["x-upstream-location"];
    if (redirect) {
      throw new RequestError(requestUrl, `Unexpected redirect to ${redirect}`, {kind: "redirect", status: response.status});
    }
    if (response.json === undefined) {
      throw new RequestError(requestUrl, "Response is not valid JSON", {kind: "parse", status: response.status, body: response.text});
    }

    if (options?.format === "raw") return response.json as T;
    return this.camelize(this.unwrap(response.json, options?.envelope)) as T;
  }

  /**
   * Write request (`POST` by default) - the response body is not required to be JSON.
   * Same `401` recovery as {@link get}. Throws {@link RequestError} when the status is not 2xx.
   */
  static send = async (url: string, init: RequestInit = {}): Promise<RawResponse> => {
    const request = {method: "POST", ...init};
    let response = await this.raw(url, request);
    if (this.needsSession(response) && await Session.recover(url)) {
      response = await this.raw(url, request);
    }
    if (!response.ok) {
      throw new RequestError(url, Request.errorMessage(response), {kind: "http", status: response.status, body: response.json ?? response.text});
    }
    return response;
  }

  /** `401`, or a redirect (to the login page) where JSON was expected. */
  private static needsSession = (response: RawResponse) =>
    response.status === 401 || (response.headers["x-upstream-location"] !== undefined && !response.text);

  private static errorMessage = (response: RawResponse) => {
    // Synergia: `{ Status, Code, Message, MessagePL? }`, messages API: `{ code, errors }`
    const body = response.json as { Code?: string; Message?: string; MessagePL?: string; code?: string; message?: string } | undefined;
    const detail = [body?.Code ?? body?.code, body?.MessagePL ?? body?.Message ?? body?.message].filter(Boolean).join(" - ");
    return `Request failed with ${response.status}${response.statusText ? ` ${response.statusText}` : ""}${detail ? `: ${detail}` : ""}`;
  }
}

export default Request;
export type {RequestOptions, RawResponse};
