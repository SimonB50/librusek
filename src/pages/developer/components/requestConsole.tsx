import {useState} from "react";
import {Clipboard} from "@capacitor/clipboard";
import {RiDownloadLine, RiFileCopyLine, RiHistoryLine, RiSendPlaneLine} from "@remixicon/react";
import Request, {type RawResponse} from "../../../client/request.js";
import remotePaths from "../../../client/paths.js";
import {Session} from "../../../client/session.js";
import HttpClient, {maskUrl} from "../../../lib/http.js";
import {isRequestError} from "../../../client/errors.js";
import {saveFile} from "../../../lib/files.js";

const bases = [
  {label: "Synergia API 2.0", url: `${remotePaths.base.api}/`},
  {label: "Synergia", url: `${remotePaths.base.synergia}/`},
  {label: "Messages API", url: `${remotePaths.base.messages}/`, messages: true},
] as const;

/** Every string in a nested object (`remotePaths.resources` has a nested `messages` group). */
const collectUrls = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") return Object.values(value).flatMap(collectUrls);
  return [];
};

/** Known endpoints relative to their base - offered as autocomplete. */
const knownPaths = [...new Set(collectUrls(remotePaths.resources)
  .flatMap(url => bases.filter(base => url.startsWith(base.url)).map(base => url.slice(base.url.length))))];

const HISTORY_KEY = "developer.history";
const HISTORY_LIMIT = 15;

const readHistory = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
};

const writeHistory = (history: string[]) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // storage unavailable - history is a convenience only
  }
};

interface ConsoleResult {
  /** What was asked for - kept with the result, the form can change afterwards */
  request: { base: string; url: string; follow: boolean; at: Date };
  response?: RawResponse;
  /** Redirect chain when "Follow redirects" is on */
  hops?: string[];
  error?: string;
}

const formatBody = (response: RawResponse, normalize: boolean) => {
  if (response.json === undefined) return response.text || "<empty body>";
  const data = normalize ? Request.camelize(Request.unwrap(response.json)) : response.json;
  return JSON.stringify(data, null, 2);
};

/** Headers that can carry session secrets - never written to a saved report. */
const SECRET_HEADERS = /^(set-cookie|cookie|authorization|.*token.*)$/i;

const formatSize = (text: string) => `${(text.length / 1024).toFixed(1)} KB`;

/** Plain-text report of one request - for bug reports / comparing with the old app. */
const buildReport = (result: ConsoleResult, body: string | null, normalize: boolean) => {
  const {request, response, hops, error} = result;
  const lines = [
    "Librusek - developer request",
    `App version: ${__APP_VERSION__}`,
    `Time:        ${request.at.toISOString()}`,
    "Method:      GET",
    `API:         ${request.base}`,
    `URL:         ${maskUrl(request.url)}`,
    `Options:     follow redirects ${request.follow ? "on" : "off"}, normalized body ${normalize ? "on" : "off"}`,
    "",
  ];
  if (error) lines.push("Error:", maskUrl(error), "");
  if (hops && hops.length > 1) lines.push(`Redirect chain (${hops.length - 1} hops):`, ...hops.map((hop, index) => `  ${index + 1}. ${hop}`), "");
  if (response) {
    lines.push(
      `Status:      ${response.status} ${response.statusText}`,
      `Duration:    ${response.duration} ms`,
      `Size:        ${formatSize(response.text)}`,
      "",
      "Headers:",
      ...Object.entries(response.headers).map(([key, value]) => `  ${key}: ${SECRET_HEADERS.test(key) ? "<redacted>" : value}`),
      "",
      "Body:",
      body ?? "",
    );
  }
  return `${lines.join("\n")}\n`;
};

const reportName = (result: ConsoleResult) => {
  const path = result.request.url.split("?")[0].split("/").filter(Boolean).slice(-2).join("-").replace(/[^\w.-]+/g, "_") || "request";
  const stamp = result.request.at.toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `request-${path}-${stamp}.txt`;
};

const statusClass = (status: number) => {
  if (status >= 200 && status < 300) return "badge-success";
  if (status >= 300 && status < 400) return "badge-warning";
  return "badge-error";
};

