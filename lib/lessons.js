import { apiUrl } from "./core";

import { useState, useEffect } from "react";
import Request from "./request";

const getLessons = async (selectors) => {
  if (!selectors || !selectors.length) return false;
  const lessonsData = await Request.get(`${apiUrl}/Lessons`, {
    cache: { enabled: true, period: 0 },
    selectors,
  });
  if (!lessonsData) return false;
  return lessonsData;
};
const useLessons = (selectors) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getLessons(selectors.split(","));
        if (!data) throw new Error("Failed to fetch lessons data");
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

const getAttendance = async () => {
  const attendanceData = await Request.get(`${apiUrl}/Attendances`, {
    cache: { enabled: true, period: 60 },
  });
  if (!attendanceData) return false;
  return attendanceData;
};
const useAttendance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAttendance();
        if (!data) throw new Error("Failed to fetch attendance data");
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

const getAttendancesTypes = async (selectors) => {
  if (!selectors || !selectors.length) return false;
  const attendanceTypesData = await Request.get(`${apiUrl}/Attendances/Types`, {
    cache: { enabled: true, period: 0 },
    selectors,
  });
  if (!attendanceTypesData) return false;
  return attendanceTypesData;
};
const useAttendancesTypes = (selectors) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAttendancesTypes(selectors.split(","));
        if (!data) throw new Error("Failed to fetch attendance types data");
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

const getLuckyNumber = async () => {
  const luckyNumberData = await Request.get(`${apiUrl}/LuckyNumbers`, {
    cache: { enabled: true, period: 60 },
  });
  if (!luckyNumberData) return false;
  return luckyNumberData;
};
const useLuckyNumber = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getLuckyNumber();
        if (!data) throw new Error("Failed to fetch lucky number data");
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
  getLessons,
  useLessons,
  getAttendance,
  useAttendance,
  getAttendancesTypes,
  useAttendancesTypes,
  getLuckyNumber,
  useLuckyNumber,
};
