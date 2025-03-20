import { Device } from "@capacitor/device";
import i18nextConfig from "@/next-i18next.config";

const languageDetector = {
  detect: async () => {
    if (localStorage.getItem("i18nextLng"))
      return localStorage.getItem("i18nextLng");
    let { value: languageCode } = await Device.getLanguageCode();
    if (languageCode.includes("-")) languageCode = languageCode.split("-")[0];
    if (!i18nextConfig.i18n.locales.includes(languageCode))
      languageCode = i18nextConfig.i18n.defaultLocale;
    return languageCode;
  },
  cache: (lng) => {
    localStorage.setItem("i18nextLng", lng);
  },
};
export default languageDetector;

// export default languageDetector({
//   supportedLngs: i18nextConfig.i18n.locales,
//   fallbackLng: i18nextConfig.i18n.defaultLocale,
// });
