import {useEffect, useRef, type ReactNode} from "react";
import {RiCloseLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Small text under the title */
  subtitle?: ReactNode;
  children: ReactNode;
  /** Buttons rendered in `modal-action` */
  actions?: ReactNode;
  /** Extra classes for `modal-box`, e.g. `max-w-2xl` */
  className?: string;
}

/**
 * Controlled daisyUI `<dialog>` modal - bottom sheet on phones, centered on larger screens.
 * Uses `showModal()`, so modals opened from another modal stack on top of it (top layer).
 * ESC, the backdrop and the close button all call `onClose`.
 */
const Modal = ({open, onClose, title, subtitle, children, actions, className = ""}: ModalProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const {t} = useTranslation("common");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      boxRef.current?.scrollTo({top: 0});
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog ref={ref} className="modal modal-bottom sm:modal-middle" onClose={onClose}>
      <div ref={boxRef} className={`modal-box flex flex-col gap-3 ${className}`}>
        <div className="flex flex-row items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            {title && <h3 className="text-xl font-bold break-words">{title}</h3>}
            {subtitle && <span className="text-sm text-base-content/70">{subtitle}</span>}
          </div>
          <button type="button" className="btn btn-sm btn-circle btn-ghost shrink-0" aria-label={t("actions.close")} onClick={onClose}>
            <RiCloseLine className="text-lg"/>
          </button>
        </div>
        {open && children}
        {actions && <div className="modal-action mt-2">{actions}</div>}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">{t("actions.close")}</button>
      </form>
    </dialog>
  );
};

/** Label/value row used inside detail modals. */
const DetailRow = ({label, children}: { label: ReactNode; children: ReactNode }) => (
  <div className="flex flex-row justify-between gap-4 py-2 border-b border-base-300 last:border-b-0">
    <span className="text-base-content/70 shrink-0">{label}</span>
    <span className="font-medium text-right break-words min-w-0">{children}</span>
  </div>
);

const DetailList = ({children}: { children: ReactNode }) => (
  <div className="flex flex-col bg-base-200 rounded-box px-4 py-1">{children}</div>
);

export {Modal, DetailRow, DetailList};
