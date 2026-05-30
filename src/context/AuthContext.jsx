import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

function isSessionInvalidResponse(status, message) {
  const msg = String(message || '').toLowerCase();
  if (status === 401) return true;
  if (msg.includes('staff not found')) return true;
  if (msg.includes('invalid token')) return true;
  if (status === 403 && msg.includes('staff')) return true;
  return false;
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [staff, setStaff] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setToken('');
    setStaff(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_STAFF_KEY);
  }, []);

  const endSessionAndRedirectToWelcome = useCallback(
    (message) => {
      clearSession();
      navigate('/', {
        replace: true,
        state: {
          accountRemoved: true,
          message:
            message ||
            'This training account is no longer available. Contact your admin, then sign up or log in again.',
        },
      });
    },
    [clearSession, navigate]
  );

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    setStaff(readStoredStaff());

    let cancelled = false;

    async function validateStoredSession() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/courses`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            'Content-Type': 'application/json',
          },
        });
        let payload = {};
        try {
          payload = await response.json();
        } catch {
          payload = {};
        }
        if (!response.ok) {
          const message = payload.message || payload.error || '';
          if (isSessionInvalidResponse(response.status, message)) {
            clearSession();
            navigate('/', {
              replace: true,
              state: {
                accountRemoved: true,
                message:
                  message ||
                  'This training account is no longer available. Contact your admin, then sign up or log in again.',
              },
            });
          }
        }
      } catch {
        /* Network error: keep session; protected pages may retry */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    validateStoredSession();
    return () => {
      cancelled = true;
    };
  }, [clearSession, navigate]);

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
        if (auth && isSessionInvalidResponse(response.status, message)) {
          endSessionAndRedirectToWelcome(message);
          const err = new Error(message);
          err.sessionInvalid = true;
          throw err;
        }
        throw new Error(message);
      }
      return payload;
    },
    [token, endSessionAndRedirectToWelcome]
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
    clearSession();
  }, [clearSession]);

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
