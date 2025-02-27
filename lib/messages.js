import { fetch } from '@tauri-apps/plugin-http';
import { useState, useEffect } from 'react';
import { messagesUrl } from "./core"
import { authenticateMessages } from "./auth"




/**
 * Fetches paginated messages from the API.
 * @param {number} [maxMessagesPerPage] - Maximum number of messages per page.
 * @param {number} [page] - Page number to fetch.
 * @returns {Promise<object|null>} Messages data or null if authentication fails.
 * @throws {Error} If the fetch request fails.
 */
const getMessages = async (maxMessagesPerPage, page) => {
  if (!(await authenticateMessages())) return null;

  const queryParams = new URLSearchParams(
    Object.entries({
      limit: maxMessagesPerPage,
      page,
    }).filter(([, value]) => value !== undefined)
  ).toString();

  try {
    const response = await fetch(`${messagesUrl}/inbox/messages${queryParams ? `?${queryParams}` : ''}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    throw new Error(`Messages fetch error: ${error.message}`);
  }
};

/**
 * Fetches details for a specific message.
 * @param {string} messageId - The ID of the message to fetch.
 * @returns {Promise<object>} Message details.
 * @throws {Error} If authentication fails or the fetch request is unsuccessful.
 */
const fetchMessageDetail = async (messageId) => {
  if (!(await authenticateMessages())) {
    throw new Error('Authentication required');
  }

  try {
    const response = await fetch(`${messagesUrl}/inbox/messages/${messageId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const jsonResponse = await response.json();
    if (!jsonResponse?.data) {
      throw new Error('Invalid response format: No data found');
    }

    return jsonResponse.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Custom hook to manage messages state and fetching.
 * @param {number} [maxMessagesPerPage] - Maximum messages per page.
 * @param {number} [page] - Page number to fetch.
 * @returns {object} State containing data, loading, and error properties.
 */
const useMessages = (maxMessagesPerPage, page) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {


    const fetchMessages = async () => {
      setLoading(true);
      setError(null);

      try {
        const messages = await getMessages(maxMessagesPerPage, page);
        setData(messages);
      } catch (fetchError) {
        setError(`Error fetching messages: ${fetchError.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();


  }, [maxMessagesPerPage, page]);

  return { data, loading, error };
};

/**
 * Retrieves detailed information for a specific message.
 * @param {string} messageId - The ID of the message.
 * @returns {Promise<object>} Object with message details, loading state, and error.
 */
const getMessageDetail = async (messageId) => {
  if (!messageId) {
    return {
      messageDetail: null,
      loading: false,
      error: 'Message ID is required',
    };
  }

  try {
    const messageDetail = await fetchMessageDetail(messageId);
    return {
      messageDetail,
      loading: false,
      error: null,
    };
  } catch (error) {
    return {
      messageDetail: null,
      loading: false,
      error: `Failed to fetch message details: ${error.message}`,
    };
  }
};

export { getMessages, fetchMessageDetail, useMessages, getMessageDetail };