import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './trainingAuthContext';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://crunches-training.fly.dev';

const AUTH_TOKEN_KEY = 'crunchies_training_web_token';
const AUTH_STAFF_KEY = 'crunchies_training_web_staff';

function readStoredStaff() {
  try {
    const raw = localStorage.getItem(AUTH_STAFF_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState('');
  const [staff, setStaff] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setToken(localStorage.getItem(AUTH_TOKEN_KEY) || '');
    setStaff(readStoredStaff());
    setIsLoading(false);
  }, []);

  const request = useCallback(
    async (path, { method = 'GET', body, auth = true } = {}) => {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (auth && token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      let payload = {};
      try {
        payload = await response.json();
      } catch {
        payload = {};
      }
      if (!response.ok) {
        const message =
          payload.message ||
          payload.error ||
          (response.status === 503
            ? 'Server is not ready. Email may not be configured yet.'
            : `Request failed (${response.status})`);
        throw new Error(message);
      }
      return payload;
    },
    [token]
  );

  const login = useCallback(
    async (staffId, password) => {
      const payload = await request('/api/auth/login', {
        method: 'POST',
        auth: false,
        body: { staffId, password },
      });
      const newToken = payload.token || '';
      const newStaff = payload.staff || null;
      setToken(newToken);
      setStaff(newStaff);
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
      localStorage.setItem(AUTH_STAFF_KEY, JSON.stringify(newStaff || {}));
      return newStaff;
    },
    [request]
  );

  const sendSignupCode = useCallback(
    async (staffId, email) => {
      return request('/api/auth/signup/send-code', {
        method: 'POST',
        auth: false,
        body: { staffId, email },
      });
    },
    [request]
  );

  const verifySignupCode = useCallback(
    async (staffId, email, code) => {
      return request('/api/auth/signup/verify', {
        method: 'POST',
        auth: false,
        body: { staffId, email, code },
      });
    },
    [request]
  );

  const signup = useCallback(
    async (staffId, email) => sendSignupCode(staffId, email),
    [sendSignupCode]
  );

  const logout = useCallback(() => {
    setToken('');
    setStaff(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_STAFF_KEY);
  }, []);

  const fetchCourses = useCallback(async () => {
    const data = await request('/api/courses');
    return data.courses || [];
  }, [request]);

  const fetchCourse = useCallback(
    async (courseCode) => {
      const normalized = String(courseCode || 'SOP').trim().toUpperCase();
      return request(`/api/courses/${normalized}`);
    },
    [request]
  );

  const fetchModule = useCallback(
    async (moduleKey) => {
      return request(`/api/modules/${moduleKey}`);
    },
    [request]
  );

  const submitModuleQuiz = useCallback(
    async (moduleKey, answers) => {
      return request(`/api/modules/${moduleKey}/submit`, {
        method: 'POST',
        body: { answers },
      });
    },
    [request]
  );

  const getAttempts = useCallback(async () => {
    const data = await request('/api/me/attempts');
    return data.attempts || [];
  }, [request]);

  const getProgress = useCallback(async () => {
    try {
      const data = await request('/api/me/progress');
      return data.progress || [];
    } catch {
      return [];
    }
  }, [request]);

  const sendCourseCertificate = useCallback(
    async (courseCode) => {
      await request('/api/me/send-course-certificate', {
        method: 'POST',
        body: { courseCode },
      });
    },
    [request]
  );

  const saveAttempt = useCallback(async (attempt) => {
    // Attempts are stored server-side on quiz submit; kept for parity with the mobile app.
    return attempt;
  }, []);

  const value = useMemo(
    () => ({
      token,
      staff,
      isLoading,
      apiBaseUrl: API_BASE_URL,
      isAuthenticated: Boolean(token),
      login,
      signup,
      sendSignupCode,
      verifySignupCode,
      logout,
      fetchCourses,
      fetchCourse,
      fetchModule,
      submitModuleQuiz,
      getAttempts,
      getProgress,
      sendCourseCertificate,
      saveAttempt,
    }),
    [
      token,
      staff,
      isLoading,
      login,
      signup,
      sendSignupCode,
      verifySignupCode,
      logout,
      fetchCourses,
      fetchCourse,
      fetchModule,
      submitModuleQuiz,
      getAttempts,
      getProgress,
      sendCourseCertificate,
      saveAttempt,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
