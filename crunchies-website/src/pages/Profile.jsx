import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { capitalizeWords } from '../utils/format';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';

export default function Profile() {
  const { logout, staff, fetchCourses, fetchCourse } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const paramUser = location.state?.user;
  const currentCourse = location.state?.course;

  const user = paramUser || staff || {};
  const staffId = user?.staffId || staff?.staffId || '';

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingCourses(true);
      try {
        const list = await fetchCourses();
        if (active) setCourses(list || []);
      } catch {
        if (active) setCourses([]);
      } finally {
        if (active) setLoadingCourses(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchCourses]);

  const openCourseModal = (course) => {
    setSelectedCourse(course);
    setCodeInput(course?.code ? String(course.code).toUpperCase() : '');
    setCodeError('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedCourse(null);
    setCodeInput('');
    setCodeError('');
  };

  const handleStartCourse = async () => {
    const code = String(codeInput || '').trim().toUpperCase();
    if (!code) {
      setCodeError('Enter the course code.');
      return;
    }
    const allowed = courses.some((c) => (c.code || '').toUpperCase() === code);
    if (!allowed) {
      setCodeError('That code is not in your assigned courses.');
      return;
    }
    setCodeError('');
    setSubmitting(true);
    try {
      const fullCourse = await fetchCourse(code);
      closeModal();
      navigate(`/app/c/${fullCourse.code}/topics`, {
        replace: true,
        state: { user, course: fullCourse },
      });
    } catch (e) {
      setCodeError(e.message || 'Could not load course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const goBack = () => {
    if (currentCourse) {
      navigate(`/app/c/${currentCourse.code}/topics`, { state: { user, course: currentCourse } });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="screen-page">
      <header className="profile-header">
        <button type="button" className="icon-btn" onClick={goBack} aria-label="Back">
          ←
        </button>
        <h1 className="profile-header-title">Profile</h1>
        <button type="button" className="icon-btn" onClick={handleLogout} aria-label="Log out">
          ⎋
        </button>
      </header>
      <div className="screen-pad profile-scroll">
        <div className="profile-card">
          <div className="profile-avatar">
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="profile-name">{capitalizeWords(user?.fullName || user?.name || 'Staff')}</div>
          {user?.email ? <div className="profile-email">{user.email}</div> : null}
          <div className="profile-staff-row">
            <span className="muted">Staff ID</span>
            <span className="profile-staff-id">{staffId || '—'}</span>
          </div>
        </div>
        <h2 className="section-heading-profile">Assigned courses</h2>
        {loadingCourses ? (
          <div className="loading-inline">
            <div className="spinner small" />
            <span className="muted">Loading courses…</span>
          </div>
        ) : courses.length === 0 ? (
          <p className="muted">No assigned courses yet.</p>
        ) : (
          courses.map((course) => (
            <button
              key={course.code}
              type="button"
              className="profile-course-row"
              onClick={() => openCourseModal(course)}
            >
              <div className="course-row-icon">📖</div>
              <div className="profile-course-info">
                <div className="profile-course-name">{capitalizeWords(course.name || course.code)}</div>
                <div className="profile-course-code">Code: {course.code || '—'}</div>
              </div>
              <span className="chevron">›</span>
            </button>
          ))
        )}
      </div>

      {modalVisible && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-box">
            <h3 className="modal-title">
              {selectedCourse ? `Start: ${selectedCourse.name || selectedCourse.code}` : 'Start this course'}
            </h3>
            <p className="modal-sub">Enter the course code to switch to this course.</p>
            <InputField
              label=""
              value={codeInput}
              onChange={setCodeInput}
              placeholder="Course code"
              disabled={submitting}
            />
            {codeError ? <p className="modal-error">{codeError}</p> : null}
            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={closeModal}>
                Cancel
              </button>
              <div style={{ width: 170 }}>
                <PrimaryButton
                  title="Start course"
                  onClick={handleStartCourse}
                  loading={submitting}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
