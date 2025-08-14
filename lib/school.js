import { apiUrl } from "./core";

import { useState, useEffect } from "react";
import Request from "./request";

const getSchool = async () => {
  const schoolData = await Request.get(`${apiUrl}/Schools`, {
    cache: { enabled: true, period: 0 },
  });
  if (!schoolData) return false;
  return schoolData;
};
const useSchool = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getSchool();
        if (!data) throw new Error("Failed to fetch school data");
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

const getSubjects = async (selectors) => {
  if (!selectors || !selectors.length) return false;
  const subjectsData = await Request.get(`${apiUrl}/Subjects`, {
    cache: { enabled: true, period: 0 },
    selectors,
  });
  if (!subjectsData) return false;
  return subjectsData;
};
const useSubjects = (selectors) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getSubjects(selectors ? selectors.split(",") : "0");
        if (!data) throw new Error("Failed to fetch subjects data");
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

const getVirtualClasses = async () => {
  const virtualClassesData = await Request.get(`${apiUrl}/VirtualClasses`, {
    cache: { enabled: true, period: 0 },
  });
  if (!virtualClassesData) return false;
  return virtualClassesData;
};
const useVirtualClasses = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getVirtualClasses();
        if (!data) throw new Error("Failed to fetch virtual classes data");
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

const getTeachers = async (selectors) => {
  if (!selectors || !selectors.length) return false;
  const teachersData = await Request.get(`${apiUrl}/Users`, {
    cache: { enabled: true, period: 0 },
    selectors,
  });
  if (!teachersData) return false;
  return teachersData;
};
const useTeachers = (selectors) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTeachers(selectors ? selectors.split(",") : "0");
        if (!data) throw new Error("Failed to fetch teachers data");
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

const getAnnouncements = async () => {
  const announcementsData = await Request.get(`${apiUrl}/SchoolNotices`, {
    cache: { enabled: true, period: 60 },
  });
  if (!announcementsData) return false;
  return announcementsData;
};
const useAnnouncements = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAnnouncements();
        if (!data) throw new Error("Failed to fetch announcements data");
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
  getSchool,
  useSchool,
  getSubjects,
  useSubjects,
  getVirtualClasses,
  useVirtualClasses,
  getTeachers,
  useTeachers,
  getAnnouncements,
  useAnnouncements,
};
