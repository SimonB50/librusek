import {useEffect, useReducer, useState, useSyncExternalStore} from "react";
import {Clipboard} from "@capacitor/clipboard";
import {useQueryClient, type Query} from "@tanstack/react-query";
import {RiCursorLine, RiDeleteBinLine, RiDownloadLine, RiFileCopyLine, RiRefreshLine} from "@remixicon/react";
import {ROOT_KEY} from "../../../client/query/resource.js";
import {Modal} from "../../../components/modal.js";
import {saveFile} from "../../../lib/files.js";

const formatAge = (timestamp: number) => {
  if (!timestamp) return "never";
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  return `${Math.round(seconds / 3600)}h ago`;
};

const statusBadge = (query: Query) => {
  if (query.state.fetchStatus === "fetching") return "badge-info";
  if (query.state.status === "error") return "badge-error";
  if (query.state.status === "pending") return "badge-ghost";
  return query.isStale() ? "badge-warning" : "badge-success";
};

const statusLabel = (query: Query) => {
  if (query.state.fetchStatus === "fetching") return "fetching";
  if (query.state.fetchStatus === "paused") return "paused (offline)";
  if (query.state.status === "success" && query.isStale()) return "stale";
  return query.state.status;
};

/** Same breakpoint as Tailwind `xl` - details sit next to the list there, in a modal below it. */
const WIDE = "(min-width: 80rem)";
const useWide = () => useSyncExternalStore(
  (notify) => {
    const media = window.matchMedia(WIDE);
    media.addEventListener("change", notify);
    return () => media.removeEventListener("change", notify);
  },
  () => window.matchMedia(WIDE).matches,
);

const QueryDetails = ({query}: { query: Query }) => {
  "use no memo";
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(query.state.data, null, 2) ?? "undefined";

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the label when another entry is shown
  useEffect(() => setCopied(false), [query.queryHash]);

  const fileName = `cache-${query.queryHash.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80)}.json`;

  return (
    <div className="flex flex-col gap-3 min-h-0">
      <div className="flex flex-row flex-wrap items-center gap-2">
        <span className={`badge badge-sm ${statusBadge(query)}`}>{statusLabel(query)}</span>
        <span className="badge badge-sm badge-ghost">updated {formatAge(query.state.dataUpdatedAt)}</span>
        <span className="badge badge-sm badge-ghost">{query.getObserversCount()} observers</span>
        <span className="badge badge-sm badge-ghost">{(json.length / 1024).toFixed(1)} KB</span>
      </div>
      <div className="flex flex-row flex-wrap gap-1">
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => void queryClient.refetchQueries({queryKey: query.queryKey, exact: true})}>
          <RiRefreshLine/> Refetch
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={async () => {
          await Clipboard.write({string: json});
          setCopied(true);
        }}>
          <RiFileCopyLine/> {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => void saveFile(new Blob([json], {type: "application/json"}), fileName)}>
          <RiDownloadLine/> Download
        </button>
      </div>
      {query.state.error && (
        <div role="alert" className="alert alert-error alert-soft break-all">{query.state.error.message}</div>
      )}
      <pre className="bg-base-300 rounded-box p-4 text-sm overflow-auto min-h-0 max-h-[60vh] xl:max-h-none xl:flex-1"><code>{json}</code></pre>
    </div>
  );
};

/** Live view of the shared query cache - shows exactly what components share. */
const CacheInspector = () => {
  "use no memo"; // reads mutable QueryCache state on every render
  const queryClient = useQueryClient();
  const queryCache = queryClient.getQueryCache();
  const [, rerender] = useReducer((value: number) => value + 1, 0);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const wide = useWide();

  useEffect(() => queryCache.subscribe(() => rerender()), [queryCache]);

  const all = queryCache.getAll();
  const queries = all
    .filter(query => query.queryHash.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => a.queryHash.localeCompare(b.queryHash));
  const selectedQuery = selected ? queryCache.get(selected) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          className="input w-full min-w-0"
          placeholder="Filter by key, e.g. subjects"
          value={filter}
          onChange={event => setFilter(event.target.value)}
        />
        <div className="flex flex-row gap-2 shrink-0">
          <button type="button" className="btn grow" onClick={() => queryClient.invalidateQueries({queryKey: [ROOT_KEY]})}>
            <RiRefreshLine/> Invalidate all
          </button>
          <button type="button" className="btn btn-error btn-soft grow" onClick={() => {
            setSelected(null);
            queryClient.removeQueries({queryKey: [ROOT_KEY]});
          }}>
            <RiDeleteBinLine/> Clear
          </button>
        </div>
      </div>

      <span className="text-sm opacity-70">
        {queries.length === all.length ? `${all.length} entries` : `${queries.length} of ${all.length} entries`}
      </span>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="overflow-x-auto border border-base-300 rounded-box">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Key</th>
                <th>Status</th>
                <th>Updated</th>
                <th className="hidden 2xl:table-cell">Observers</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {queries.map(query => (
                <tr
                  key={query.queryHash}
                  className={`cursor-pointer hover:bg-base-200 ${selected === query.queryHash ? "bg-primary/10" : ""}`}
                  aria-selected={selected === query.queryHash}
                  onClick={() => setSelected(query.queryHash)}
                >
                  <td className="font-mono text-xs break-all">{query.queryHash}</td>
                  <td><span className={`badge badge-sm ${statusBadge(query)}`}>{statusLabel(query)}</span></td>
                  <td className="whitespace-nowrap">{formatAge(query.state.dataUpdatedAt)}</td>
                  <td className="hidden 2xl:table-cell">{query.getObserversCount()}</td>
                  <td className="whitespace-nowrap">
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      title="Refetch"
                      onClick={(event) => {
                        event.stopPropagation();
                        void queryClient.refetchQueries({queryKey: query.queryKey, exact: true});
                      }}
                    >
                      <RiRefreshLine/>
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      title="Remove"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (selected === query.queryHash) setSelected(null);
                        queryClient.removeQueries({queryKey: query.queryKey, exact: true});
                      }}
                    >
                      <RiDeleteBinLine/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Wide screens: details stay in view next to the list while it scrolls */}
        {wide && (
          <aside className="sticky top-20 flex flex-col gap-3 max-h-[calc(100vh-6rem)] p-4 bg-base-200 border border-base-300 rounded-box">
            {selectedQuery
              ? (
                <>
                  <span className="font-semibold font-mono text-sm break-all">{selectedQuery.queryHash}</span>
                  <QueryDetails query={selectedQuery}/>
                </>
              )
              : (
                <div className="flex flex-col items-center gap-2 py-10 text-base-content/60 text-center">
                  <RiCursorLine className="text-3xl"/>
                  Select an entry to see its data
                </div>
              )}
          </aside>
        )}
      </div>

      {!wide && (
        <Modal
          open={!!selectedQuery}
          onClose={() => setSelected(null)}
          title={<span className="font-mono text-base break-all">{selectedQuery?.queryHash}</span>}
          className="max-w-3xl"
        >
          {selectedQuery && <QueryDetails query={selectedQuery}/>}
        </Modal>
      )}
    </div>
  );
};

export default CacheInspector;
