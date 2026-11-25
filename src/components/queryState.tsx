import type {ReactNode} from "react";
import {RiAlertFill} from "@remixicon/react";
import {useError} from "../providers/errorProvider.js";

interface QueryLike<T> {
  data: T | undefined | null;
  isPending: boolean;
  error: Error | null;
}

interface QueryStateProps<T> {
  query: QueryLike<T>;
  /** Rendered when data is available. */
  children: (data: T) => ReactNode;
  /** Tailwind classes for skeleton & error tile (height!). */
  className?: string;
  /** Override loading placeholder. */
  loading?: ReactNode;
  /** Rendered when the request succeeded with no data (`null`/`undefined`). */
  empty?: ReactNode;
}

const ErrorTile = ({error, className = "h-24"}: { error: Error; className?: string }) => {
  const {openError} = useError();
  return (
    <button
      type="button"
      className={`flex flex-row gap-2 items-center justify-center border border-error text-error rounded-box cursor-pointer w-full ${className}`}
      onClick={() => openError(error)}
    >
      <RiAlertFill className="size-6"/>
      <span className="text-xl text-center">Failed to fetch</span>
    </button>
  );
};

const Skeleton = ({className = "h-24"}: { className?: string }) => (
  <div className={`skeleton ${className}`}></div>
);

/**
 * Standard loading / error / data switch for any query (or `combineResults`/`useMany` result).
 *
 * ```tsx
 * <QueryState query={School.useQuery()}>{school => <span>{school.name}</span>}</QueryState>
 * ```
 */
const QueryState = <T, >({query, children, className, loading, empty = null}: QueryStateProps<T>) => {
  if (query.error && query.data == null) return <ErrorTile error={query.error} className={className}/>;
  if (query.isPending) return loading ?? <Skeleton className={className}/>;
  if (query.data == null) return empty;
  return children(query.data);
};

export {QueryState, ErrorTile, Skeleton};
// biome-ignore lint/style/useComponentExportOnlyModules: type-only export, erased at runtime
export type {QueryLike};
