import { getVersion as getAppVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";

const apiUrl = "https://synergia.librus.pl/gateway/api/2.0";
const repoApiUrl = "https://api.github.com/repos/SimonB50/librusek";

const getVersion = async () => {
    const appVersion = await getAppVersion();
    const versionRequest = await fetch(`${repoApiUrl}/releases/latest`);
    if (versionRequest.status !== 200) return {
        currentVersion: appVersion,
        latestVersion: "unknown",
        updateAvailable: false,
    }
    const versionResponse = await versionRequest.json();
    const latestVersion = versionResponse.tag_name.slice(1);
    return {
        currentVersion: appVersion,
        latestVersion: latestVersion,
        updateAvailable: appVersion !== latestVersion,
    }
}
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
}

export { apiUrl, repoApiUrl, getVersion, useVersion };