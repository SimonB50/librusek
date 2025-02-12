import Layout from "@/components/layout";
import { useState } from "react";
import { fetch } from "@tauri-apps/plugin-http";

const Developer = () => {
  const [msgAuth, setMsgAuth] = useState(false);
  const [response, setResponse] = useState(null);

  return (
    <Layout>
      <div className="flex flex-col">
        <span className="text-3xl font-semibold">Developer tools</span>
        <span className="text-lg">
          Tools for developers to debug and test Librus API.
        </span>
      </div>
      <div className="flex flex-col md:flex-row gap-2 mt-4">
        <select id="baseUrl" className="select select-bordered w-full md:w-fit">
          <option
            value={"https://synergia.librus.pl/gateway/api/2.0/"}
            selected
          >
            https://synergia.librus.pl/gateway/api/2.0/
          </option>
          <option value={"https://wiadomosci.librus.pl/api/"}>
            https://wiadomosci.librus.pl/api/
          </option>
        </select>
        <div className="flex flex-row w-full justify-center items-center gap-2">
          <input
            id="path"
            type="text"
            placeholder="Request path"
            className="input input-bordered w-full"
          />
          <button
            className="btn btn-primary"
            onClick={async () => {
              setResponse(null);
              if (!msgAuth) {
                const response = await fetch("https://synergia.librus.pl/wiadomosci3");
                if (!response.ok) return setResponse("Error: " + response.status + " " + response.statusText);
                setMsgAuth(true);
              }
              const response = await fetch(
                `${document.querySelector("#baseUrl").value}${
                  document.querySelector("#path").value
                }`,
                { method: "GET", credentials: "include" }
              );
              if (!response.ok)
                return setResponse(
                  "Error: " + response.status + " " + response.statusText
                );
              const responseData = await response.json();
              setResponse(JSON.stringify(responseData, null, 2));
            }}
          >
            GET
          </button>
        </div>
      </div>
      <div className="mockup-code w-full rounded-md mt-4">
        {response ? <pre>{response}</pre> : <pre>Awaiting response</pre>}
      </div>
    </Layout>
  );
};
export default Developer;
