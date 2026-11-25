import {useState} from "react";
import {useTranslation} from "react-i18next";
import {Modal} from "../../../components/modal.js";
import {SIMULATOR_VALUES} from "../../../lib/grades.js";
import type {GradeEditorValue} from "./hooks.js";

interface GradeEditorProps {
  /** `null` = closed. `initial` comes from the edited grade (or defaults for a new one). */
  state: { initial: GradeEditorValue; title?: string; lockKind?: boolean } | null;
  onClose: () => void;
  onSave: (value: GradeEditorValue) => void;
}

const WEIGHTS = [1, 2, 3, 4, 5, 6];

const Form = ({initial, lockKind, onClose, onSave}: { initial: GradeEditorValue; lockKind?: boolean } & Omit<GradeEditorProps, "state">) => {
  const {t} = useTranslation("grades");
  const [kind, setKind] = useState(initial.kind);
  const [value, setValue] = useState(initial.kind === "grade" ? initial.value : "5");
  const [weight, setWeight] = useState(initial.weight);
  const [points, setPoints] = useState(initial.kind === "point" ? Number(initial.value) : 0);
  const [max, setMax] = useState(initial.max);
  const pointsValid = Number.isFinite(points) && points >= 0 && max >= 1 && points <= max;

  return (
    <form className="flex flex-col gap-4" onSubmit={event => {
      event.preventDefault();
      if (kind === "point" && !pointsValid) return;
      onSave({kind, value: kind === "point" ? String(points) : value, weight, max});
    }}>
      {!lockKind && (
        <div role="tablist" className="tabs tabs-box w-fit">
          <button type="button" role="tab" className={`tab ${kind === "grade" ? "tab-active" : ""}`} onClick={() => setKind("grade")}>
            {t("simulator.editor.kinds.grade")}
          </button>
          <button type="button" role="tab" className={`tab ${kind === "point" ? "tab-active" : ""}`} onClick={() => setKind("point")}>
            {t("simulator.editor.kinds.point")}
          </button>
        </div>
      )}
      {kind === "grade"
        ? (
          <>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t("simulator.editor.value")}</legend>
              <div className="flex flex-row flex-wrap gap-1">
                {SIMULATOR_VALUES.map(option => (
                  <button key={option} type="button" onClick={() => setValue(option)}
                          className={`btn btn-sm min-w-11 ${value === option ? "btn-primary" : ""}`}>
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t("simulator.editor.weight")}</legend>
              <div className="join">
                {WEIGHTS.map(option => (
                  <button key={option} type="button" onClick={() => setWeight(option)}
                          className={`btn join-item ${weight === option ? "btn-primary" : ""}`}>
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        )
        : (
          <div className="flex flex-row gap-2">
            <fieldset className="fieldset grow">
              <legend className="fieldset-legend">{t("simulator.editor.points")}</legend>
              <input type="number" className="input w-full" min={0} max={max} step="0.5" value={points}
                     onChange={event => setPoints(Number(event.target.value))}/>
            </fieldset>
            <fieldset className="fieldset grow">
              <legend className="fieldset-legend">{t("simulator.editor.max")}</legend>
              <input type="number" className="input w-full" min={1} step="1" value={max}
                     onChange={event => setMax(Number(event.target.value))}/>
            </fieldset>
          </div>
        )}
      {kind === "point" && !pointsValid && <span className="text-error text-sm">{t("simulator.editor.points_invalid")}</span>}
      <div className="modal-action">
        <button type="button" className="btn" onClick={onClose}>{t("simulator.editor.actions.cancel")}</button>
        <button type="submit" className="btn btn-primary" disabled={kind === "point" && !pointsValid}>{t("simulator.editor.actions.save")}</button>
      </div>
    </form>
  );
};

/** Simulator editor (old app: `edit_modal`) - stacks on top of the details modal. */
const GradeEditor = ({state, onClose, onSave}: GradeEditorProps) => {
  const {t} = useTranslation("grades");
  return (
    <Modal open={state !== null} onClose={onClose} title={t("simulator.editor.title")} subtitle={state?.title}>
      {state && <Form initial={state.initial} lockKind={state.lockKind} onClose={onClose} onSave={onSave}/>}
    </Modal>
  );
};

export default GradeEditor;
