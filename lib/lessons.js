import { fetch } from "@tauri-apps/plugin-http";

import { apiUrl } from "./core";

import { useState, useEffect } from "react";

const getAttendance = async () => {
  const attendanceRequest = await fetch(`${apiUrl}/Attendances`);
  if (!attendanceRequest.ok) return false;
  const attendanceData = await attendanceRequest.json();
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

const getAttendancesTypes = async () => {
  const attendanceTypesRequest = await fetch(`${apiUrl}/Attendances/Types`);
  if (!attendanceTypesRequest.ok) return false;
  const attendanceTypesData = await attendanceTypesRequest.json();
  return attendanceTypesData;
};
const useAttendancesTypes = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAttendancesTypes();
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
  }, []);

  return { data, loading, error };
};

const getLuckyNumber = async () => {
  const luckyNumberRequest = await fetch(`${apiUrl}/LuckyNumbers`);
  if (!luckyNumberRequest.ok) return false;
  const luckyNumberData = await luckyNumberRequest.json();
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

export { getAttendance, useAttendance, getAttendancesTypes, useAttendancesTypes, getLuckyNumber, useLuckyNumber };
