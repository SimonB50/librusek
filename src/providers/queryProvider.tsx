import {lazy, Suspense, useEffect, type ReactNode} from "react";
import {QueryClientProvider} from "@tanstack/react-query";
import {onAuthError, queryClient} from "../client/query/client.js";
import {useError} from "./errorProvider.js";

const Devtools = import.meta.env.DEV
  ? lazy(() => import("@tanstack/react-query-devtools").then(m => ({default: m.ReactQueryDevtools})))
  : () => null;

/** Bridges query-level auth failures (401) to the auth redirect in {@link ErrorProvider}. */
const AuthErrorBridge = () => {
  const {authError} = useError();
  useEffect(() => onAuthError(() => authError(true)), [authError]);
  return null;
};

const QueryProvider = ({children}: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthErrorBridge/>
    {children}
    <Suspense>
      <Devtools buttonPosition="bottom-left"/>
    </Suspense>
  </QueryClientProvider>
);

export default QueryProvider;
