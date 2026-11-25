import {
  infiniteQueryOptions, queryOptions, useInfiniteQuery as useTanstackInfiniteQuery, useQueries,
  useQuery as useTanstackQuery, type UseQueryResult,
} from "@tanstack/react-query";
import Request, {type RequestOptions} from "../request.js";
import type {Entity, Id, StringId} from "../types/common.js";
import {createBatcher} from "./batcher.js";
import {MINUTE, queryClient} from "./client.js";

/** Root segment of every Librus query key - `queryClient.invalidateQueries({ queryKey: [ROOT_KEY] })` refreshes everything. */
const ROOT_KEY = "librus";

interface UseOptions<TData, TSelected> {
  /** Derive data for this component only - re-renders only when the selected value changes. */
  select?: (data: TData) => TSelected;
  enabled?: boolean;
}

/* -------------------------------------------------------------------------------------------------
 * Resource - single endpoint (optionally parametrized), e.g. `/Grades`, `/Timetables?weekStart=`
 * -----------------------------------------------------------------------------------------------*/

interface ResourceConfig<TData, TParams, TRaw> {
  /** Unique, stable name - becomes part of the query key. */
  name: string;
  url: string | ((params: TParams) => string);
  /** Extra request options derived from params (query string, pagination, envelope, format...). */
  request?: (params: TParams) => Omit<RequestOptions, "signal">;
  /** Map the normalized response into the cached shape (e.g. pick `data`, decode, coerce ids). */
  transform?: (raw: TRaw, params: TParams) => TData;
  /** Side effects after a successful fetch (e.g. invalidate counters the request changed). */
  afterFetch?: (data: TData, params: TParams) => void;
  /** Defaults to 1 minute. */
  staleTime?: number;
  /** Awaited before every request - must be cached/idempotent (e.g. `Session.ensureMessages`). */
  prepare?: () => Promise<unknown>;
}

/**
 * @typeParam TData - cached value
 * @typeParam TParams - query params (part of the query key), `void` when none
 * @typeParam TRaw - response after `Request.get` normalization, before `transform`
 */
const defineResource = <TData, TParams = void, TRaw = TData>(config: ResourceConfig<TData, TParams, TRaw>) => {
  const key = (params?: TParams) =>
    params === undefined ? [ROOT_KEY, config.name] as const : [ROOT_KEY, config.name, params] as const;

  const staleTime = config.staleTime ?? MINUTE;

  const fetcher = async (params: TParams, signal?: AbortSignal): Promise<TData> => {
    await config.prepare?.();
    const url = typeof config.url === "function" ? config.url(params) : config.url;
    const raw = await Request.get<TRaw>(url, {...config.request?.(params), signal});
    const data = config.transform ? config.transform(raw, params) : raw as unknown as TData;
    config.afterFetch?.(data, params);
    return data;
  };

  const options = (params: TParams) => queryOptions({
    queryKey: key(params),
    queryFn: ({signal}) => fetcher(params, signal),
    staleTime,
  });

  function useQuery(params: TParams): UseQueryResult<TData>;
  function useQuery<TSelected = TData>(params: TParams, options: UseOptions<TData, TSelected>): UseQueryResult<TSelected>;
  function useQuery<TSelected = TData>(params: TParams, useOptions?: UseOptions<TData, TSelected>) {
    return useTanstackQuery<TData, Error, TSelected>({
      queryKey: key(params),
      queryFn: ({signal}) => fetcher(params, signal),
      staleTime,
      select: useOptions?.select,
      enabled: useOptions?.enabled,
    });
  }

  return {
    name: config.name,
    /** Query key - pass without params to target every variant (e.g. all timetable weeks). */
    key,
    /** For `useQueries`, `queryClient.fetchQuery`, `prefetchQuery`, `ensureQueryData`... */
    options,
    useQuery,
    fetch: (params: TParams) => queryClient.fetchQuery(options(params)),
    prefetch: (params: TParams) => queryClient.prefetchQuery(options(params)),
    invalidate: (params?: TParams) => queryClient.invalidateQueries({queryKey: key(params)}),
  };
};

