import { useState, useEffect } from "react";
import { messagesUrl } from "./core";
import Request from "./request";

// Specific endpoints for messages
export const messagesInboxUrl = `${messagesUrl}/inbox/messages`;
export const messagesOutboxUrl = `${messagesUrl}/outbox/messages`;
export const messageDetailsInboxUrl = `${messagesUrl}/inbox/messages/`;
export const messageDetailsOutboxUrl = `${messagesUrl}/outbox/messages/`;

/**
 * Fetches paginated messages from either inbox or outbox.
 * @param {Object} params - Parameters for fetching messages
 * @param {number} [params.page=1] - Page number to fetch (default: 1)
 * @param {number} [params.limit=5] - Number of messages per page (default: 5)
 * @param {boolean} params.isInbox - True for inbox messages, false for outbox messages
 * @returns {Promise<Object|boolean>} Returns message data object if successful, false if failed
 * @throws {Error} If the API request fails
 */
const getMessages = async ({ page = 1, limit = 5, isInbox }) => {
  const baseUrl = isInbox ? messagesInboxUrl : messagesOutboxUrl;
  const url = `${baseUrl}?page=${page}&limit=${limit}`;

  try {
    const messagesData = await Request.get(url);
    if (!messagesData) return false;
    return messagesData;
  } catch (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }


};

/**
 * Custom hook for managing paginated message data
 * @param {boolean} isInbox - True for inbox messages, false for outbox messages
 * @returns {Object} An object containing:
 *   - data: Array of messages or null if not loaded
 *   - loading: Boolean indicating if data is being fetched
 *   - error: Error message string or null if no error
 *   - loadMore: Function to load the next page of messages
 *   - resetBox: Function to reset data and page number
 */
const useMessages = (isInbox) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // State for current page number
  const [page, setPage] = useState(1); //we should start from page `1` no `0`

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fetchedData = await getMessages({ page, isInbox });

        if (!fetchedData || !fetchedData.length) {
          setError(true);
          throw new Error("Failed to fetch message data");
        }

        setData((currentData) => [...(currentData || []), ...fetchedData]);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        // Complete loading regardless of outcome
        setLoading(false);
      }
    };

    fetchData();
  }, [page, isInbox]);

  const loadMore = () => {
    setPage((currentPage) => currentPage + 1);
  };

  const resetBox = () => {
    setData(null);
    setPage(1);
  };

  return { data, loading, error, loadMore, resetBox };
};

/**
 * Fetches details for a specific message
 * @param {string|number} messageId - ID of the message to fetch
 * @param {boolean} [isInbox=true] - True for inbox message, false for outbox message
 * @returns {Promise<Object|boolean>} Returns message details if successful, false if failed
 */
const getMessageDetails = async (messageId, isInbox = true) => {
  if (!messageId) return false;

  const baseUrl = isInbox ? messageDetailsInboxUrl : messageDetailsOutboxUrl;
  const url = `${baseUrl}${messageId}`;

  const messageData = await Request.get(url);
  if (!messageData) return false;
  return messageData;
};

/**
 * Custom hook for fetching and managing single message details
 * @param {string|number} messageId - ID of the message to fetch
 * @param {boolean} isInbox - True for inbox message, false for outbox message
 * @returns {Object} An object containing:
 *   - data: Message details or null if not loaded
 *   - loading: Boolean indicating if data is being fetched
 *   - error: Error message string or null if no error
 */
const useMessageDetails = (messageId, isInbox) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedData = await getMessageDetails(messageId, isInbox);
        if (!fetchedData) throw new Error("Failed to fetch message data");
        setData(fetchedData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [messageId, isInbox]);

  return { data, loading, error };
};

export { getMessages, getMessageDetails, useMessages, useMessageDetails };
