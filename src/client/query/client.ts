import {QueryCache, QueryClient} from "@tanstack/react-query";
import {isRequestError, type RequestError} from "../errors.js";

type AuthErrorListener = (error: RequestError) => void;
const authListeners = new Set<AuthErrorListener>();

/** Subscribe to "session expired" events coming from any query. Returns unsubscribe. */
const onAuthError = (listener: AuthErrorListener) => {
  authListeners.add(listener);
  return () => {
    authListeners.delete(listener);
  };
};

const MINUTE = 60 * 1000;

/**
 * Single app-wide cache. Every component asking for the same resource key shares
 * one request and one copy of the data - no prop drilling or context needed.
 */
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // The messages module has its own session - a broken one must not log the user out of Synergia
      if (isRequestError(error) && error.auth && !error.url.includes("wiadomosci.librus.pl"))
        for (const listener of authListeners) listener(error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: MINUTE,
      gcTime: 30 * MINUTE,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) =>
        isRequestError(error) && error.retryable && failureCount < 2,
    },
  },
});

export {queryClient, onAuthError, MINUTE};
