import {useEffect, useRef, useState} from "react";
import {RiCloseLine, RiCupLine, RiHeart3Line, RiShieldCheckLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {usePreference} from "../../../lib/preferences.js";

const DONATE_URL = "https://ko-fi.com/simonb50";
const SEEN_KEY = "supportNotice.seen";

/** Full-screen version of the notice - shown once automatically, later from the banner. */
const SupportScreen = ({open, onClose}: { open: boolean; onClose: () => void }) => {
  const {t} = useTranslation("landing");
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="modal" onClose={onClose}>
      <div className="modal-box w-screen max-w-none h-dvh max-h-none rounded-none p-0 bg-base-100">
        <div className="flex flex-col min-h-full max-w-xl mx-auto px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] gap-6">
          <div className="flex justify-end">
            <button type="button" className="btn btn-sm btn-circle btn-ghost" aria-label={t("common:actions.close")} onClick={onClose}>
              <RiCloseLine className="text-lg"/>
            </button>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary text-3xl">
              <RiHeart3Line/>
            </div>
            <h2 className="text-2xl font-bold">{t("support.title")}</h2>
          </div>
          <div className="flex flex-col gap-4 text-base-content/80">
            <div className="flex flex-row gap-3 p-4 bg-base-200 border border-base-300 rounded-box">
              <RiShieldCheckLine className="shrink-0 text-2xl text-primary"/>
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-base-content">{t("support.verification.title")}</span>
                <p>{t("support.verification.body")}</p>
              </div>
            </div>
            <p>{t("support.fee")}</p>
            <p>{t("support.thanks")}</p>
          </div>
          <div className="flex flex-col gap-2 mt-auto">
            <a href={DONATE_URL} target="_blank" rel="noreferrer" className="btn btn-primary btn-lg">
              <RiCupLine/> {t("support.donate")}
            </a>
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t("support.later")}</button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

/**
 * Request for support: Android developer verification + $25 developer licence fundraiser.
 * Banner stays pinned at the top of the home page; the full-screen version opens once by itself.
 */
const SupportNotice = () => {
  const {t} = useTranslation("landing");
  const seen = usePreference(SEEN_KEY);
  const [open, setOpen] = useState(false);
  const firstTime = !seen.isPending && seen.value === null;

  const close = () => {
    setOpen(false);
    if (seen.value === null) void seen.set("true");
  };

  return (
    <>
      <div role="status" className="alert alert-soft alert-primary flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <RiHeart3Line className="hidden sm:block shrink-0 text-2xl"/>
        <div className="flex flex-col grow min-w-0">
          <span className="font-semibold">{t("support.banner.title")}</span>
          <span className="text-sm">{t("support.banner.body")}</span>
        </div>
        <div className="flex flex-row gap-2 shrink-0 self-end sm:self-auto">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(true)}>{t("support.more")}</button>
          <a href={DONATE_URL} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">
            <RiCupLine/> {t("support.donate_short")}
          </a>
        </div>
      </div>
      <SupportScreen open={open || firstTime} onClose={close}/>
    </>
  );
};

export default SupportNotice;
