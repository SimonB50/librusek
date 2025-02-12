import { apiUrl } from "./core";

import { useState, useEffect } from "react";
import Request from "./request";

const getGrades = async () => {
  const gradesData = await Request.get(`${apiUrl}/Grades`, {
    cache: { enabled: true, period: 60 },
  });
  if (!gradesData) return false;
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

const getGradesCategories = async (selectors) => {
  if (!selectors || !selectors.length) return false;
  const gradesCategoriesData = await Request.get(
    `${apiUrl}/Grades/Categories/`,
    {
      cache: { enabled: true, period: 0 },
      selectors,
    }
  );
  if (!gradesCategoriesData) return false;
  return gradesCategoriesData;
};
const useGradesCategories = (selectors) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getGradesCategories(selectors.split(","));
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
  }, [selectors]);

  return { data, loading, error };
};

const getPoints = async () => {
  const pointsData = await Request.get(`${apiUrl}/PointGrades`, {
    cache: { enabled: true, period: 60 },
  });
  if (!pointsData) return false;
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

const getPointsCategories = async (selectors) => {
  if (!selectors || !selectors.length) return false;
  const pointsCategoriesData = await Request.get(
    `${apiUrl}/PointGrades/Categories`,
    {
      cache: { enabled: true, period: 0 },
      selectors,
    }
  );
  if (!pointsCategoriesData) return false;
  return pointsCategoriesData;
};
const usePointsCategories = (selectors) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPointsCategories(selectors.split(","));
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
  }, [selectors]);

  return { data, loading, error };
};

const getTextGrades = async () => {
  const textGradesData = await Request.get(`${apiUrl}/TextGrades`, {
    cache: { enabled: true, period: 60 },
  });
  if (!textGradesData) return false;
  return textGradesData;
};
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

const getTextGradesCategories = async (selectors) => {
  if (!selectors || !selectors.length) return false;
  const textGradesCategoriesData = await Request.get(
    `${apiUrl}/TextGrades/Categories`,
    {
      cache: { enabled: true, period: 0 },
      selectors,
    }
  );
  if (!textGradesCategoriesData) return false;
  return textGradesCategoriesData;
};
const useTextGradesCategories = (selectors) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTextGradesCategories(selectors.split(","));
        if (!data)
          throw new Error("Failed to fetch text grades categories data");
        setData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectors]);

  return { data, loading, error };
};

const getBehaviourGrades = async () => {
  const behaviourGradesData = await Request.get(`${apiUrl}/BehaviourGrades`, {
    cache: { enabled: true, period: 60 },
  });
  if (!behaviourGradesData) return false;
  return behaviourGradesData;
};
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

const getBehaviourGradesTypes = async (selectors) => {
  if (!selectors || !selectors.length) return false;
  const behaviourGradesTypesData = await Request.get(
    `${apiUrl}/BehaviourGrades/Types`,
    {
      cache: { enabled: false, period: 0 },
      selectors,
    }
  );
  if (!behaviourGradesTypesData) return false;
  return behaviourGradesTypesData;
};
const useBehaviourGradesTypes = (selectors) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getBehaviourGradesTypes(selectors.split(","));
        if (!data)
          throw new Error("Failed to fetch behaviour grades types data");
        setData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectors]);

  return { data, loading, error };
};

const getGradeComments = async (selectors) => {
  if (!selectors || !selectors.length) return false;
  const commentData = await Request.get(`${apiUrl}/Grades/Comments`, {
    cache: { enabled: true, period: 0 },
    selectors,
  });
  if (!commentData) return false;
  return commentData;
};
const useGradeComments = (selectors) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getGradeComments(selectors.split(","));
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
  }, [selectors]);

  return { data, loading, error };
};

const getPointComments = async (selectors) => {
  if (!selectors || !selectors.length) return false;
  const commentData = await Request.get(`${apiUrl}/PointGrades/Comments`, {
    cache: { enabled: true, period: 0 },
    selectors,
  });
  if (!commentData) return false;
  return commentData;
};
const usePointComments = (selectors) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPointComments(selectors.split(","));
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
  }, [selectors]);

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
