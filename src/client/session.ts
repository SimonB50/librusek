import HttpClient, {type FollowResult} from "../lib/http.js";
import remotePaths from "./paths.js";

/**
 * Shares one in-flight promise between concurrent callers; the next call after it
 * settles runs `fn` again. Unlike {@link once} the result is not cached.
 */
const shared = <T>(fn: () => Promise<T>) => {
  let inflight: Promise<T> | undefined;
  return () => {
    inflight ??= fn().finally(() => {
      inflight = undefined;
    });
    return inflight;
  };
};

/** Runs `fn` once and caches the result; re-runs after a failure or `reset()`. */
const once = <T>(fn: () => Promise<T>) => {
  let promise: Promise<T> | undefined;
  const run = () => {
    promise ??= fn().catch((error: unknown) => {
      promise = undefined;
      throw error;
    });
    return promise;
  };
  return Object.assign(run, {
    reset: () => {
      promise = undefined;
    },
  });
};

/**
 * Session prerequisites of every Librus service. Used by {@link Request} to recover
 * from `401` automatically, and by `AuthManager` on login/logout.
 *
 * - Synergia API: cookie session, extended with `GET /refreshToken` (what the official
 *   web client does on every 401 - verified).
 * - Messages (wiadomosci.librus.pl): separate cookie session created by following the
 *   redirect chain of `synergia.librus.pl/wiadomosci3` (link used by the official client).
 */
const Session = {
  /** Extends the Synergia session. Resolves `true` when Librus accepted it. */
  refreshSynergia: shared(async () => {
    const response = await HttpClient.fetch(remotePaths.auth.refresh, {credentials: "include"});
    return response.ok && !HttpClient.redirectOf(response, remotePaths.auth.refresh);
  }),

  /** Activates the messages session (cached until {@link Session.reset}). */
  ensureMessages: once<FollowResult>(async () => {
    const result = await HttpClient.follow(remotePaths.auth.messages);
    // Native HTTP may follow redirects on its own, so check the outcome instead of the chain
    const probe = await HttpClient.fetch(remotePaths.resources.messages.me, {credentials: "include"});
    if (!probe.ok) {
      throw new Error(`Messages session was not activated (${probe.status}), redirect chain: ${result.hops.join(" -> ")}`);
    }
    return result;
  }),

  /** Re-activates the messages session - concurrent 401s share one redirect chain. */
  renewMessages: shared(async () => {
    Session.ensureMessages.reset();
    await Session.ensureMessages();
    return true;
  }),

  /** Forget cached sessions - call on login and logout. */
  reset: () => {
    Session.ensureMessages.reset();
  },

  /**
   * Tries to recover a session after `401` from `url`.
   * Resolves `true` when the request is worth retrying.
   */
  recover: async (url: string) => {
    if (url.startsWith(remotePaths.base.messages)) {
      return Session.renewMessages().catch(() => false);
    }
    if (url.startsWith(remotePaths.base.api)) {
      return Session.refreshSynergia().catch(() => false);
    }
    return false;
  },
};

export {Session, once, shared};
