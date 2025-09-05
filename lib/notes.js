import { useState, useEffect } from "react";
import Request from "./request";

// Base URL for the new notes/comments API from wiadomosci.librus.pl
const notesApiUrl = "https://wiadomosci.librus.pl/api";

// Specific endpoints for notes
const notesUrl = `${notesApiUrl}/inbox/messages`;
const noteDetailsUrl = `${notesApiUrl}/inbox/messages/`;

/**
 * Fetches paginated notes from the inbox with specific categories.
 * Categories are 1 (Uwagi) and 6 (Pochwały).
 * @param {Object} params - Parameters for fetching notes.
 * @param {number} [params.page=1] - Page number to fetch.
 * @param {number} [params.limit=25] - Number of notes per page.
 * @returns {Promise<Object|boolean>} Returns notes data object if successful, false if failed.
 * @throws {Error} If the API request fails.
 */
const getNotes = async ({ page = 1, limit = 25 }) => {
  // Hardcode the categories for notes and commendations
  const url = `${notesUrl}?page=${page}&limit=${limit}&category=1,6`;

  try {
    const notesData = await Request.get(url);
    return notesData || [];
  } catch (error) {
    throw new Error(`Failed to fetch notes: ${error.message}`);
  }
};

/**
 * Custom hook for managing paginated notes data.
 * @returns {Object} An object containing:
 *   - data: Array of notes or null if not loaded.
 *   - loading: Boolean indicating if data is being fetched.
 *   - error: Error message string or null if no error.
 *   - loadMore: Function to load the next page of notes.
 *   - resetBox: Function to reset data and page number.
 */
const useNotes = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fetchedData = await getNotes({ page });

        if (!fetchedData) {
            throw new Error("Failed to fetch notes data: No data returned");
        }
        
        if (page === 1 && fetchedData.length === 0) {
            setData([]);
        } else {
            setData((currentData) => [...(currentData || []), ...fetchedData]);
        }
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
    setPage((currentPage) => currentPage + 1);
  };

  const resetBox = () => {
    setData(null);
    setPage(1);
  };

  return { data, loading, error, loadMore, resetBox };
};

/**
 * Fetches details for a specific note.
 * @param {string|number} noteId - ID of the note to fetch.
 * @returns {Promise<Object|boolean>} Returns note details if successful, false if failed.
 */
const getNoteDetails = async (noteId) => {
  if (!noteId) return false;

  const url = `${noteDetailsUrl}${noteId}`;
  const noteData = await Request.get(url);
  
  if (!noteData) return false;
  return noteData;
};

/**
 * Custom hook for fetching and managing single note details.
 * @param {string|number} noteId - ID of the note to fetch.
 * @returns {Object} An object containing:
 *   - data: Note details or null if not loaded.
 *   - loading: Boolean indicating if data is being fetched.
 *   - error: Error message string or null if no error.
 */
const useNoteDetails = (noteId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!noteId) {
        setLoading(false);
        return;
    }
    const fetchData = async () => {
      try {
        const fetchedData = await getNoteDetails(noteId);
        if (!fetchedData) throw new Error("Failed to fetch note details data");
        setData(fetchedData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [noteId]);

  return { data, loading, error };
};

export {
  getNotes,
  getNoteDetails,
  useNotes,
  useNoteDetails,
};
