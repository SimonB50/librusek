import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';
import {useTranslation} from "react-i18next";
import {useLocation} from "wouter";
import {isRequestError} from "../client/errors.js";

interface ErrorContextType {
  openError: (error: Error) => void;
  authError: (error: boolean) => void;
}

const ErrorContext = createContext<ErrorContextType>({
  openError: () => {},
  authError: () => {},
});

const ErrorProvider = ({children}: { children: ReactNode }) => {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [focusedError, setFocusedError] = useState<Error | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);
  const [location, navigate] = useLocation();
  const {t} = useTranslation();

  const openError = (error: Error): void => {
    setDialogOpen(true);
    setFocusedError(error);
  }

  useEffect(() => {
    if (!authError) return;
    setAuthError(false);
    // Developer tools must stay usable without a session (debugging auth)
    if (location === "/auth" || location.endsWith("/developer")) return;
    navigate("~/auth");
  }, [authError, location, navigate]);

  return (
    <ErrorContext.Provider value={{
      openError,
      authError: setAuthError,
    }}>
      <dialog id="errorModal" className="modal modal-bottom sm:modal-middle" open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <div className="modal-box">
          <h3 className="text-lg font-bold">{t("errors.title")}</h3>
          {
            focusedError ? (
              <div className="flex flex-col gap-2 mt-2">
                {isRequestError(focusedError) && (
                  <div className="badge badge-soft badge-error badge-sm h-auto text-wrap break-all">{focusedError.url}</div>
                )}
                <p className="text-sm">{focusedError.message}</p>
              </div>
            ) : (
              <p className="py-4">{t("errors.unknown")}</p>
            )
          }
          <div className="modal-action">
            <form method="dialog">
              <button type="submit" className="btn">{t("actions.close")}</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">{t("actions.close")}</button>
        </form>
      </dialog>
      {children}
    </ErrorContext.Provider>
  )
}

const useError = () => {
  return useContext(ErrorContext);
}

// biome-ignore lint/style/useComponentExportOnlyModules: provider and its hook belong together
export {ErrorProvider, useError};
