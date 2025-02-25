import dayjs from "dayjs";
import sanitizeHtml from 'sanitize-html';


const deduplicate = (array) => {
  return array.filter((value, index, self) => self.indexOf(value) === index);
};

const upperFirst = (string) => {
  if (!string) return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const getSemester = (grades, subjects) => {
  const actualSubjects = subjects.filter((subject) =>
    grades.find((grade) => grade.Subject.Id === subject.Id)
  );
  if (
    actualSubjects.length ==
    grades.filter((grade) => grade.IsSemester == true).length
  )
    return 2;
  return 1;
};

const calculateAvarage = (grades, categories) => {
  let top = 0;
  let bottom = 0;
  for (let i = 0; i < grades.length; i++) {
    const grade = grades[i];
    if (isNaN(grade.Grade)) continue;
    const category = categories.find(
      (category) => category.Id === grade.Category.Id
    );
    if (!category || isNaN(category.Weight)) continue;
    top += category.Weight * parseFloat(grade.Grade);
    bottom += category.Weight;
  }
  const result = top / bottom;
  if (isNaN(result)) return "No grades";
  return result.toFixed(2);
};

const sortTasks = (tasks) => {
  const today = dayjs().startOf("day").valueOf();

  return tasks.sort((a, b) => {
    const dueDateA = dayjs(a.Date).startOf("day").valueOf();
    const dueDateB = dayjs(b.Date).startOf("day").valueOf();

    // Check if task A or B is due today
    const isTodayA = dueDateA === today;
    const isTodayB = dueDateB === today;

    // Check if task A or B is overdue
    const isOverdueA = dueDateA < today;
    const isOverdueB = dueDateB < today;

    // If A is due today and B is not, A comes first
    if (isTodayA && !isTodayB) return -1;
    if (!isTodayA && isTodayB) return 1;

    // If both are overdue, sort them from latest to oldest overdue
    if (isOverdueA && isOverdueB) return dueDateB - dueDateA;

    // If A is overdue and B is not, B comes first (A goes last)
    if (isOverdueA && !isOverdueB) return 1;
    if (!isOverdueA && isOverdueB) return -1;

    // Otherwise, sort by due date in ascending order
    return dueDateA - dueDateB;
  });
};

const sortTeacherAbsences = (absences) => {
  const now = dayjs().valueOf();

  return absences.sort((a, b) => {
    const fromA = dayjs(a.DateFrom).startOf("day").valueOf();
    const toA = dayjs(a.DateTo).endOf("day").valueOf();
    const fromB = dayjs(b.DateFrom).startOf("day").valueOf();
    const toB = dayjs(b.DateTo).endOf("day").valueOf();

    // Check if A is active (today is between DateFrom and DateTo)
    const isActiveA = now >= fromA && now <= toA;
    const isActiveB = now >= fromB && now <= toB;

    // Check if A is in the future (today is before DateFrom and DateTo)
    const isFutureA = now < fromA;
    const isFutureB = now < fromB;

    // Check if A is in the past (today is after DateTo)
    const isPastA = now > toA;
    const isPastB = now > toB;

    // If A is active and B is not, A comes first
    if (isActiveA && !isActiveB) return -1;
    if (!isActiveA && isActiveB) return 1;

    // If both are future, sort by DateFrom in ascending order
    if (isFutureA && isFutureB) return fromA - fromB;

    // If A is future and B is not, A comes first
    if (isFutureA && !isFutureB) return -1;
    if (!isFutureA && isFutureB) return 1;

    // If both are past, sort by DateTo in descending order
    if (isPastA && isPastB) return toB - toA;

    // If A is past and B is not, B comes first (A goes last)
    if (isPastA && !isPastB) return 1;
    if (!isPastA && isPastB) return -1;

    // Fallback to sorting by DateFrom in ascending order if none of the above applies
    return fromA - fromB;
  });
};

const groupAbsences = (absences) => {
  const groups = {};
  for (const absence of absences) {
    const key = absence.Date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(absence);
  }
  return Array.from(Object.keys(groups));
}



const decodeBase64 = (base64String) => {
  const binaryString = atob(base64String);
  const byteArray = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    byteArray[i] = binaryString.charCodeAt(i);
  }

  const decoder = new TextDecoder('utf-8');
  return decoder.decode(byteArray);
};

/**
 * Formats a date and time to a specified format.
 *
 * @param {string|Date} date - The date and time to format.
 * @param {string} [format='DD MMMM YYYY, H:mm:ss'] - The output format (default: 'DD MMMM YYYY, H:mm:ss').
 * @param {string} [Intl.DateTimeFormat().resolvedOptions().locale] - The locale to use (default: system locale).
 * @returns {string} The formatted date and time.
 */
const formatDate = (date, format = 'DD MMMM YYYY, H:mm:ss', locale =  Intl.DateTimeFormat().resolvedOptions().locale) => {
  try {
    dayjs.locale(locale);
    const dayJsDate = dayjs(date);
    if (!dayJsDate.isValid()) {
      throw new Error('Invalid date');
    }
    return dayJsDate.format(format);
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

// Utility function to remove CDATA tags from HTML text
const removeCDATA = (html) => {
  // Replace all occurrences of <![CDATA[...]]> with the content inside, using global and multi-line flags
  return html.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
};

/**
 * Decodes Base64 HTML, removes CDATA tags, and optionally replaces newlines with <br />
 * @param {string} html - Base64 encoded HTML string
 * @param {boolean} [addBreaks=true] - Whether to replace newlines with <br /> tags
 * @returns {string} Cleaned and sanitized HTML string
 */
const decodeAndCleanHtml = (html, addBreaks = true) => {
  // Decode the Base64 string to plain text
  let decoded = decodeBase64(html);

  // Remove CDATA tags and trim whitespace
  decoded = removeCDATA(decoded).trim();

  // Replace newlines with <br /> tags if addBreaks is enabled, otherwise keep as is
  const processedHtml = addBreaks ? decoded.replace(/\n/g, '<br />') : decoded;

  // Sanitize the HTML, allowing only a specific set of safe tags
  return sanitizeHtml(processedHtml, {
    allowedTags: ['p', 'a', 'b', 'i', 'u', 'strong', 'em', 'br'],
  });
};



export { deduplicate, upperFirst, getSemester, calculateAvarage, sortTasks, sortTeacherAbsences, groupAbsences, decodeAndCleanHtml, decodeBase64, removeCDATA, formatDate };
