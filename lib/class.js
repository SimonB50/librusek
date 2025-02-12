import Request from "./request";

import { apiUrl } from "./core";

import { useState, useEffect } from "react";

const getClass = async () => {
  const classData = await Request.get(`${apiUrl}/Classes`, {
    cache: { enabled: true, period: 0 },
  });
  if (!classData) return false;
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
