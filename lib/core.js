import { getVersion as getAppVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";
import Request from "./request";

const apiUrl = "https://synergia.librus.pl/gateway/api/2.0";
const messagesUrl = "https://wiadomosci.librus.pl/api";
const repoApiUrl = "https://api.github.com/repos/SimonB50/librusek";

const getVersion = async () => {
  const appVersion = await getAppVersion();
  try {
    const versionData = await Request.get(
      `${repoApiUrl}/releases/latest`,
      {
        cache: {
          enabled: true,
          period: 600,
        },
        customFormat: true,
      }
    );
    const latestVersion = versionData.tag_name.slice(1);
    return {
      currentVersion: appVersion,
      latestVersion: latestVersion,
      updateAvailable: appVersion !== latestVersion,
    };
  } catch (err) {
    console.error(err);
    return {
      currentVersion: appVersion,
      latestVersion: "unknown",
      updateAvailable: false,
    };
  }
};
const useVersion = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getVersion();
        setData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

export { apiUrl, messagesUrl, repoApiUrl, getVersion, useVersion };
