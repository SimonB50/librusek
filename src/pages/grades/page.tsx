import {useState} from "react";
import {RiFlaskLine, RiListOrdered2, RiTimeLine} from "@remixicon/react";
import {useTranslation} from "react-i18next";
import {Class, GradeAverages, Subjects, Units, useAllGrades} from "../../client/resources/index.js";
import type {AnyGrade, Id} from "../../client/types/index.js";
import {EmptyState, PageHeader, SkeletonList} from "../../components/page.js";
import {QueryState} from "../../components/queryState.js";
import Display from "../../lib/display.js";
import GradeMath, {createSimulatedGrade, isSimulated} from "../../lib/grades.js";
import {Descriptive, GradeDetails, GradeEditor, type GradeEditorValue, type SemesterView, Subject} from "./components/index.js";

type EditorState =
  | { mode: "add"; subjectId: Id }
  | { mode: "edit"; grade: AnyGrade; max?: number };

const groupBySubject = (grades: readonly AnyGrade[]) => {
  const groups = new Map<Id, AnyGrade[]>();
  for (const grade of grades) {
    const list = groups.get(grade.subject.id) ?? [];
    list.push(grade);
    groups.set(grade.subject.id, list);
  }
  return groups;
};

const byDate = (a: AnyGrade, b: AnyGrade) => a.date.localeCompare(b.date) || a.addDate.localeCompare(b.addDate);

/** Grade kinds enabled for the school unit (`Units` → `gradesSettings`) - everything until it loads. */
const useEnabledKinds = () => {
  const {data: classData} = Class.useQuery();
  const {data: unit} = Units.useOne(classData?.unit.id);
  const settings = unit?.gradesSettings;
  return (grade: AnyGrade) => {
    if (!settings) return true;
    if (grade.kind === "point") return settings.pointGradesEnabled;
    return true;
  };
};

