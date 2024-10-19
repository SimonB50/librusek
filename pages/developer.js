import Layout from "@/components/layout";
import { useState } from "react";
import { fetch } from "@tauri-apps/plugin-http";
import { apiUrl } from "@/lib/core";

const Developer = () => {
  const [response, setResponse] = useState(null);

  return (
    <Layout>
      <div className="flex flex-col">
        <span className="text-3xl font-semibold">Developer tools</span>
        <span className="text-lg">
          Tools for developers to debug and test Librus API.
        </span>
      </div>
      <div className="flex flex-row w-full justify-center items-center gap-2 mt-4">
        <input id="path" type="text" placeholder="Request path" className="input input-bordered w-full" />
        <button className="btn btn-primary" onClick={async () => {
          setResponse(null);
          const response = await fetch(`${apiUrl}/${document.querySelector("#path").value}`, { method: "GET" });
          if (!response.ok) return setResponse("Error: " + response.status + " " + response.statusText);
          const responseData = await response.json();
          setResponse(JSON.stringify(responseData, null, 2));
        }}>GET</button>
      </div>
      <div className="mockup-code w-full rounded-md mt-4">
        {response ? <pre>{response}</pre> : <pre>Awaiting response</pre>}
      </div>
    </Layout>
  );
};
export default Developer;
