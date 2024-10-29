import { fetch } from "@tauri-apps/plugin-http";

import { apiUrl } from "./core";

import { useState, useEffect } from "react";

const getUser = async () => {
  const userRequest = await fetch(`${apiUrl}/Me`);
  if (!userRequest.ok) return false;
  const userData = await userRequest.json();
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
  const notificationRequest = await fetch(`${apiUrl}/NotificationCenter`);
  if (!notificationRequest.ok) return false;
  const notificationData = await notificationRequest.json();
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
  const notesRequest = await fetch(`${apiUrl}/Notes`);
  if (!notesRequest.ok) return false;
  const notesData = await notesRequest.json();
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
