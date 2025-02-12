import { apiUrl } from "./core";

import { useState, useEffect } from "react";
import Request from "./request";

const getUser = async () => {
  const userData = await Request.get(`${apiUrl}/Me`);
  if (!userData) return false;
  return userData;
};
const useUser = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getUser();
        if (!data) throw new Error("Failed to fetch user data");
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

const getNotifications = async () => {
  const notificationData = await Request.get(`${apiUrl}/NotificationCenter`, {
    cache: { enabled: true, period: 60 },
  });
  if (!notificationData) return false;
  return notificationData;
};
const useNotifications = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getNotifications();
        if (!data) throw new Error("Failed to fetch notifications");
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

const getNotes = async () => {
  const notesData = await Request.get(`${apiUrl}/Notes`, {
    cache: { enabled: true, period: 60 },
  });
  if (!notesData) return false;
  return notesData;
};
const useNotes = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getNotes();
        if (!data) throw new Error("Failed to fetch notes");
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
  getUser,
  useUser,
  getNotifications,
  useNotifications,
  getNotes,
  useNotes,
};
