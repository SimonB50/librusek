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


////reply to logic

/**
 * Sends a reply to a specific message using the messages API with Base64 encoding.
 * @param {Object} params - Parameters for sending the message reply
 * @param {Object} params.message - Source message containing required details
 * @param {string} params.message.topic - Message topic to be Base64 encoded
 * @param {string} params.message.id - ID of the original message
 * @param {Array} params.message.receivers - Array of receiver objects
 * @param {string} params.content - Message content to be Base64 encoded
 * @param {string} [params.copyTo=''] - Optional CC field
 * @param {string} [params.category='normal'] - Optional message category
 * @returns {Promise<object>} Response data from the API
 * @throws {Error} When authentication fails or API request is unsuccessful
 */
const sendMessageReply = async ({
  message,
  content,
  copyTo = '',
  category = 'normal',
}) => {
  validateMessageObject(message, content);
  await ensureAuthentication();

  const requestBody = buildRequestBody(message, content, copyTo, category);
  const url = `${messagesUrl}/api/messages/reply`;

  const response = await performApiRequest(url, requestBody, message.id);
  return processApiResponse(response);
};

/**
 * Validates the message object and content
 * @param {Object} message - Message object to validate
 * @param {string} content - Message content to validate
 * @throws {Error} When required fields are missing or invalid
 */
const validateMessageObject = (message, content) => {
  const isValid = message
    && message.topic
    && message.id
    && Array.isArray(message.receivers)
    && message.receivers.every(receiver => receiver.receiverId)
    && typeof content === 'string'
    && content.length > 0;

  if (!isValid) {
    throw new Error('Invalid input: Missing or invalid required fields (topic, id, receivers with receiverId, or content)');
  }
};


/**
 * Builds the request body with Base64 encoded topic and content
 * @param {Object} message - Source message object
 * @param {string} content - Message content
 * @param {string} copyTo - CC field
 * @param {string} category - Message category
 * @returns {Object} Formatted request body with Base64 encoded fields
 */
const buildRequestBody = (message, content, copyTo, category) => ({
  topic: btoa(message.topic),
  content: btoa(content),
  copyTo,
  receivers: {
    schoolReceivers: message.receivers.map(receiver => ({
      accountId: receiver.receiverId,
    })),
  },
  originalMessageId: message.id, // Zachowujemy jako string, jak w przykładzie
  category,
});

/**
 * Performs the API request with proper configuration
 * @param {string} url - API endpoint URL
 * @param {Object} body - Request body
 * @param {string} messageId - ID for referrer construction
 * @returns {Promise<Response>} Fetch response
 * @throws {Error} When request fails
 */
const performApiRequest = async (url, body, messageId) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Accept-Language': 'pl-PL,pl;q=0.9',
      'Sec-Ch-Ua': '"Not A(Brand";v="8", "Chromium";v="132", "Opera";v="117"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    },
    referrer: `${messagesUrl}/nowy/inbox/${messageId}/reply`,
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: JSON.stringify(body),
    mode: 'cors',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
  }

  return response;
};

/**
 * Processes the API response and extracts data
 * @param {Response} response - Fetch response object
 * @returns {Promise<object>} Parsed response data
 * @throws {Error} When response format is invalid
 */
const processApiResponse = async (response) => {
  const jsonResponse = await response.json();

  if (!jsonResponse?.data) {
    throw new Error('Invalid response format: Expected data property in response');
  }

  return jsonResponse.data;
};

export { getMessages, fetchMessageDetail, useMessages, getMessageDetail };
