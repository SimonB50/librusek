import { fetch } from "@tauri-apps/plugin-http";

import { apiUrl } from "./core";

import { useState, useEffect } from "react";

const getTimetable = async (weekStart) => {
  if (!weekStart) return false;
  const timetableRequest = await fetch(
    `${apiUrl}/Timetables?weekStart=${weekStart}`
  );
  if (!timetableRequest.ok) return false;
  const timetableData = await timetableRequest.json();
  return timetableData;
};
const useTimetable = (weekStart) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
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
  const timetableEntriesRequest = await fetch(`${apiUrl}/TimetableEntries`);
  if (!timetableEntriesRequest.ok) return false;
  const timetableEntriesData = await timetableEntriesRequest.json();
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

const getHomeworks = async () => {
  const homeworksRequest = await fetch(`${apiUrl}/HomeWorks`);
  if (!homeworksRequest.ok) return false;
  const homeworksData = await homeworksRequest.json();
  return homeworksData;
};
const useHomeworks = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getHomeworks();
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
const getHomeworksCategories = async (id) => {
  if (!id) return false;
  const homeworksCategoriesRequest = await fetch(
    `${apiUrl}/HomeWorks/Categories/0,${id}`
  );
  if (!homeworksCategoriesRequest.ok) return false;
  const homeworksCategoriesData = await homeworksCategoriesRequest.json();
  return homeworksCategoriesData;
};
const useHomeworksCategories = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getHomeworksCategories(id);
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
  }, [id]);

  return { data, loading, error };
};

const getTeacherAbsences = async () => {
  const teacherAbsencesRequest = await fetch(`${apiUrl}/TeacherFreeDays`);
  if (!teacherAbsencesRequest.ok) return false;
  const teacherAbsencesData = await teacherAbsencesRequest.json();
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
  getHomeworks,
  useHomeworks,
  getHomeworksCategories,
  useHomeworksCategories,
  getTeacherAbsences,
  useTeacherAbsences,
};
