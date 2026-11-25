import {useTranslation} from "react-i18next";

/** "Upcoming / All" switch used by homeworks and exams. */
const UpcomingFilter = ({namespace, all, onChange}: { namespace: string; all: boolean; onChange: (all: boolean) => void }) => {
  const {t} = useTranslation(namespace);
  return (
    <div role="tablist" className="tabs tabs-box">
      <button type="button" role="tab" className={`tab ${!all ? "tab-active" : ""}`} onClick={() => onChange(false)}>
        {t("filter.upcoming")}
      </button>
      <button type="button" role="tab" className={`tab ${all ? "tab-active" : ""}`} onClick={() => onChange(true)}>
        {t("filter.all")}
      </button>
    </div>
  );
};

export default UpcomingFilter;
