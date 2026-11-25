abstract class Display {
  static lowerFirst = (text: string) =>
    text ? text[0].toLowerCase() + text.slice(1) : text;

  static upperFirst = (text: string) =>
    text ? text[0].toUpperCase() + text.slice(1) : text;

  /** `"MATEMATYKA"` -> `"Matematyka"` - Librus often returns names in caps. */
  static capitalize = (text: string) =>
    this.upperFirst(text.toLowerCase());

  static fullName = (person?: { firstName?: string | null; lastName?: string | null } | null) =>
    person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : "";
}

export default Display;
