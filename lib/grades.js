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

const getPointsCategories = async (id) => {
  if (!id) return false;
  const pointsCategoriesRequest = await fetch(
    `${apiUrl}/PointGrades/Categories/0,${id}`
  );
  if (!pointsCategoriesRequest.ok) return false;
  const pointsCategoriesData = await pointsCategoriesRequest.json();
  return pointsCategoriesData;
};
const usePointsCategories = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPointsCategories(id);
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
  }, [id]);

  return { data, loading, error };
};

const getTextGrades = async () => {
  const textGradesRequest = await fetch(`${apiUrl}/TextGrades`);
  if (!textGradesRequest.ok) return false;
  const textGradesData = await textGradesRequest.json();
  return textGradesData;
}
const useTextGrades = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTextGrades();
        if (!data) throw new Error("Failed to fetch text grades data");
        setData(data);
        setError(null);
      }
      catch (err) {
        setError(err.message);
      }
      finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}

const getTextGradesCategories = async (id) => {
  if (!id) return false;
  const textGradesCategoriesRequest = await fetch(`${apiUrl}/TextGrades/Categories/0,${id}`);
  if (!textGradesCategoriesRequest.ok) return false;
  const textGradesCategoriesData = await textGradesCategoriesRequest.json();
  return textGradesCategoriesData;
}
const useTextGradesCategories = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTextGradesCategories(id);
        if (!data) throw new Error("Failed to fetch text grades categories data");
        setData(data);
        setError(null);
      }
      catch (err) {
        setError(err.message);
      }
      finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id]);

  return { data, loading, error };
}

const getBehaviourGrades = async () => {
  const behaviourGradesRequest = await fetch(`${apiUrl}/BehaviourGrades`);
  if (!behaviourGradesRequest.ok) return false;
  const behaviourGradesData = await behaviourGradesRequest.json();
  return behaviourGradesData;
}
const useBehaviourGrades = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getBehaviourGrades();
        if (!data) throw new Error("Failed to fetch behaviour grades data");
        setData(data);
        setError(null);
      }
      catch (err) {
        setError(err.message);
      }
      finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}

const getBehaviourGradesTypes = async (id) => {
  if (!id) return false;
  const behaviourGradesTypesRequest = await fetch(`${apiUrl}/BehaviourGrades/Types/0,${id}`);
  if (!behaviourGradesTypesRequest.ok) return false;
  const behaviourGradesTypesData = await behaviourGradesTypesRequest.json();
  return behaviourGradesTypesData;
}
const useBehaviourGradesTypes = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getBehaviourGradesTypes(id);
        if (!data) throw new Error("Failed to fetch behaviour grades types data");
        setData(data);
        setError(null);
      }
      catch (err) {
        setError(err.message);
      }
      finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  return { data, loading, error };
}

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
  getTextGrades,
  useTextGrades,
  getTextGradesCategories,
  useTextGradesCategories,
  getBehaviourGrades,
  useBehaviourGrades,
  getBehaviourGradesTypes,
  useBehaviourGradesTypes,
  getGradeComments,
  useGradeComments,
  getPointComments,
  usePointComments,
};
