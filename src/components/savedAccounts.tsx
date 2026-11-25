import {useState} from "react";
import {RiDeleteBinLine, RiStarFill, RiStarLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import Accounts, {type SavedAccount, useAccounts} from "../client/accounts.js";
import {Modal} from "./modal.js";

interface SavedAccountListProps {
  /** Click on an account - log in / switch. Without it the rows are not clickable (management only). */
  onSelect?: (account: SavedAccount) => void;
  /** Account currently being logged in - shows a spinner and disables the list */
  busyId?: string | null;
  /** Hide the account the session belongs to (account switcher) */
  hideCurrent?: boolean;
}

const Initial = ({name}: { name: string }) => (
  <div className="avatar avatar-placeholder">
    <div className="bg-primary/15 text-primary w-10 rounded-full">
      <span className="font-bold">{name.trim().charAt(0).toUpperCase() || "?"}</span>
    </div>
  </div>
);

/** Saved accounts with "default" (auto login) toggle and removal - shared by the login screen and settings. */
const SavedAccountList = ({onSelect, busyId = null, hideCurrent = false}: SavedAccountListProps) => {
  const {t} = useTranslation("auth");
  const {accounts, defaultId, currentId} = useAccounts();
  const [removing, setRemoving] = useState<SavedAccount | null>(null);
  const visible = hideCurrent ? accounts.filter(account => account.id !== currentId) : accounts;
  if (visible.length === 0) return null;

  return (
    <>
      <ul className="list bg-base-200 border border-base-300 rounded-box">
        {visible.map(account => {
          const isDefault = account.id === defaultId;
          const content = (
            <>
              <Initial name={account.name}/>
              <span className="flex flex-col min-w-0 text-left">
                <span className="font-semibold truncate">{account.name}</span>
                <span className="text-sm text-base-content/60 truncate">
                  {account.login}{account.id === currentId && ` · ${t("accounts.current")}`}
                </span>
              </span>
            </>
          );
          return (
            <li key={account.id} className="list-row items-center p-2 pr-3">
              {onSelect
                ? (
                  <button type="button" className="list-col-grow flex flex-row items-center gap-3 p-1 rounded-field cursor-pointer hover:bg-base-300 disabled:cursor-wait"
                          disabled={busyId !== null} onClick={() => onSelect(account)}>
                    {content}
                  </button>
                )
                : <div className="list-col-grow flex flex-row items-center gap-3 p-1">{content}</div>}
              {busyId === account.id && <span className="loading loading-spinner loading-sm"></span>}
              <button type="button" className={`btn btn-ghost btn-sm btn-square ${isDefault ? "text-warning" : "text-base-content/50"}`}
                      title={isDefault ? t("accounts.default_on") : t("accounts.default_off")}
                      aria-pressed={isDefault} disabled={busyId !== null}
                      onClick={() => void Accounts.setDefault(isDefault ? null : account.id)}>
                {isDefault ? <RiStarFill/> : <RiStarLine/>}
              </button>
              <button type="button" className="btn btn-ghost btn-sm btn-square text-base-content/50 hover:text-error"
                      title={t("accounts.remove")} disabled={busyId !== null} onClick={() => setRemoving(account)}>
                <RiDeleteBinLine/>
              </button>
            </li>
          );
        })}
      </ul>
      <Modal open={removing !== null} onClose={() => setRemoving(null)} title={t("accounts.remove_title")}
             actions={
               <>
                 <button type="button" className="btn" onClick={() => setRemoving(null)}>{t("accounts.cancel")}</button>
                 <button type="button" className="btn btn-error" onClick={async () => {
                   if (removing) await Accounts.remove(removing.id);
                   setRemoving(null);
                 }}>{t("accounts.remove")}</button>
               </>
             }>
        <span>{t("accounts.remove_message", {name: removing?.name ?? ""})}</span>
      </Modal>
    </>
  );
};

export default SavedAccountList;
