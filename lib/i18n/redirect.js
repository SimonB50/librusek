import { useEffect } from "react";
import { useRouter } from "next/router";
import languageDetector from "@/lib/i18n/languageDetector";

export const useRedirect = (to) => {
  const router = useRouter();
  to = to || router.asPath;

  // language detection
  useEffect(() => {
    const detectLanguage = async () => {
      const detectedLng = await languageDetector.detect();
      if (to.startsWith("/" + detectedLng) || router.route === "/404") {
        // prevent endless loop
        router.replace("/" + detectedLng + router.route);
        return;
      }

      languageDetector.cache(detectedLng);
      router.replace("/" + detectedLng + to);
    };
    detectLanguage();
  });

  return <></>;
};

export const Redirect = () => {
  useRedirect();
  return <></>;
};

// eslint-disable-next-line react/display-name
export const getRedirect = (to) => () => {
  useRedirect(to);
  return <></>;
};
