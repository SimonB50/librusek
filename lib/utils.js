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
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to the start of the day to only compare dates, ignoring time

  return tasks.sort((a, b) => {
    const dueDateA = new Date(a.Date);
    const dueDateB = new Date(b.Date);

    // Check if task A or B is due today
    const isTodayA = dueDateA.getTime() === today.getTime();
    const isTodayB = dueDateB.getTime() === today.getTime();

    // Check if task A or B is overdue
    const isOverdueA = dueDateA.getTime() < today.getTime();
    const isOverdueB = dueDateB.getTime() < today.getTime();

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
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to the start of the day to ignore time

  return absences.sort((a, b) => {
    const fromA = new Date(a.DateFrom);
    const toA = new Date(a.DateTo);
    const fromB = new Date(b.DateFrom);
    const toB = new Date(b.DateTo);

    // Check if A is active (today is between DateFrom and DateTo)
    const isActiveA = today >= fromA && today <= toA;
    const isActiveB = today >= fromB && today <= toB;

    // Check if A is in the future (today is before DateFrom and DateTo)
    const isFutureA = today < fromA;
    const isFutureB = today < fromB;

    // Check if A is in the past (today is after DateTo)
    const isPastA = today > toA;
    const isPastB = today > toB;

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

export { upperFirst, getSemester, calculateAvarage, sortTasks, sortTeacherAbsences };
