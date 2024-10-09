import { fetch } from "@tauri-apps/plugin-http";

import { apiUrl } from "./core";

import { useState, useEffect } from "react";

const getSchool = async () => {
  const schoolRequest = await fetch(`${apiUrl}/Schools`);
  if (!schoolRequest.ok) return false;
  const schoolData = await schoolRequest.json();
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

const getSubjects = async () => {
  const subjectsRequest = await fetch(`${apiUrl}/Subjects`);
  if (!subjectsRequest.ok) return false;
  const subjectsData = await subjectsRequest.json();
  return subjectsData;
};
const useSubjects = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getSubjects();
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
  }, []);

  return { data, loading, error };
};

const getVirtualClasses = async () => {
  const virtualClassesRequest = await fetch(`${apiUrl}/VirtualClasses`);
  if (!virtualClassesRequest.ok) return false;
  const virtualClassesData = await virtualClassesRequest.json();
  return virtualClassesData;
}
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
}

const getTeachers = async (id) => {
  if (!id) return false;
  const teachersRequest = await fetch(`${apiUrl}/Users/0,${id}`);
  if (!teachersRequest.ok) return false;
  const teachersData = await teachersRequest.json();
  return teachersData;
};
const useTeachers = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTeachers(id);
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
  }, [id]);

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
};
