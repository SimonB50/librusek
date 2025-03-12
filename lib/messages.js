import { useState, useEffect } from "react";
import { messagesUrl } from "./core";
import Request from "./request";

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
  const folder = isInbox ? "inbox" : "outbox";
  const url = `${messagesUrl}/${folder}/messages?page=${page}&limit=${limit}`;

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
  // State for storing message data
  const [data, setData] = useState(null);
  // State for loading status
  const [loading, setLoading] = useState(true);
  // State for error messages
  const [error, setError] = useState(null);
  // State for current page number
  const [page, setPage] = useState(1); //we should start from page `1` no `0`

  // Effect to handle data fetching when page or isInbox changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fetchedData = await getMessages({ page, isInbox });
        
        // Validate fetched data
        if (!fetchedData || !fetchedData.length) {
          throw new Error("Failed to fetch message data");
        }

        // Append new data to existing data for pagination
        setData((currentData) => [...(currentData || []), ...fetchedData]);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, isInbox]);

  /**
   * Loads the next page of messages
   * @returns {void}
   */
  const loadMore = () => {
    setPage((currentPage) => currentPage + 1);
  };

  /**
   * Resets the message data and page number
   * @returns {void}
   */
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

  const folder = isInbox ? "inbox" : "outbox";
  const url = `${messagesUrl}/${folder}/messages/${messageId}`;

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
  // State for storing message details
  const [data, setData] = useState(null);
  // State for loading status
  const [loading, setLoading] = useState(true);
  // State for error messages
  const [error, setError] = useState(null);

  // Effect to handle fetching message details
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