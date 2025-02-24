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
      <form
        className="flex flex-col md:flex-row gap-2 mt-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setResponse(null);
          if (!msgAuth) {
            const response = await fetch(
              "https://synergia.librus.pl/wiadomosci3"
            );
            if (!response.ok)
              return setResponse(
                "Error: " + response.status + " " + response.statusText
              );
            setMsgAuth(true);
          }
          const response = await fetch(
            `${document.querySelector("#baseUrl").value}${
              document.querySelector("#path").value
            }`,
            { method: "GET", credentials: "include" }
          );
          let responseText = "";
          if (!response.ok) {
            responseText +=
              "Error: " + response.status + " " + response.statusText;
            try {
              responseText +=
                "\n" + JSON.stringify(await response.json(), null, 2);
            } catch (e) {
            } finally {
              return setResponse(responseText);
            }
          }
          responseText +=
            "Success: " + response.status + " " + response.statusText;
          const responseData = await response.json();
          responseText += "\n" + JSON.stringify(responseData, null, 2);
          setResponse(responseText);
        }}
      >
        <select id="baseUrl" className="select select-bordered w-full md:w-fit">
          <option value={"https://synergia.librus.pl/gateway/api/2.0/"}>
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
          <button type="submit" className="btn btn-primary">
            GET
          </button>
        </div>
      </form>
      <div className="mockup-code w-full rounded-md mt-4">
        {response ? (
          response.split("\n").map((line, i) => (
            <pre
              key={i}
              data-prefix={i > 0 ? i : "~"}
              className={`${line.startsWith("Success") ? "text-success" : ""} ${
                line.startsWith("Error") ? "text-error" : ""
              }`}
            >
              <code>{line}</code>
            </pre>
          ))
        ) : (
          <pre data-prefix="1">
            <code>Awaiting response</code>
          </pre>
        )}
      </div>
    </Layout>
  );
};
export default Developer;
