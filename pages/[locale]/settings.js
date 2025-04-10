import { Preferences } from "@capacitor/preferences";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import Layout from "@/components/layout";
import { upperFirst } from "@/lib/utils";
import { getStaticPaths, makeStaticProps } from "@/lib/i18n/getStatic";
import { useTranslation } from "react-i18next";

const getStaticProps = makeStaticProps(["settings", "common"]);
export { getStaticPaths, getStaticProps };

const Settings = () => {
  const { t } = useTranslation(["settings", "common"]);

  const [devmode, setDevmode] = useState("false");

  const { theme, setTheme } = useTheme();
  const themes = [
    "light",
    "dark",
    "cupcake",
    "bumblebee",
    "emerald",
    "corporate",
    "synthwave",
    "retro",
    "cyberpunk",
    "valentine",
    "halloween",
    "garden",
    "forest",
    "aqua",
    "lofi",
    "pastel",
    "fantasy",
    "wireframe",
    "black",
    "luxury",
    "dracula",
    "cmyk",
    "autumn",
    "business",
    "acid",
    "lemonade",
    "night",
    "coffee",
    "winter",
    "dim",
    "nord",
    "sunset",
    "caramellatte",
    "abyss",
    "silk",
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      const response = await Preferences.get({ key: "devmode" });
      if (response.value) {
        setDevmode(response.value);
      }
      document.querySelector("input#devmode").checked =
        response.value == "true";
    };
    fetchSettings();
  }, []);

  return (
    <Layout>
      <dialog id="cacheClear" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">
            {t("advanced.clear_cache.success.title")}
          </h3>
          <span>{t("advanced.clear_cache.success.description")}</span>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">
                {t("advanced.clear_cache.success.button")}
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <dialog id="themesBrowser" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold">
                {t("appearance.themes.custom.explorer.title")}
              </h3>
              <span>{t("appearance.themes.custom.explorer.description")}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {themes.map((x) => (
                <div
                  key={x}
                  className="border-base-content/20 hover:border-base-content/40 overflow-hidden rounded-lg border outline-2 outline-offset-2 outline-transparent"
                  onClick={() => setTheme(x)}
                >
                  <div
                    data-theme={x}
                    className="bg-base-100 text-base-content w-full cursor-pointer font-sans"
                  >
                    <div className="grid grid-cols-12 grid-rows-3">
                      <div className="bg-base-200 col-start-1 row-span-2 row-start-1"></div>
                      <div className="bg-base-300 col-start-1 row-start-3"></div>
                      <div className="bg-base-100 col-span-10 col-start-2 row-span-3 row-start-1 flex flex-col gap-1 p-2">
                        <div className="font-bold">{x}</div>
                        <div className="flex flex-wrap gap-1">
                          <div className="bg-primary flex aspect-square w-5 items-center justify-center rounded-sm lg:w-6">
                            <div className="text-primary-content text-sm font-bold">
                              A
                            </div>
                          </div>
                          <div className="bg-secondary flex aspect-square w-5 items-center justify-center rounded-sm lg:w-6">
                            <div className="text-secondary-content text-sm font-bold">
                              A
                            </div>
                          </div>
                          <div className="bg-accent flex aspect-square w-5 items-center justify-center rounded-sm lg:w-6">
                            <div className="text-accent-content text-sm font-bold">
                              A
                            </div>
                          </div>
                          <div className="bg-neutral flex aspect-square w-5 items-center justify-center rounded-sm lg:w-6">
                            <div className="text-neutral-content text-sm font-bold">
                              A
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">
                {t("appearance.themes.custom.explorer.close")}
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col">
          <div className="flex flex-col">
            <span className="text-3xl font-semibold">
              {t("appearance.title")}
            </span>
            <span className="text-lg">{t("appearance.description")}</span>
          </div>
          <div className="divider my-1"></div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-2">
              <div className="flex flex-col">
                <span className="text-lg font-semibold">
                  {t("appearance.themes.standard.title")}
                </span>
                <span className="text-sm">
                  {t("appearance.themes.standard.description")}
                </span>
              </div>
              <div className="flex flex-row gap-2">
                {["system", "light", "dark"].map((x) => (
                  <button
                    key={x}
                    className={`btn ${x == theme && "btn-primary"}`}
                    onClick={() => setTheme(x)}
                  >
                    {t(`appearance.themes.standard.options.${x}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-2">
              <div className="flex flex-col">
                <span className="text-lg font-semibold">
                  {t("appearance.themes.custom.title")}
                </span>
                <span className="text-sm">
                  {t("appearance.themes.custom.description")}
                </span>
              </div>
              <div className="flex flex-row gap-4 items-center">
                <button
                  className={`btn btn-primary`}
                  onClick={() =>
                    document.getElementById("themesBrowser").showModal()
                  }
                >
                  {t("appearance.themes.custom.explore")}
                </button>
                <span className="text-base">
                  <span className="font-bold">
                    {t("appearance.themes.custom.current")}:
                  </span>{" "}
                  {upperFirst(theme)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex flex-col">
            <span className="text-3xl font-semibold">
              {t("advanced.title")}
            </span>
            <span className="text-lg">{t("advanced.description")}</span>
          </div>
          <div className="divider my-1"></div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-2">
              <div className="flex flex-col">
                <span className="text-lg font-semibold">
                  {t("advanced.devmode.title")}
                </span>
                <span className="text-sm">
                  {t("advanced.devmode.description")}
                </span>
              </div>
              <div className="flex flex-row gap-2">
                <input
                  id="devmode"
                  type="checkbox"
                  className="toggle toggle-primary"
                  defaultChecked={devmode == "true"}
                  onClick={async (e) => {
                    if (e.target.checked) {
                      setDevmode("true");
                      await Preferences.set({ key: "devmode", value: "true" });
                    } else {
                      setDevmode("false");
                      await Preferences.set({ key: "devmode", value: "false" });
                    }
                    window.location.reload();
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row w-full justify-between items-start sm:items-center gap-2">
              <div className="flex flex-col">
                <span className="text-lg font-semibold">
                  {t("advanced.clear_cache.title")}
                </span>
                <span className="text-sm">
                  {t("advanced.clear_cache.description")}
                </span>
              </div>
              <button
                className={`btn btn-error`}
                onClick={() => {
                  sessionStorage.removeItem("requestCache");
                  document.getElementById("cacheClear").showModal();
                }}
              >
                {t("advanced.clear_cache.button")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default Settings;
