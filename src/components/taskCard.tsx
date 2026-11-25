import type {ReactNode} from "react";
import DateUtils from "../lib/date.js";
import DueBadge from "./dueBadge.js";
import {Tile} from "./page.js";

interface TaskCardProps {
  title: ReactNode;
  subject: ReactNode;
  date: string;
  children?: ReactNode;
  /** Small text next to the date, e.g. lesson number or time */
  meta?: ReactNode;
  /** Category color (hex without `#`), shown as a stripe */
  color?: string;
  onClick: () => void;
}

/** Homework / exam card - highlighted when due today, dimmed when in the past (old app layout). */
const TaskCard = ({title, subject, date, children, meta, color, onClick}: TaskCardProps) => {
  const days = DateUtils.daysFromToday(date);
  return (
    <Tile highlight={days === 0} onClick={onClick} className={`h-full justify-between ${days < 0 ? "opacity-60" : ""}`}>
      <div className="flex flex-col gap-1 w-full">
        <div className="flex flex-row items-start justify-between gap-2">
          <span className="flex flex-row items-center gap-2 text-lg font-bold min-w-0">
            {color && <span className="size-3 rounded-full shrink-0" style={{backgroundColor: `#${color}`}}></span>}
            <span className="truncate">{title}</span>
          </span>
          <DueBadge date={date}/>
        </div>
        <span className="font-semibold text-base-content/80">{subject}</span>
        {children && <div className="text-sm text-base-content/70 line-clamp-3">{children}</div>}
      </div>
      <div className="flex flex-row justify-between items-center w-full text-sm text-base-content/60 pt-1">
        <span>{DateUtils.weekday(date, "short")}, {DateUtils.formatDate(date)}</span>
        {meta && <span>{meta}</span>}
      </div>
    </Tile>
  );
};

export default TaskCard;
