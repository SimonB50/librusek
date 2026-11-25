type RequestErrorKind = "network" | "http" | "parse" | "redirect";

interface RequestErrorOptions {
  kind: RequestErrorKind;
  /** HTTP status code, `0` when the request never got a response. */
  status?: number;
  /** Parsed (or raw text) response body, useful for debugging Librus error payloads. */
  body?: unknown;
  cause?: unknown;
}

/**
 * Every failure of {@link Request} ends up as this error, so UI and the query client
 * can make decisions (redirect to auth, retry or not) without inspecting raw responses.
 */
class RequestError extends Error {
  readonly url: string;
  readonly kind: RequestErrorKind;
  readonly status: number;
  readonly body: unknown;

  constructor(url: string, message: string, options: RequestErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "RequestError";
    this.url = url;
    this.kind = options.kind;
    this.status = options.status ?? 0;
    this.body = options.body;
  }

  /**
   * Session is missing/expired - user has to authenticate again.
   * API endpoints redirect to the login page instead of answering `401` in some cases.
   */
  get auth() {
    return this.status === 401 || this.kind === "redirect";
  }

  /** Client-side errors will not change on retry. */
  get retryable() {
    return this.kind === "network" || this.status >= 500;
  }
}

const isRequestError = (error: unknown): error is RequestError =>
  error instanceof RequestError;

export { RequestError, isRequestError };
export type { RequestErrorKind };