const RequestConsole = () => {
  const [baseIndex, setBaseIndex] = useState(0);
  const [path, setPath] = useState("Me");
  const [normalize, setNormalize] = useState(false);
  const [follow, setFollow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConsoleResult | null>(null);
  const [history, setHistory] = useState<string[]>(readHistory);
  const [copied, setCopied] = useState(false);

  const base = bases[baseIndex];

  const send = async (requestPath = path) => {
    const url = `${base.url}${requestPath.replace(/^\//, "")}`;
    const request = {base: base.label, url, follow, at: new Date()};
    setLoading(true);
    setResult(null);
    setCopied(false);
    try {
      if ("messages" in base) await Session.ensureMessages();
      if (follow) {
        // Walk the chain hop by hop (stores cookies of every hop), then show the last response
        const {url: finalUrl, hops} = await HttpClient.follow(url);
        setResult({request, response: await Request.raw(finalUrl), hops});
      } else {
        setResult({request, response: await Request.raw(url)});
      }
      const entry = `${baseIndex}|${requestPath}`;
      const next = [entry, ...history.filter(item => item !== entry)].slice(0, HISTORY_LIMIT);
      setHistory(next);
      writeHistory(next);
    } catch (error) {
      setResult({request, error: isRequestError(error) ? `${error.message} (${error.url})` : String(error)});
    } finally {
      setLoading(false);
    }
  };

  const body = result?.response ? formatBody(result.response, normalize) : null;
  const redirect = result?.response?.headers["x-upstream-location"];

  const preview = `${base.url}${path.replace(/^\//, "")}`;

  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex flex-col gap-3 p-4 bg-base-200 border border-base-300 rounded-box"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-base-content/70">API</span>
          <div role="radiogroup" aria-label="API" className="tabs tabs-box tabs-sm w-fit max-w-full flex-wrap">
            {bases.map((item, index) => (
              <input
                key={item.url}
                type="radio"
                name="developer-base"
                className="tab"
                aria-label={item.label}
                checked={baseIndex === index}
                onChange={() => setBaseIndex(index)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="developer-path" className="text-sm font-semibold text-base-content/70">Path</label>
          <div className="join w-full">
            <input
              id="developer-path"
              type="text"
              list="developer-known-paths"
              placeholder="e.g. Grades or Subjects/0,1,2"
              className="input join-item w-full font-mono"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={path}
              onChange={event => setPath(event.target.value)}
            />
            <datalist id="developer-known-paths">
              {knownPaths.map(item => <option key={item} value={item}/>)}
            </datalist>
            <button type="submit" className="btn btn-primary join-item" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm"></span> : <RiSendPlaneLine/>}
              GET
            </button>
          </div>
          <span className="font-mono text-xs text-base-content/60 break-all" title="Full request URL">{preview}</span>
        </div>

        <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-base-300">
          <label className="label cursor-pointer gap-2 text-sm text-base-content">
            <input type="checkbox" className="toggle toggle-sm" checked={normalize} onChange={event => setNormalize(event.target.checked)}/>
            Normalized body
            <span className="text-base-content/60 hidden sm:inline">(unwrap + camelCase, as the app sees it)</span>
          </label>
          <label className="label cursor-pointer gap-2 text-sm text-base-content">
            <input type="checkbox" className="toggle toggle-sm" checked={follow} onChange={event => setFollow(event.target.checked)}/>
            Follow redirects
          </label>
          {history.length > 0 && (
            <div className="dropdown dropdown-end ml-auto">
              <div tabIndex={0} role="button" className="btn btn-sm btn-ghost">
                <RiHistoryLine/> History
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 border border-base-300 rounded-box z-10 w-80 max-w-[calc(100vw-2rem)] p-2 shadow-sm max-h-80 overflow-y-auto flex-nowrap">
                {history.map(item => {
                  const [index, itemPath] = item.split("|");
                  return (
                    <li key={item}>
                      <button type="button" className="flex flex-col items-start gap-0" onClick={() => {
                        setBaseIndex(Number(index));
                        setPath(itemPath);
                        (document.activeElement as HTMLElement | null)?.blur();
                      }}>
                        <span className="text-xs text-base-content/60">{bases[Number(index)]?.label}</span>
                        <span className="font-mono break-all">{itemPath}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </form>

      {result?.error && (
        <div role="alert" className="alert alert-error alert-soft flex-wrap">
          <span className="break-all grow">{result.error}</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => void saveFile(new Blob([buildReport(result, null, normalize)], {type: "text/plain;charset=utf-8"}), reportName(result))}>
            <RiDownloadLine/> Download .txt
          </button>
        </div>
      )}

      {result?.response && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-row flex-wrap items-center gap-2">
            <span className={`badge ${statusClass(result.response.status)}`}>
              {result.response.status} {result.response.statusText}
            </span>
            <span className="badge badge-ghost">{result.response.duration} ms</span>
            <span className="badge badge-ghost">{formatSize(result.response.text)}</span>
            <button
              type="button"
              className="btn btn-sm btn-ghost ml-auto"
              onClick={() => void saveFile(new Blob([buildReport(result, body, normalize)], {type: "text/plain;charset=utf-8"}), reportName(result))}
            >
              <RiDownloadLine/> Download .txt
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={async () => {
                await Clipboard.write({string: body ?? ""});
                setCopied(true);
              }}
            >
              <RiFileCopyLine/> {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {result.hops && result.hops.length > 1 && (
            <div role="alert" className="alert alert-info alert-soft flex-col items-start">
              <span className="font-semibold">Redirect chain ({result.hops.length - 1} hops)</span>
              <ol className="list-decimal list-inside text-sm break-all">
                {result.hops.map(hop => <li key={hop}>{hop}</li>)}
              </ol>
            </div>
          )}
          {redirect && (
            <div role="alert" className="alert alert-warning alert-soft break-all">
              Redirected to {redirect} (session probably expired or endpoint requires a different session)
            </div>
          )}
          <details className="collapse collapse-arrow bg-base-200 border border-base-300">
            <summary className="collapse-title font-semibold">Headers</summary>
            <div className="collapse-content text-sm break-all">
              {Object.entries(result.response.headers).map(([key, value]) => (
                <div key={key}><span className="font-semibold">{key}:</span> {value}</div>
              ))}
            </div>
          </details>
          <pre className="bg-base-300 rounded-box p-4 text-sm overflow-auto max-h-[70vh]"><code>{body}</code></pre>
        </div>
      )}
    </div>
  );
};

export default RequestConsole;
