import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LogoutButton from '../components/LogoutButton';
import { capitalizeWords } from '../utils/format';
import { colors } from '../constants/colors';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';

export default function Courses() {
  const { fetchCourses, fetchCourse, logout, staff } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justCompletedCourseCode = searchParams.get('certified');

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState('');
  const [codeInput, setCodeInput] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setError('');
      try {
        const list = await fetchCourses();
        if (!active) return;
        setCourses(list || []);
        if (list && list.length > 0 && !justCompletedCourseCode) {
          const first = list[0];
          try {
            const fullCourse = await fetchCourse(first.code);
            if (active) {
              navigate(`/app/c/${fullCourse.code}/topics`, {
                replace: true,
                state: { user: staff, course: fullCourse },
              });
            }
            return;
          } catch {
            if (active) setLoading(false);
            return;
          }
        }
      } catch (e) {
        if (active) setError(e.message || 'Failed to load courses');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [fetchCourses, fetchCourse, navigate, staff, justCompletedCourseCode]);

  const handleSelectCourse = async (course) => {
    setError('');
    setSelecting(true);
    try {
      const fullCourse = await fetchCourse(course.code);
      navigate(`/app/c/${fullCourse.code}/topics`, {
        replace: true,
        state: { user: staff, course: fullCourse },
      });
    } catch (e) {
      setError(e.message || 'Failed to open course');
    } finally {
      setSelecting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleGoWithCode = async () => {
    const code = String(codeInput || '').trim().toUpperCase();
    if (!code) {
      setError('Enter a course code.');
      return;
    }
    setError('');
    const matched = courses.find((c) => (c.code || '').toUpperCase() === code);
    if (!matched) {
      setError('No assigned course with that code. Check the code or choose from the list.');
      return;
    }
    await handleSelectCourse(matched);
  };

  if (loading) {
    return (
      <div className="screen-page">
        <button type="button" className="logout-corner" onClick={handleLogout} aria-label="Log out">
          ⎋
        </button>
        <div className="page-center">
          <div className="spinner" />
          <p className="muted">Loading courses…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-page">
      <LogoutButton onClick={handleLogout} />
      <div className="screen-pad courses-header">
        <div className="courses-icon-circle">🎓</div>
        <h1 className="courses-title">Your assigned courses</h1>
        <p className="courses-subtitle">Your assigned courses.</p>
      </div>
      {error ? (
        <div className="error-banner" style={{ margin: '0 6% 12px' }}>
          {error}
        </div>
      ) : null}
      <div className="screen-pad" style={{ flex: 1, overflow: 'auto' }}>
        {courses.length === 0 ? (
          <p className="muted" style={{ textAlign: 'center' }}>
            No courses available yet.
          </p>
        ) : (
          <>
            <p className="list-hint">Your assigned courses.</p>
            {courses.map((course) => {
              const isCertified =
                justCompletedCourseCode && (course.code || '') === (justCompletedCourseCode || '');
              return (
                <button
                  key={course.code}
                  type="button"
                  className={`course-card ${isCertified ? 'course-card-certified' : ''}`}
                  onClick={() => handleSelectCourse(course)}
                  disabled={selecting}
                >
                  <div className="course-card-icon">📖</div>
                  <div className="course-card-info">
                    <div className="course-name-row">
                      <span className="course-name">
                        {capitalizeWords(course.name || course.code)}
                      </span>
                      {isCertified ? (
                        <img src="/certified.png" alt="Certified" className="certified-badge" />
                      ) : null}
                    </div>
                    <span className="course-meta">
                      {course.subjectCount != null
                        ? `${course.subjectCount} subject${course.subjectCount !== 1 ? 's' : ''}`
                        : '—'}
                    </span>
                  </div>
                  <span className="chevron">›</span>
                </button>
              );
            })}
          </>
        )}
        <div className="code-section">
          <InputField
            label=""
            value={codeInput}
            onChange={(value) => {
              setCodeInput(value);
              setError('');
            }}
            placeholder="Enter course code"
            autoCapitalize="characters"
            disabled={selecting}
          />
          <PrimaryButton
            title="Start course"
            onClick={handleGoWithCode}
            loading={selecting}
            style={{ marginTop: 12 }}
          />
          {error ? (
            <p style={{ color: colors.error, textAlign: 'center', marginTop: 12 }}>{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
