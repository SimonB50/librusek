import { App } from "@capacitor/app";
import { repoApiUrl } from "./core";
import { useState, useEffect } from "react";
import Request from "./request";
import SemVer from "semver";
import ApkUpdater from "cordova-plugin-apkupdater";
import { Device } from "@capacitor/device";

const getVersion = async () => {
  const appInfo = await App.getInfo();
  const appVersion = appInfo.version;
  try {
    const versionData = await Request.get(`${repoApiUrl}/releases/latest`, {
      cache: {
        enabled: true,
        period: 600,
      },
      customFormat: true,
    });
    const latestVersion = versionData.tag_name.slice(1);
    return {
      currentVersion: appVersion,
      latestVersion: latestVersion,
      updateAvailable: SemVer.gt(latestVersion, appVersion),
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

const getDeviceInfo = async () => {
  const info = await Device.getInfo();
  return info;
};
const useDevice = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDeviceInfo();
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

const updateApp = async (setProgress) => {
  const deviceInfo = await getDeviceInfo();
  if (deviceInfo.operatingSystem !== "android") return;
  const versionData = await getVersion();
  await ApkUpdater.download(
    `https://github.com/SimonB50/librusek/releases/download/v${versionData.latestVersion}/librusek-${versionData.latestVersion}.apk`,
    {
      onDownloadProgress: setProgress ? setProgress : null,
    }
  );
  await ApkUpdater.install();
};

export { getVersion, useVersion, getDeviceInfo, useDevice, updateApp };
