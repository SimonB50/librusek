import { fetch } from "@tauri-apps/plugin-http";
import { useState, useEffect } from "react";
import { messagesUrl } from "./core";
import { authenticateMessages } from "./auth";

/**
 * Fetches paginated messages from the API.
 * @param {Object} params - Parameters for fetching messages
 * @param {number} [params.maxMessagesPerPage] - Maximum messages per page
 * @param {number} [params.page] - Page number to fetch
 * @param {boolean} [params.isInbox=true] - Fetch inbox (true) or outbox (false) messages
 * @returns {Promise<object|null>} Messages data or null if authentication fails
 * @throws {Error} When fetch request fails
 */
const getMessages = async ({ maxMessagesPerPage, page, isInbox = true }) => {
  // Check authentication before making the request
  const isAuthenticated = await authenticateMessages();
  if (!isAuthenticated) {
    return null;
  }

  // Build URL query parameters
  const queryParams = new URLSearchParams({
    ...(maxMessagesPerPage !== undefined && { limit: maxMessagesPerPage }),
    ...(page !== undefined && { page }),
  }).toString();

  // Select folder based on isInbox parameter
  const folder = isInbox ? "inbox" : "outbox";
  // Construct full URL with query parameters
  const url = `${messagesUrl}/${folder}/messages${
    queryParams ? `?${queryParams}` : ""
  }`;

  // Execute API request
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.status}`);
  }

  // Parse and return JSON response
  return response.json();
};

/**
 * Fetches details for a specific message.
 * @param {Object} params - Message fetch parameters
 * @param {string} params.messageId - ID of the message to fetch
 * @param {boolean} [params.isInbox=true] - Fetch from inbox (true) or outbox (false)
 * @returns {Promise<object>} Message details
 * @throws {Error} When authentication fails or fetch is unsuccessful
 */
const fetchMessageDetail = async ({ messageId, isInbox = true }) => {
  // Verify user authentication
  const isAuthenticated = await authenticateMessages();
  if (!isAuthenticated) {
    throw new Error("Authentication required");
  }

  // Determine source folder for the message
  const folder = isInbox ? "inbox" : "outbox";
  // Build URL for specific message
  const url = `${messagesUrl}/${folder}/messages/${messageId}`;

  // Perform HTTP GET request with headers
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  // Check response status
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  // Parse JSON response
  const jsonResponse = await response.json();
  // Validate response format
  if (!jsonResponse?.data) {
    throw new Error("Invalid response format: No data found");
  }

  // Return message data
  return jsonResponse.data;
};

/**
 * Custom hook to manage messages state and fetching.
 * @param {Object} options - Message fetching options
 * @param {number} [options.maxMessagesPerPage] - Maximum messages per page
 * @param {number} [options.page] - Page number to fetch
 * @param {boolean} [options.isInbox=true] - Fetch from inbox (true) or outbox (false)
 * @returns {object} State with data, loading, and error properties
 */
const useMessages = ({ maxMessagesPerPage, page, isInbox = true }) => {
  // Initialize hook states
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Helper function to fetch messages
    const fetchMessages = async () => {
      // Set initial states before fetching
      setIsLoading(true);
      setError(null);

      try {
        // Fetch messages from API
        const messages = await getMessages({
          maxMessagesPerPage,
          page,
          isInbox,
        });
        // Update state with data
        setData(messages);
      } catch (fetchError) {
        // Handle fetch errors
        setError(`Error fetching messages: ${fetchError.message}`);
      } finally {
        // Complete loading regardless of outcome
        setIsLoading(false);
      }
    };

    // Trigger fetch function
    fetchMessages();
  }, [maxMessagesPerPage, page, isInbox]); // Effect dependencies

  // Return hook state
  return {
    data,
    loading: isLoading,
    error,
  };
};

/**
 * Retrieves detailed information for a specific message.
 * @param {string} messageId - The ID of the message to fetch
 * @param {boolean} [isInbox=true] - Whether to fetch from inbox (true) or outbox (false)
 * @returns {Promise<object>} Object containing message details, loading state, and error
 */
const getMessageDetail = async (messageId, isInbox = true) => {
  // Validate messageId parameter
  if (!messageId) {
    return {
      messageDetail: null,
      isLoading: false,
      error: 'Message ID is required',
    };
  }

  // Initialize default response structure
  const response = {
    messageDetail: null,
    isLoading: false,
    error: null,
  };

  try {
    // Fetch message details from API
    const messageDetail = await fetchMessageDetail({ messageId, isInbox });
    return {
      ...response,
      messageDetail,
    };
  } catch (error) {
    // Handle and return error state
    return {
      ...response,
      error: `Failed to fetch message details: ${error.message}`,
    };
  }
};

export { getMessages, fetchMessageDetail, useMessages, getMessageDetail };
