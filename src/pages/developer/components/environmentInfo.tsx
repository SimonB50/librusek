import {useState, type ReactNode} from "react";
import {Capacitor} from "@capacitor/core";
import {Device} from "@capacitor/device";
import {useQuery} from "@tanstack/react-query";
import AuthManager from "../../../client/auth.js";
import {Me, Messages, MessagesAccount, UnreadMessagesCount} from "../../../client/resources/index.js";
import {Session} from "../../../client/session.js";
import {useDevMode} from "../../../lib/preferences.js";
import {usePseudoTranslation, useTranslator} from "../../../lib/translation/index.js";
import {QueryState} from "../../../components/queryState.js";

const Row = ({label, children}: { label: string; children: ReactNode }) => (
  <div className="flex flex-row justify-between gap-4 py-1 border-b border-base-300 last:border-0">
    <span className="opacity-70">{label}</span>
    <span className="text-right break-all">{children}</span>
  </div>
);

/** Translation engine state - the pseudo engine (dev builds only) tests the UI without real models. */
const TranslationDebug = () => {
  const pseudo = usePseudoTranslation();
  const translator = useTranslator();
  return (
    <>
      <Row label="Translation">
        {translator.engine?.id ?? "none"} · target {translator.target ?? "- (app in Polish)"} · {translator.status ?? "-"}
      </Row>
      {import.meta.env.DEV && (
        <label className="label cursor-pointer justify-between mt-1">
          <span>Pseudo translation (dev build)</span>
          <input type="checkbox" className="toggle" checked={pseudo.enabled} onChange={event => void pseudo.set(event.target.checked)}/>
        </label>
      )}
    </>
  );
};

type ActionState = Record<string, "pending" | "ok" | "error">;

/** Messages session probe - lists only, never opens a message (that would mark it as read). */
const MessagesInfo = () => {
  const account = MessagesAccount.useQuery();
  const unread = UnreadMessagesCount.useQuery();
  const inbox = Messages.useInfinite({box: "inbox", limit: 5});
  return (
    <div className="flex flex-col p-4 bg-base-200 border border-base-300 rounded-box gap-2">
      <span className="text-xl font-bold">Messages</span>
      <QueryState query={account} className="h-10">
        {me => <Row label="Account">{me.groupName} ({me.originSystem})</Row>}
      </QueryState>
      <QueryState query={unread} className="h-10">
        {count => <Row label="Unread">inbox {count.inbox}, notes {count.notes}, alerts {count.alerts}</Row>}
      </QueryState>
      <Row label="Inbox">
        {inbox.isPending ? "loading..." : inbox.isError ? inbox.error.message : `${inbox.items.length} of ${inbox.total ?? "?"} loaded`}
      </Row>
      <button
        type="button"
        className="btn btn-sm self-start"
        disabled={!inbox.hasNextPage || inbox.isFetchingNextPage}
        onClick={() => void inbox.fetchNextPage()}
      >
        {inbox.isFetchingNextPage && <span className="loading loading-spinner loading-xs"></span>}
        Load next page
      </button>
    </div>
  );
};

const EnvironmentInfo = () => {
  const devMode = useDevMode();
  const device = useQuery({queryKey: ["app", "device"], queryFn: () => Device.getInfo(), staleTime: Infinity});
  const [actions, setActions] = useState<ActionState>({});

  const run = async (name: string, action: () => Promise<unknown>) => {
    setActions(state => ({...state, [name]: "pending"}));
    try {
      const result = await action();
      setActions(state => ({...state, [name]: result === false ? "error" : "ok"}));
    } catch (error) {
      console.error(error);
      setActions(state => ({...state, [name]: "error"}));
    }
  };

  const actionButton = (name: string, label: string, action: () => Promise<unknown>) => (
    <button type="button" className="btn btn-sm" disabled={actions[name] === "pending"} onClick={() => run(name, action)}>
      {actions[name] === "pending" && <span className="loading loading-spinner loading-xs"></span>}
      {label}
      {actions[name] === "ok" && <span className="badge badge-success badge-xs">ok</span>}
      {actions[name] === "error" && <span className="badge badge-error badge-xs">failed</span>}
    </button>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="flex flex-col p-4 bg-base-200 border border-base-300 rounded-box">
        <span className="text-xl font-bold mb-2">Environment</span>
        <Row label="Mode">{import.meta.env.MODE}</Row>
        <Row label="Platform">{Capacitor.getPlatform()}{Capacitor.isNativePlatform() ? " (native)" : ""}</Row>
        <Row label="Proxy">{import.meta.env.DEV ? "vite /proxy" : "direct (CapacitorHttp)"}</Row>
        <QueryState query={device} className="h-20">
          {info => (
            <>
              <Row label="Device">{info.manufacturer} {info.model}</Row>
              <Row label="OS">{info.operatingSystem} {info.osVersion}</Row>
              <Row label="WebView">{info.webViewVersion}</Row>
            </>
          )}
        </QueryState>
        <label className="label cursor-pointer justify-between mt-3">
          <span>Developer mode{devMode.forced ? " (always on in dev build)" : ""}</span>
          <input
            type="checkbox"
            className="toggle"
            checked={devMode.stored}
            onChange={event => void devMode.set(event.target.checked)}
          />
        </label>
        <TranslationDebug/>
      </div>

      <div className="flex flex-col p-4 bg-base-200 border border-base-300 rounded-box gap-2">
        <span className="text-xl font-bold">Session</span>
        <QueryState query={Me.useQuery()} className="h-10">
          {me => (
            <>
              <Row label="Account">{me.account.login} (id {me.account.id})</Row>
              <Row label="Group">{me.account.groupId}</Row>
              <Row label="Premium">{me.account.isPremium ? "yes" : "no"}</Row>
            </>
          )}
        </QueryState>
        <div className="flex flex-row flex-wrap gap-2 mt-2">
          {actionButton("refresh", "Refresh session", AuthManager.refreshSession)}
          {actionButton("messages", "Activate messages", () => {
            Session.reset();
            return Session.ensureMessages().then(result => console.info("Messages redirect chain", result.hops));
          })}
          {actionButton("messagesMe", "Refetch messages /me", () => MessagesAccount.invalidate())}
          {actionButton("me", "Refetch /Me", () => Me.invalidate())}
        </div>
      </div>

      <MessagesInfo/>
    </div>
  );
};

export default EnvironmentInfo;
