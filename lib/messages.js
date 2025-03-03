import { useState, useEffect } from "react";
import { messagesUrl } from "./core";
import Request from "./request";

const getMessages = async (page = 0, limit = 5) => {
  const messagesData = await Request.get(
    `${messagesUrl}/inbox/messages?page=${page}&limit=${limit}`
  );
  if (!messagesData) return false;
  return messagesData;
};
const useMessages = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMessages(page);
        if (!data || !data.length) throw new Error("Failed to fetch message data");
        setData((currentData) => [...(currentData || []), ...data]);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page]);

  const loadMore = () => {
    setLoading(true);
    setPage((currentPage) => currentPage + 1);
  };

  return { data, loading, error, loadMore };
};

const getMessageDetails = async (messageId) => {
  if (!messageId) return false;
  const messageData = await Request.get(
    `${messagesUrl}/inbox/messages/${messageId}`
  );
  if (!messageData) return false;
  return messageData;
};
const useMessageDetails = (messageId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMessageDetails(messageId);
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
  }, [messageId]);

  return { data, loading, error };
};

export { getMessages, getMessageDetails, useMessages, useMessageDetails };
