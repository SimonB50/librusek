import {useState} from "react";
import {RiDownloadLine, RiExternalLinkLine, RiGitBranchLine, RiRefreshLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {DetailList, DetailRow, Modal} from "../../../components/modal.js";
import InfoTile from "../../../components/infoTile.js";
import DateUtils from "../../../lib/date.js";
import Updater, {UpdateInstallError, useUpdate} from "../../../lib/updater.js";

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * App version + updater entry point. The check runs automatically on Android, elsewhere on demand.
 * On Android "Install" downloads the APK with progress and opens the system installer (see `lib/updater.ts`).
 */

type InstallState =
  | { state: "idle" }
  | { state: "downloading"; percent: number }
  | { state: "opened" }
  | { state: "error"; code: string };
const VersionInfo = () => {
  const {t} = useTranslation("landing");
  const [open, setOpen] = useState(false);
  const update = useUpdate();
  const [checking, setChecking] = useState(false);
  const status = update.data;
  const [install, setInstall] = useState<InstallState>({state: "idle"});
  const downloading = install.state === "downloading";

  const startInstall = async () => {
    if (status?.state !== "available" || downloading) return;
    setInstall({state: "downloading", percent: 0});
    try {
      await Updater.install(status.latest, percent => setInstall({state: "downloading", percent}));
      setInstall({state: "opened"});
    } catch (error) {
      console.error(error);
      setInstall({state: "error", code: error instanceof UpdateInstallError ? error.code : "DOWNLOAD_FAILED"});
    }
  };

  const check = async () => {
    setChecking(true);
    try {
      await update.check();
    } catch {
      // shown through `update.error`
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <button type="button" className="block w-full text-left rounded-box cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => setOpen(true)}>
        <InfoTile
          icon={<RiGitBranchLine/>}
          title={t("blocks.version.title")}
          badge={status?.state === "available" ? <span className="badge badge-sm badge-primary">{t("blocks.version.available")}</span> : undefined}
        >
          v{Updater.current}
        </InfoTile>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t("blocks.version.updates.title")}
             subtitle={t("blocks.version.updates.current", {version: Updater.current})}
             actions={
               <>
                 <button type="button" className="btn" onClick={check} disabled={checking}>
                   {checking ? <span className="loading loading-spinner loading-sm"></span> : <RiRefreshLine/>}
                   {t("blocks.version.updates.check")}
                 </button>
                 {status?.state === "available" && Updater.canInstall && status.latest.apk && (
                   <button type="button" className="btn btn-primary" onClick={startInstall} disabled={downloading}>
                     {downloading ? <span className="loading loading-spinner loading-sm"></span> : <RiDownloadLine/>}
                     {t(install.state === "error" ? "blocks.version.updates.retry" : "blocks.version.updates.install")}
                   </button>
                 )}
               </>
             }>
        <div className="flex flex-col gap-3">
          {update.error && !checking && (
            <div role="alert" className="alert alert-soft alert-error">{t("blocks.version.updates.error")}</div>
          )}
          {!status && !update.error && (
            <span className="text-base-content/70">
              {Updater.canInstall ? t("blocks.version.updates.checking") : Updater.isIos ? t("blocks.version.updates.ios") : t("blocks.version.updates.web")}
            </span>
          )}
          {status?.state === "upToDate" && (
            <div role="status" className="alert alert-soft alert-success">{t("blocks.version.updates.up_to_date")}</div>
          )}
          {status && (
            <>
              <DetailList>
                <DetailRow label={t("blocks.version.updates.latest")}>{status.latest.name} (v{status.latest.version})</DetailRow>
                <DetailRow label={t("blocks.version.updates.published")}>{DateUtils.formatDate(status.latest.publishedAt)}</DetailRow>
                {status.latest.apk && Updater.canInstall && <DetailRow label="APK">{megabytes(status.latest.apk.size)}</DetailRow>}
              </DetailList>
              {status.latest.notes && (
                <pre className="p-3 bg-base-200 rounded-box text-sm whitespace-pre-wrap font-sans max-h-60 overflow-y-auto">{status.latest.notes}</pre>
              )}
              <a href={status.latest.url} target="_blank" rel="noreferrer" className="link link-primary inline-flex items-center gap-1 w-fit">
                {t("blocks.version.updates.open")} <RiExternalLinkLine/>
              </a>
              {status.state === "available" && Updater.canInstall && (
                <>
                  {install.state === "downloading" && (
                    <div className="flex flex-col gap-1" role="status">
                      <span className="text-sm">{t("blocks.version.updates.downloading", {percent: install.percent})}</span>
                      <progress className="progress progress-primary w-full" value={install.percent} max="100"></progress>
                    </div>
                  )}
                  {install.state === "opened" && (
                    <div role="status" className="alert alert-soft alert-info">{t("blocks.version.updates.installer_opened")}</div>
                  )}
                  {install.state === "error" && (
                    <div role="alert" className="alert alert-soft alert-error">
                      {t(install.code === "INVALID_PACKAGE" || install.code === "SIZE_MISMATCH" ? "blocks.version.updates.install_invalid" : "blocks.version.updates.install_error")}
                    </div>
                  )}
                  {install.state === "idle" && (
                    <span className="text-sm text-base-content/60">
                      {t(status.latest.apk ? "blocks.version.updates.install_hint" : "blocks.version.updates.no_apk")}
                    </span>
                  )}
                </>
              )}
              {status.state === "available" && !Updater.canInstall && (
                <span className="text-sm text-base-content/60">
                  {Updater.isIos ? t("blocks.version.updates.ios") : t("blocks.version.updates.install_android")}
                </span>
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default VersionInfo;
