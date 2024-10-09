import { fetch } from "@tauri-apps/plugin-http";

import { apiUrl } from "./core";

import { useState, useEffect } from "react";

const getClass = async () => {
  const classRequest = await fetch(`${apiUrl}/Classes`);
  if (!classRequest.ok) return false;
  const classData = await classRequest.json();
  return classData;
};
const useClass = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getClass();
        if (!data) throw new Error("Failed to fetch class data");
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

export { getClass, useClass };
