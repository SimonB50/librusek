import {useState} from "react";
import {CacheInspector, EnvironmentInfo, RequestConsole} from "./components/index.js";

const tabs = [
  {id: "request", label: "Request", component: RequestConsole},
  {id: "cache", label: "Cache", component: CacheInspector},
  {id: "environment", label: "Environment", component: EnvironmentInfo},
] as const;

type TabId = typeof tabs[number]["id"];

const Page = () => {
  const [tab, setTab] = useState<TabId>("request");
  const Active = (tabs.find(item => item.id === tab) ?? tabs[0]).component;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        <span className="text-3xl font-semibold">Developer tools</span>
        <span className="text-lg">Tools for debugging and testing Librus API.</span>
      </div>
      <div role="tablist" className="tabs tabs-box w-fit">
        {tabs.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            className={`tab ${tab === item.id ? "tab-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Active/>
    </div>
  );
};

export default Page;