/* -------------------------------------------------------------------------------------------------
 * Dictionary - entities fetched by id, e.g. `/Subjects/0,1,2`, `/Users/0,5,6`
 * Verified: unknown ids are silently skipped, `/X/<id>` alone answers with a singular envelope.
 * -----------------------------------------------------------------------------------------------*/

interface DictionaryConfig {
  name: string;
  url: string;
  /** Envelope key when not auto-detectable. */
  envelope?: string;
  /** Dictionaries rarely change during a session - defaults to `Infinity`. */
  staleTime?: number;
  /** Max ids per request. */
  maxBatchSize?: number;
}

interface DictionaryResult<T> {
  /** Entities by id - missing ids are absent (not yet loaded, or unknown to Librus). */
  byId: ReadonlyMap<Id, T>;
  /** Loaded entities in the order of requested ids. */
  list: T[];
  /** Same as `list` - lets `<QueryState query={X.useMany(ids)}>` work. */
  data: T[];
  get: (id: Id | string | null | undefined) => T | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}

type AnyId = Id | string;

/**
 * Some endpoints (e.g. `/Timetables`) send numeric ids as strings - `"12"` and `12` must hit
 * the same cache entry, otherwise the same entity is fetched twice.
 */
const normalizeId = (id: AnyId): Id => (typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id) as Id;

const toIdList = (ids: Iterable<AnyId | null | undefined>) =>
  [...new Set([...ids].filter((id): id is AnyId => id !== null && id !== undefined).map(normalizeId))];

const defineDictionary = <T extends Entity<Id | StringId>>(config: DictionaryConfig) => {
  const staleTime = config.staleTime ?? Infinity;

  const key = (id?: AnyId) =>
    id === undefined ? [ROOT_KEY, config.name] as const : [ROOT_KEY, config.name, "id", normalizeId(id)] as const;
  const allKey = [ROOT_KEY, config.name, "all"] as const;

  const seed = (items: readonly T[]) => {
    for (const item of items) queryClient.setQueryData(key(item.id), item, {updatedAt: Date.now()});
  };

  const batcher = createBatcher<Id, T>(async (ids) => {
    const items = await Request.get<T[] | T>(config.url, {ids, envelope: config.envelope});
    const list = Array.isArray(items) ? items : [items];
    return new Map(list.map(item => [normalizeId(item.id), item]));
  }, {maxBatchSize: config.maxBatchSize});

  const one = (id: AnyId) => queryOptions({
    queryKey: key(id),
    queryFn: () => batcher.load(normalizeId(id)),
    staleTime,
  });

  /** Whole collection (`GET /Subjects`) - also seeds per-id cache entries. */
  const all = () => queryOptions({
    queryKey: allKey,
    queryFn: async ({signal}) => {
      const items = await Request.get<T[]>(config.url, {signal, envelope: config.envelope});
      seed(items);
      return items;
    },
    staleTime,
  });

  /** One entity - concurrent calls from many components are merged into a single request. */
  const useOne = (id: AnyId | null | undefined) =>
    useTanstackQuery({...one(id ?? 0), enabled: id !== null && id !== undefined});

  /** Many entities at once - shares the same per-id cache as {@link useOne}. */
  const useMany = (ids: Iterable<AnyId | null | undefined> | null | undefined): DictionaryResult<T> => {
    const idList = toIdList(ids ?? []);
    return useQueries({
      queries: idList.map(one),
      combine: (results) => {
        const byId = new Map<Id, T>();
        for (const result of results) {
          if (result.data) byId.set(normalizeId(result.data.id), result.data);
        }
        const error = results.find(result => result.error)?.error ?? null;
        const list = [...byId.values()];
        return {
          byId,
          list,
          data: list,
          get: (id: AnyId | null | undefined) => (id === null || id === undefined ? undefined : byId.get(normalizeId(id))),
          isPending: results.some(result => result.isPending),
          isError: error !== null,
          error,
        };
      },
    });
  };

  const useAll = () => useTanstackQuery(all());

  return {
    name: config.name,
    key,
    one,
    all,
    useOne,
    useMany,
    useAll,
    seed,
    fetchOne: (id: AnyId) => queryClient.fetchQuery(one(id)),
    fetchMany: (ids: Iterable<AnyId>) => Promise.all(toIdList(ids).map(id => queryClient.fetchQuery(one(id)))),
    invalidate: () => queryClient.invalidateQueries({queryKey: key()}),
  };
};

