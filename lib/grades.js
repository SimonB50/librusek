import { fetch } from "@tauri-apps/plugin-http";

import { apiUrl } from "./core";

import { useState, useEffect } from "react";

const getGrades = async () => {
  const gradesRequest = await fetch(`${apiUrl}/Grades`);
  if (!gradesRequest.ok) return false;
  const gradesData = await gradesRequest.json();
  return gradesData;
};
const useGrades = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getGrades();
        if (!data) throw new Error("Failed to fetch grades data");
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

const getGradesCategories = async (id) => {
  if (!id) return false;
  const gradesCategoriesRequest = await fetch(
    `${apiUrl}/Grades/Categories/0,${id}`
  );
  if (!gradesCategoriesRequest.ok) return false;
  const gradesCategoriesData = await gradesCategoriesRequest.json();
  return gradesCategoriesData;
};
const useGradesCategories = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getGradesCategories(id);
        if (!data) throw new Error("Failed to fetch grades categories data");
        setData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, loading, error };
};

const getPoints = async () => {
  const pointsRequest = await fetch(`${apiUrl}/PointGrades`);
  if (!pointsRequest.ok) return false;
  const pointsData = await pointsRequest.json();
  return pointsData;
};
const usePoints = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPoints();
        if (!data) throw new Error("Failed to fetch points data");
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

const getPointsCategories = async () => {
  const pointsCategoriesRequest = await fetch(
    `${apiUrl}/PointGrades/Categories`
  );
  if (!pointsCategoriesRequest.ok) return false;
  const pointsCategoriesData = await pointsCategoriesRequest.json();
  return pointsCategoriesData;
};
const usePointsCategories = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPointsCategories();
        if (!data) throw new Error("Failed to fetch points categories data");
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

const getGradeComments = async (id) => {
  if (!id) return false;
  const commentRequest = await fetch(`${apiUrl}/Grades/Comments/0,${id}`);
  if (!commentRequest.ok) return false;
  const commentData = await commentRequest.json();
  return commentData;
};
const useGradeComments = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getGradeComments(id);
        if (!data) throw new Error("Failed to fetch comment data");
        setData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, loading, error };
};

const getPointComments = async (id) => {
  if (!id) return false;
  const commentRequest = await fetch(`${apiUrl}/PointGrades/Comments/0,${id}`);
  if (!commentRequest.ok) return false;
  const commentData = await commentRequest.json();
  return commentData;
};
const usePointComments = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPointComments(id);
        if (!data) throw new Error("Failed to fetch comment data");
        setData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, loading, error };
};

export {
  getGrades,
  useGrades,
  getGradesCategories,
  useGradesCategories,
  getPoints,
  usePoints,
  getPointsCategories,
  usePointsCategories,
  getGradeComments,
  useGradeComments,
  getPointComments,
  usePointComments,
};
