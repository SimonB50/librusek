import Layout from "@/components/layout";
import { upperFirst } from "@/lib/utils";
import { useTheme } from "next-themes";

const Settings = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Layout>
      <div className="flex flex-col">
        <span className="text-3xl font-semibold">Librusek settings</span>
        <span className="text-lg">Configure your Librusek settings here.</span>
      </div>
      <div className="divider my-3"></div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-2">
          <div className="flex flex-col">
            <span className="text-lg font-semibold">Theme</span>
            <span className="text-sm">Choose between light and dark mode.</span>
          </div>
          <div className="flex flex-row gap-2">
            {["system", "light", "dark"].map((x) => (
              <button
                key={x}
                className={`btn ${x == theme && "btn-primary"}`}
                onClick={() => setTheme(x)}
              >
                {upperFirst(x)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-2">
          <div className="flex flex-col">
            <span className="text-lg font-semibold">Developer mode</span>
            <span className="text-sm">
              Enable &quot;Developer&quot; page with advanced features for debugging.
            </span>
          </div>
          <div className="flex flex-row gap-2">
            <input type="checkbox" className="toggle toggle-primary" defaultChecked={
              localStorage.getItem("developer") === "true"
            } onClick={(e) => {
              if (e.target.checked) {
                localStorage.setItem("developer", "true");
              } else {
                localStorage.removeItem("developer");
              }
              window.location.reload();
            }} />
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default Settings;