/* -------------------------------------------------------------------------------------------------
 * Infinite resource - page based lists, e.g. messages `?page=1&limit=20`
 * -----------------------------------------------------------------------------------------------*/

interface Page<TItem> {
  items: TItem[];
  /** Total number of items on the server, when known. */
  total?: number;
}

interface InfiniteResourceConfig<TItem, TParams, TRaw> {
  name: string;
  url: string | ((params: TParams) => string);
  /** Request options for a page - pages are 1-based. */
  request: (params: TParams, page: number) => Omit<RequestOptions, "signal">;
  /** Map a page response into items (+ total). */
  transform: (raw: TRaw, params: TParams) => Page<TItem>;
  /** Items per page - used to detect the last page when `total` is unknown. */
  pageSize: (params: TParams) => number;
  staleTime?: number;
  prepare?: () => Promise<unknown>;
}

const defineInfiniteResource = <TItem, TParams, TRaw = unknown>(config: InfiniteResourceConfig<TItem, TParams, TRaw>) => {
  const key = (params?: TParams) =>
    params === undefined ? [ROOT_KEY, config.name] as const : [ROOT_KEY, config.name, params] as const;
  const staleTime = config.staleTime ?? MINUTE;

  const fetchPage = async (params: TParams, page: number, signal?: AbortSignal) => {
    await config.prepare?.();
    const url = typeof config.url === "function" ? config.url(params) : config.url;
    const raw = await Request.get<TRaw>(url, {...config.request(params, page), signal});
    return config.transform(raw, params);
  };

  const options = (params: TParams) => infiniteQueryOptions({
    queryKey: key(params),
    queryFn: ({pageParam, signal}) => fetchPage(params, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage: Page<TItem>, pages: Page<TItem>[], lastPageParam: number) => {
      const loaded = pages.reduce((sum, page) => sum + page.items.length, 0);
      if (lastPage.total !== undefined) return loaded < lastPage.total ? lastPageParam + 1 : undefined;
      return lastPage.items.length < config.pageSize(params) ? undefined : lastPageParam + 1;
    },
    staleTime,
  });

  /** Flattened `items` + `total`, plus everything from `useInfiniteQuery` (`fetchNextPage`, `hasNextPage`...). */
  const useInfinite = (params: TParams, {enabled}: { enabled?: boolean } = {}) => {
    const query = useTanstackInfiniteQuery({...options(params), enabled});
    const pages = query.data?.pages;
    return {
      ...query,
      items: pages?.flatMap(page => page.items) ?? [],
      total: pages?.[0]?.total,
    };
  };

  return {
    name: config.name,
    key,
    options,
    fetchPage,
    useInfinite,
    invalidate: (params?: TParams) => queryClient.invalidateQueries({queryKey: key(params)}),
  };
};

/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/

interface CombinedResult<T> {
  /** `undefined` until at least one of the queries has data. */
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Merge several queries into one status object.
 * Data from successful queries is still delivered when others fail (partial results).
 */
const combineResults = <TResults extends UseQueryResult[], TData>(
  results: TResults,
  merge: (results: TResults) => TData,
): CombinedResult<TData> => {
  const error = results.find(result => result.error)?.error ?? null;
  return {
    data: results.some(result => result.data !== undefined) ? merge(results) : undefined,
    isPending: results.some(result => result.isPending),
    isError: error !== null,
    error,
  };
};

export {ROOT_KEY, defineResource, defineDictionary, defineInfiniteResource, combineResults, normalizeId};
export type {DictionaryResult, CombinedResult, UseOptions, Page};
