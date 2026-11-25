import i18n from "../i18n/index.js";

/**
 * Date helpers working in **local time**.
 * `new Date("2026-11-17")` is parsed as UTC midnight (off by one day west of Greenwich) -
 * always go through {@link DateUtils.parse}.
 */
abstract class DateUtils {
  static readonly DAY = 24 * 60 * 60 * 1000;

  /** `YYYY-MM-DD`, `YYYY-MM-DD HH:mm(:ss)` and ISO (`T`) strings -> local `Date`. */
  static parse = (value: string | Date): Date => {
    if (value instanceof Date) return value;
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(value);
    if (!match) return new Date(value);
    const [, y, m, d, hh = "0", mm = "0", ss = "0"] = match;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
  };

  static startOfDay = (value: string | Date) => {
    const date = new Date(this.parse(value));
    date.setHours(0, 0, 0, 0);
    return date;
  };

  static addDays = (value: string | Date, days: number) => {
    const date = new Date(this.parse(value));
    date.setDate(date.getDate() + days);
    return date;
  };

  /** Local `Date` -> `YYYY-MM-DD` */
  static toDateString = (value: string | Date) => {
    const date = this.parse(value);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  static today = () => this.toDateString(new Date());

  /** Monday of the ISO week containing `value`. */
  static weekStart = (value: string | Date = new Date()) => {
    const date = this.startOfDay(value);
    const day = (date.getDay() + 6) % 7; // 0 = Monday
    return this.toDateString(this.addDays(date, -day));
  };

  /** ISO day of week, `1` = Monday ... `7` = Sunday */
  static isoWeekday = (value: string | Date) => ((this.parse(value).getDay() + 6) % 7) + 1;

  /** Whole calendar days from today to `value` (negative = past). */
  static daysFromToday = (value: string | Date) =>
    Math.round((this.startOfDay(value).getTime() - this.startOfDay(new Date()).getTime()) / this.DAY);

  static isToday = (value: string | Date) => this.daysFromToday(value) === 0;

  /** `value` within the last `days` days (by add date). */
  static isRecent = (value: string | Date, days: number) =>
    Date.now() - this.parse(value).getTime() <= days * this.DAY;

  static format = (value: string | Date, options: Intl.DateTimeFormatOptions = {dateStyle: "medium"}) =>
    new Intl.DateTimeFormat(i18n.language, options).format(this.parse(value));

  static formatDate = (value: string | Date) => this.format(value, {day: "numeric", month: "short", year: "numeric"});

  static formatDateTime = (value: string | Date) =>
    this.format(value, {day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"});

  static weekday = (value: string | Date, style: "long" | "short" = "long") =>
    this.format(value, {weekday: style});

  /** `"08:00:00"` -> `"08:00"` */
  static time = (value?: string | null) => (value ? value.slice(0, 5) : "");

  /** "Today" / "Tomorrow" / "In 3 days" / "Yesterday" / "3 days ago" */
  static relative = (value: string | Date) =>
    new Intl.RelativeTimeFormat(i18n.language, {numeric: "auto"}).format(this.daysFromToday(value), "day");
}

export default DateUtils;
