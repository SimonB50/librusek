import { apiUrl } from "./core";

import { useState, useEffect } from "react";
import Request from "./request";

const getTimetable = async (weekStart) => {
  if (!weekStart) return false;
  const timetableData = await Request.get(`${apiUrl}/Timetables`, {
    cache: { enabled: false },
    query: { weekStart },
  });
  if (!timetableData) return false;
  return timetableData;
};
const useTimetable = (weekStart) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getTimetable(weekStart);
        if (!data) throw new Error("Failed to fetch timetable data");
        setData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [weekStart]);

  return { data, loading, error };
};

const getTimetableEntries = async () => {
  const timetableEntriesData = await Request.get(`${apiUrl}/TimetableEntries`, {
    cache: { enabled: true, period: 60 },
  });
  if (!timetableEntriesData) return false;
  return timetableEntriesData;
};
const useTimetableEntries = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTimetableEntries();
        if (!data) throw new Error("Failed to fetch timetable entries data");
        setData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

const getHomeWorks = async () => {
    const homeworksData = await Request.get(`${apiUrl}/HomeWorkAssignments`, {
        cache: { enabled: true, period: 60 },
    });
    if (!homeworksData) return false;
    return homeworksData;
};
const useHomeWorks = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getHomeWorks();
                if (!data) throw new Error("Failed to fetch homeworks data");
                setData(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
};
const getHomeWorksCategories = async (selectors) => {
    if (!selectors || !selectors.length) return false;
    const homeworksCategoriesData = await Request.get(
        `${apiUrl}/HomeWorkAssignments/Categories`,
        {
            cache: { enabled: true, period: 0 },
            selectors,
        }
    );
    if (!homeworksCategoriesData) return false;
    return homeworksCategoriesData;
};
const useHomeWorksCategories = (selectors) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getHomeWorksCategories(selectors ? selectors.split(",") : "0");
                if (!data) throw new Error("Failed to fetch homeworks categories data");
                setData(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectors]);

    return { data, loading, error };
};

const getExams = async () => {
  const homeworksData = await Request.get(`${apiUrl}/HomeWorks`, {
    cache: { enabled: true, period: 60 },
  });
  if (!homeworksData) return false;
  return homeworksData;
};
const useExams = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getExams();
        if (!data) throw new Error("Failed to fetch exams data");
        setData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
const getExamsCategories = async (selectors) => {
  if (!selectors || !selectors.length) return false;
  const homeworksCategoriesData = await Request.get(
    `${apiUrl}/HomeWorks/Categories`,
    {
      cache: { enabled: true, period: 0 },
      selectors,
    }
  );
  if (!homeworksCategoriesData) return false;
  return homeworksCategoriesData;
};
const useExamsCategories = (selectors) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getExamsCategories(selectors ? selectors.split(",") : "0");
        if (!data) throw new Error("Failed to fetch exams categories data");
        setData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectors]);

  return { data, loading, error };
};

const getTeacherAbsences = async () => {
  const teacherAbsencesData = await Request.get(`${apiUrl}/Calendars/TeacherFreeDays`, {
    cache: { enabled: true, period: 60 },
  });
  if (!teacherAbsencesData) return false;
  return teacherAbsencesData;
};
const useTeacherAbsences = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTeacherAbsences();
        if (!data) throw new Error("Failed to fetch teacher absences data");
        setData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

export {
  getTimetable,
  useTimetable,
  getTimetableEntries,
  useTimetableEntries,
  getHomeWorks,
  useHomeWorks,
  getHomeWorksCategories,
  useHomeWorksCategories,
  getExams,
  useExams,
  getExamsCategories,
  useExamsCategories,
  getTeacherAbsences,
  useTeacherAbsences,
};