const Page = () => {
  const {t} = useTranslation(["grades", "common"]);
  const grades = useAllGrades();
  const averages = GradeAverages.useQuery();
  /** Librus returns `"Disabled"` instead of an array when the school turned averages off. */
  const averagesList = Array.isArray(averages.data) ? averages.data : [];
  const enabled = useEnabledKinds();

  const [selectedView, setSelectedView] = useState<SemesterView | null>(null);
  const [latest, setLatest] = useState(false);
  /** Simulation keeps a local copy of every grade - never written to the cache. */
  const [simulation, setSimulation] = useState<AnyGrade[] | null>(null);
  const [focused, setFocused] = useState<AnyGrade | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);

  const source = (simulation ?? grades.data ?? []).filter(enabled);
  const view: SemesterView = selectedView ?? GradeMath.semester(grades.data ?? []);
  const visible = source
    .filter(grade => view === "year" || grade.semester === view)
    .filter(grade => !latest || isSimulated(grade) || GradeMath.isLatest(grade))
    .sort(byDate);

  // In "all" mode every subject with any grade is listed, so the simulator can add grades to empty semesters
  const groups = groupBySubject(latest ? visible : source);
  // Loads every subject in one request and seeds the per-id cache used by <Subject>
  const subjects = Subjects.useMany(groups.keys());
  const subjectIds = [...groups.keys()].sort((a, b) =>
    Display.capitalize(subjects.get(a)?.name ?? "").localeCompare(Display.capitalize(subjects.get(b)?.name ?? "")));
  const visibleBySubject = groupBySubject(visible);

  const simulate = (enable: boolean) => {
    setSimulation(enable ? [...(grades.data ?? [])] : null);
    setFocused(null);
  };

  const saveEditor = (input: GradeEditorValue) => {
    if (!simulation || !editor) return;
    if (editor.mode === "add") {
      const nextId = Math.min(0, ...simulation.map(grade => grade.id)) - 1;
      const semester = view === "year" ? GradeMath.semester(simulation) : view;
      setSimulation([...simulation, createSimulatedGrade(nextId, {subjectId: editor.subjectId, semester}, input)]);
    } else {
      const {id, kind} = editor.grade;
      const updated = simulation.map((grade): AnyGrade => {
        if (grade.kind !== kind || grade.id !== id) return grade;
        if (grade.kind === "point") return {...grade, grade: input.value, gradeValue: input.value, category: {id: -input.max, url: ""}};
        return {...grade, grade: input.value, category: {id: -input.weight, url: ""}};
      });
      setSimulation(updated);
      setFocused(updated.find(grade => grade.kind === kind && grade.id === id) ?? null);
    }
    setEditor(null);
  };

  const deleteGrade = (target: AnyGrade) => {
    setSimulation(simulation?.filter(grade => !(grade.kind === target.kind && grade.id === target.id)) ?? null);
    setFocused(null);
  };

  // New grades default to the kind the account actually uses (point-only schools)
  // (pluses / minuses of point based schools are regular grades - they don't count as "using grades")
  const scaleGrades = (grades.data ?? []).filter(grade => grade.kind === "grade" && !GradeMath.special(grade) && !GradeMath.marker(grade)).length;
  const usesPoints = (grades.data ?? []).filter(grade => grade.kind === "point").length > scaleGrades;
  const editorInitial: GradeEditorValue = editor?.mode === "edit"
    ? {
      kind: editor.grade.kind === "point" ? "point" : "grade",
      value: editor.grade.kind === "point" ? editor.grade.gradeValue : editor.grade.grade,
      weight: editor.grade.kind === "grade" && editor.grade.category.id < 0 ? -editor.grade.category.id : 1,
      max: editor.max ?? 100,
    }
    : {kind: usesPoints ? "point" : "grade", value: usesPoints ? "100" : "5", weight: 1, max: 100};

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <>
            <button type="button" className={`btn grow sm:grow-0 ${latest ? "btn-primary" : ""}`} onClick={() => setLatest(!latest)}
                    title={t("filter.latest_hint")}>
              {latest ? <RiListOrdered2/> : <RiTimeLine/>} {latest ? t("filter.all") : t("filter.latest")}
            </button>
            <button type="button" className={`btn grow sm:grow-0 ${simulation ? "btn-accent" : ""}`} onClick={() => simulate(!simulation)}
                    disabled={!grades.data}>
              <RiFlaskLine/> {simulation ? t("simulator.disable") : t("simulator.enable")}
            </button>
          </>
        }
      />
      <div role="tablist" className="tabs tabs-box w-fit">
        {([1, 2, "year"] as const).map(option => (
          <button key={option} type="button" role="tab" className={`tab ${view === option ? "tab-active" : ""}`}
                  onClick={() => setSelectedView(option)}>
            {option === "year" ? t("common:common.school.year") : t("common:common.school.semester", {semester: "I".repeat(option)})}
          </button>
        ))}
      </div>
      {simulation && (
        <div role="alert" className="alert alert-soft alert-accent">
          <RiFlaskLine className="text-xl"/>
          <span>{t("simulator.active")}</span>
        </div>
      )}
      <QueryState query={grades} loading={<SkeletonList count={4}/>}>
        {() => subjectIds.length === 0
          ? <EmptyState>{latest ? t("filter.latest_empty") : t("empty")}</EmptyState>
          : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {subjectIds.map(id => (
                <Subject
                  key={id}
                  id={id}
                  view={view}
                  grades={visibleBySubject.get(id) ?? []}
                  librusAverage={averagesList.find(average => average.subject.id === id)}
                  onOpen={setFocused}
                  onAdd={simulation ? subjectId => setEditor({mode: "add", subjectId}) : undefined}
                />
              ))}
            </div>
          )}
      </QueryState>
      {!latest && !simulation && <Descriptive/>}
      <GradeDetails
        grade={focused}
        onClose={() => setFocused(null)}
        onEdit={simulation ? (grade, max) => setEditor({mode: "edit", grade, max}) : undefined}
        onDelete={simulation ? deleteGrade : undefined}
      />
      <GradeEditor
        state={editor ? {initial: editorInitial, lockKind: editor.mode === "edit"} : null}
        onClose={() => setEditor(null)}
        onSave={saveEditor}
      />
    </div>
  );
};

export default Page;
