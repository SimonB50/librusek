import {useTranslation} from "react-i18next";
import DateUtils from "../lib/date.js";
import Display from "../lib/display.js";

/** "Today" / "In 3 days" badge - nothing for past dates (same as the old app). */
const DueBadge = ({date}: { date: string }) => {
  const {t} = useTranslation();
  const days = DateUtils.daysFromToday(date);
  if (days < 0) return null;
  return (
    <span className={`badge badge-sm whitespace-nowrap ${days === 0 ? "badge-primary" : days <= 2 ? "badge-warning badge-soft" : "badge-soft"}`}>
      {days === 0 ? t("actions.today") : Display.upperFirst(DateUtils.relative(date))}
    </span>
  );
};

export default DueBadge;
