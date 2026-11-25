import {useQueries} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {DescriptiveGrades, DescriptiveGradeSkills, DescriptiveTextGrades} from "../../../client/resources/index.js";
import type {DescriptiveGradeData} from "../../../client/types/index.js";
import {SubjectName} from "../../../components/names.js";
import {SectionTitle} from "../../../components/page.js";
import {T} from "../../../components/translate.js";
import DateUtils from "../../../lib/date.js";

/** Value of a descriptive grade - field names differ between schools (types not confirmed on a live account). */
const descriptiveValue = (item: DescriptiveGradeData) => item.grade ?? item.realGradeValue ?? item.map ?? "";

const SkillName = ({id}: { id?: number }) => {
  const {data} = DescriptiveGradeSkills.useOne(id);
  return data ? <span className="text-sm text-base-content/70"><T text={data.name} name/></span> : null;
};

/**
 * `DescriptiveGrades` + `DescriptiveTextGrades` (primary schools, some subjects).
 * Hidden completely when the account has none - most accounts.
 */
const Descriptive = () => {
  const {t} = useTranslation("grades");
  const [grades, texts] = useQueries({queries: [DescriptiveGrades.options(), DescriptiveTextGrades.options()]});
  const items = [...(grades.data ?? []), ...(texts.data ?? [])]
    .filter(item => descriptiveValue(item))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>{t("descriptive.title")}</SectionTitle>
      <ul className="list bg-base-200 border border-base-300 rounded-box">
        {items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: both endpoints can reuse ids
          <li key={`${item.id}-${index}`} className="list-row">
            <div className="flex flex-col gap-1 min-w-0 list-col-grow">
              <span className="font-semibold">{item.subject ? <SubjectName id={item.subject.id}/> : "-"}</span>
              {item.skill && <SkillName id={Number(item.skill.id)}/>}
              <p className="whitespace-pre-wrap"><T text={descriptiveValue(item)}/></p>
            </div>
            {item.date && <span className="text-sm text-base-content/60">{DateUtils.formatDate(item.date)}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Descriptive;
