import dayjs from "dayjs";

const deduplicate = (array) => {
  return array.filter((value, index, self) => self.indexOf(value) === index);
};

const upperFirst = (string) => {
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

export { deduplicate, upperFirst, getSemester, calculateAvarage, sortTasks, sortTeacherAbsences };
