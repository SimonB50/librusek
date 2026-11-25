import {Capacitor, registerPlugin} from "@capacitor/core";
import {queryOptions, useQuery} from "@tanstack/react-query";
import {queryClient} from "../client/query/client.js";

/**
 * App updater.
 *
 *   check()  ->  "upToDate" | "available"  ->  install(release)  ->  system APK installer
 *
 * - `check` asks GitHub for the latest release (public API, no user data sent) and compares versions.
 * - `install` (Android only) downloads the release `.apk` with progress through the local native plugin
 *   `ApkInstaller` (android/app/.../ApkInstallerPlugin.java) and opens the system installer. It resolves once the
 *   installer is shown - whether the user confirms can't be observed (the app restarts as the new version).
 * - Web builds are updated by deploying - the check only runs on Android or when asked manually.
 */

// Also in ApkInstallerPlugin.java (allowed download URLs) and .github/workflows/release.yml (UPDATER_REPOSITORY)
const REPOSITORY = "SimonB50/librusek";
const RELEASES_URL = `https://api.github.com/repos/${REPOSITORY}/releases/latest`;

interface Release {
  version: string;
  name: string;
  notes: string;
  url: string;
  publishedAt: string;
  /** Android package, if the release has one */
  apk?: { name: string; url: string; size: number };
}

type UpdateStatus =
  | { state: "upToDate"; current: string; latest: Release }
  | { state: "available"; current: string; latest: Release };

interface ApkInstallerPlugin {
  install(options: { url: string; size: number }): Promise<void>;
  addListener(event: "progress", listener: (event: { percent: number }) => void): Promise<{ remove: () => Promise<void> }>;
}

const ApkInstaller = registerPlugin<ApkInstallerPlugin>("ApkInstaller");

/** Native error codes: INVALID_URL, BUSY, SIZE_MISMATCH, INVALID_PACKAGE, NO_INSTALLER, DOWNLOAD_FAILED; NO_APK when the release has none. */
class UpdateInstallError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "UpdateInstallError";
    this.code = code;
  }
}

/** `"v1.2.10"` vs `"1.2.9"` -> positive when `a` is newer. Pre-release suffixes are ignored. */
const compareVersions = (a: string, b: string) => {
  const parse = (value: string) => value.replace(/^v/i, "").split(/[-+]/)[0].split(".").map(part => Number.parseInt(part, 10) || 0);
  const [left, right] = [parse(a), parse(b)];
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

interface GithubRelease {
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  published_at: string;
  assets: { name: string; browser_download_url: string; size: number }[];
}

abstract class Updater {
  static readonly current = __APP_VERSION__;

  /** Updates can only be installed on Android (sideloaded APK). */
  static readonly canInstall = Capacitor.getPlatform() === "android";

  /** iOS installs updates the same way the app was installed (App Store / TestFlight) - only a manual check here. */
  static readonly isIos = Capacitor.getPlatform() === "ios";

  static check = async (): Promise<UpdateStatus> => {
    // Plain fetch on purpose - `HttpClient` only talks to librus.pl
    const response = await fetch(RELEASES_URL, {headers: {Accept: "application/vnd.github+json"}});
    if (!response.ok) throw new Error(`Release check failed (${response.status})`);
    const release = await response.json() as GithubRelease;
    const apk = release.assets.find(asset => asset.name.endsWith(".apk"));
    const latest: Release = {
      version: release.tag_name.replace(/^v/i, ""),
      name: release.name || release.tag_name,
      notes: release.body ?? "",
      url: release.html_url,
      publishedAt: release.published_at,
      apk: apk && {name: apk.name, url: apk.browser_download_url, size: apk.size},
    };
    return {state: compareVersions(latest.version, this.current) > 0 ? "available" : "upToDate", current: this.current, latest};
  };

  /** Downloads `release.apk` (reused when already downloaded) and opens the system installer. Android only. */
  static install = async (release: Release, onProgress?: (percent: number) => void): Promise<void> => {
    if (!this.canInstall) throw new UpdateInstallError("Updates can only be installed on Android", "UNSUPPORTED");
    if (!release.apk) throw new UpdateInstallError("The release has no APK", "NO_APK");
    const listener = onProgress ? await ApkInstaller.addListener("progress", event => onProgress(event.percent)) : undefined;
    try {
      await ApkInstaller.install({url: release.apk.url, size: release.apk.size});
    } catch (error) {
      const {message, code} = error as { message?: string; code?: string };
      throw new UpdateInstallError(message ?? "Update failed", code ?? "DOWNLOAD_FAILED");
    } finally {
      await listener?.remove();
    }
  };
}

const updateQuery = queryOptions({
  queryKey: ["app", "update"],
  queryFn: Updater.check,
  staleTime: 6 * 60 * 60 * 1000,
  retry: false,
});

/** Automatic check on Android only; elsewhere `check()` runs it on demand (e.g. a button). */
const useUpdate = () => {
  const query = useQuery({...updateQuery, enabled: Updater.canInstall});
  return {...query, check: () => queryClient.fetchQuery({...updateQuery, staleTime: 0})};
};

export default Updater;
export {compareVersions, useUpdate, UpdateInstallError};
export type {Release, UpdateStatus};
