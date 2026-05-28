import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../constants/colors';
import { capitalizeWords, formatTimeAgo, getScoreLabel } from '../utils/format';
import PrimaryButton from '../components/PrimaryButton';
import LogoutButton from '../components/LogoutButton';

const TABS = [
  { key: 'courses', label: 'My courses' },
  { key: 'tests', label: 'Tests' },
];

const PASS_CARD_BG = '#E8F5E9';
const FAIL_CARD_BG = '#FFEBEE';

export default function Topics() {
  const { courseCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logout, staff, getAttempts, fetchCourse, sendCourseCertificate } = useAuth();

  const user = location.state?.user || staff || {};
  const staffId = user?.staffId || staff?.staffId || 'STAFF';
  const userWithStaffId = { ...user, staffId };

  const [course, setCourse] = useState(null);
  const [courseError, setCourseError] = useState('');
  const [courseLoading, setCourseLoading] = useState(true);

  const activeTab = searchParams.get('tab') === 'tests' ? 'tests' : 'courses';
  const [attempts, setAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [attemptsError, setAttemptsError] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(null);
  const [certificateEmailSent, setCertificateEmailSent] = useState(false);

  const topics = useMemo(() => course?.subjects || [], [course]);

  useEffect(() => {
    let active = true;
    const seeded =
      location.state?.course &&
      String(location.state.course.code).toUpperCase() === String(courseCode).toUpperCase();
    if (seeded) {
      setCourse(location.state.course);
      setCourseLoading(false);
    }
    (async () => {
      if (!seeded) setCourseLoading(true);
      setCourseError('');
      try {
        const c = await fetchCourse(courseCode);
        if (active) setCourse(c);
      } catch (e) {
        if (active) {
          setCourseError(e.message || 'Failed to load course');
          if (!seeded) setCourse(null);
        }
      } finally {
        if (active) setCourseLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [courseCode, fetchCourse, location.state?.course]);

  const loadAttempts = useCallback(async () => {
    setLoadingAttempts(true);
    setAttemptsError('');
    try {
      const list = await getAttempts();
      setAttempts(list || []);
    } catch (e) {
      setAttempts([]);
      setAttemptsError(e.message || 'Failed to load your tests');
    } finally {
      setLoadingAttempts(false);
    }
  }, [getAttempts]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts, courseCode]);

  useEffect(() => {
    if (activeTab === 'tests') {
      loadAttempts();
    }
  }, [activeTab, loadAttempts]);

  const handleTabChange = (tab) => {
    if (tab === 'tests') {
      setSearchParams({ tab: 'tests' }, { replace: true });
      loadAttempts();
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  useEffect(() => {
    setCertificateEmailSent(false);
  }, [course?.code]);

  const courseModuleKeysSet = useMemo(
    () => new Set(topics.flatMap((t) => (t.modules || []).map((m) => m.key))),
    [topics]
  );

  const totalModulesInCourse = useMemo(
    () => topics.reduce((sum, t) => sum + (t.modules?.length || 0), 0),
    [topics]
  );

  const modulesPassedCount = useMemo(() => {
    return new Set(
      attempts.filter((a) => a.passed && courseModuleKeysSet.has(a.moduleKey)).map((a) => a.moduleKey)
    ).size;
  }, [attempts, courseModuleKeysSet]);

  const isTopicComplete = useCallback(
    (topic) => {
      const modules = topic?.modules || [];
      if (!modules.length) return false;
      return modules.every((m) => attempts.some((a) => a.moduleKey === m.key && a.passed));
    },
    [attempts]
  );

  const completedSubjects = useMemo(() => {
    const out = [];
    topics.forEach((topic) => {
      if (!isTopicComplete(topic)) return;
      const topicAttempts = attempts.filter((a) => a.topicKey === topic.key && a.passed);
      const lastCompleted = topicAttempts.length
        ? topicAttempts.reduce(
            (max, a) => Math.max(max, new Date(a.completedAt || 0).getTime()),
            0
          )
        : Date.now();
      out.push({
        topic,
        course,
        completedAt: new Date(lastCompleted).toISOString(),
      });
    });
    return out.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  }, [topics, attempts, course, isTopicComplete]);

  const sortedAttempts = useMemo(
    () =>
      [...attempts].sort(
        (a, b) =>
          new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
      ),
    [attempts]
  );

  const courseAttempts = useMemo(() => {
    const code = String(courseCode || '').toUpperCase();
    return sortedAttempts.filter(
      (a) => String(a.courseCode || '').toUpperCase() === code
    );
  }, [sortedAttempts, courseCode]);

  const allCourseSubjectsComplete =
    topics.length > 0 && topics.every((t) => isTopicComplete(t));

  const testsTabBadgeCount = completedSubjects.length;
  const progressFraction =
    totalModulesInCourse > 0 ? modulesPassedCount / totalModulesInCourse : 0;

  const handleTopicPress = (topic) => {
    navigate(`/app/c/${course.code}/subjects/${topic.key}/modules`, {
      state: { user: userWithStaffId, course, topic },
    });
  };

  const handleStartNextCourse = () => {
    navigate(`/app/courses?certified=${encodeURIComponent(course?.code || '')}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleSendCertificateEmail = async () => {
    const code = course?.code;
    if (!code) return;
    setDownloadingPdf('course');
    try {
      await sendCourseCertificate(code);
      setCertificateEmailSent(true);
    } catch (e) {
      alert(e.message || 'Could not send certificate email.');
    } finally {
      setDownloadingPdf(null);
    }
  };

  if (courseLoading && !course) {
    return (
      <div className="page-center" style={{ minHeight: '100dvh' }}>
        <div className="spinner" />
        <p className="muted">Loading course…</p>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="screen-pad page-center" style={{ minHeight: '100dvh' }}>
        <p style={{ color: colors.error }}>{courseError || 'Course not found.'}</p>
        <Link to="/app/courses">Back to courses</Link>
      </div>
    );
  }

  return (
    <div className="topics-page">
      <div className="topics-header-red">
        <div className="topics-header-row">
          <div className="topics-user">
            <div className="topics-avatar">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="topics-user-text">
              <div className="topics-user-name">
                {capitalizeWords(user?.fullName || user?.name || 'Staff')}
              </div>
              <div className="topics-staff-id">ID: {staffId}</div>
            </div>
          </div>
          <div className="topics-header-actions">
            <Link
              to="/app/profile"
              state={{ user: userWithStaffId, course }}
              className="topics-icon-btn"
              aria-label="Profile"
            >
              👤
            </Link>
            <LogoutButton onClick={handleLogout} className="topics-icon-btn" />
          </div>
        </div>
        <div className="topics-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`topics-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
              {tab.key === 'tests' && testsTabBadgeCount > 0 ? (
                <span className="topics-tab-badge">
                  {testsTabBadgeCount > 99 ? '99+' : testsTabBadgeCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="topics-course-strip">
        {activeTab === 'tests' ? (
          <>
            <div className="topics-course-name">
              {modulesPassedCount} out of {totalModulesInCourse} modules passed
            </div>
            <p className="topics-section-sub">Your attempts and subject completions</p>
          </>
        ) : (
          <div className="topics-course-row">
            <div>
              <div className="topics-course-name">{capitalizeWords(course?.name || 'Course')}</div>
              <div className="topics-course-code">Code: {course?.code || '—'}</div>
            </div>
            <div className="topics-progress-wrap">
              {allCourseSubjectsComplete ? (
                <img src="/certified.png" alt="Certified" width={56} height={56} />
              ) : (
                <div className="progress-circle">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`progress-quad q${i} ${progressFraction * 4 > i ? 'filled' : ''}`}
                    />
                  ))}
                  <div className="progress-circle-inner">
                    <span className="progress-circle-text">
                      {modulesPassedCount}/{totalModulesInCourse}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {activeTab === 'courses' && (
        <div className="topics-scroll">
          {topics.map((topic, index) => {
            const completed = isTopicComplete(topic);
            return (
              <button
                key={topic.key}
                type="button"
                className={`topic-card ${completed ? 'completed' : ''}`}
                onClick={() => handleTopicPress(topic)}
              >
                <div className="topic-index">{index + 1}</div>
                <div className="topic-info">
                  <div className="topic-name">{topic.name}</div>
                  <div className="topic-meta">
                    {topic.modules?.length || 0} module{(topic.modules?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
                {completed ? <span className="completed-pill">Completed</span> : <span className="chevron">›</span>}
              </button>
            );
          })}
          {allCourseSubjectsComplete && (
            <>
              <button
                type="button"
                className={`cert-email-btn ${certificateEmailSent ? 'sent' : ''}`}
                onClick={handleSendCertificateEmail}
                disabled={downloadingPdf === 'course' || certificateEmailSent}
              >
                {downloadingPdf === 'course'
                  ? '…'
                  : certificateEmailSent
                    ? '✉ Email sent'
                    : '📄 Download Certificate'}
              </button>
              <button type="button" className="next-course-btn" onClick={handleStartNextCourse}>
                ⭐ Start next course
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === 'tests' && (
        <div className="topics-scroll">
          {loadingAttempts ? (
            <div className="page-center" style={{ padding: 48 }}>
              <div className="spinner" />
              <p className="muted">Loading your tests…</p>
            </div>
          ) : attemptsError ? (
            <div className="tests-error-box">
              <p style={{ color: colors.error, margin: '0 0 12px' }}>{attemptsError}</p>
              <PrimaryButton title="Retry" onClick={loadAttempts} style={{ maxWidth: 160 }} />
            </div>
          ) : (
            <>
              {completedSubjects.length > 0 && (
                <div className="tests-section">
                  <h3 className="tests-section-title">Subject completions</h3>
                  {completedSubjects.map((item) => (
                    <div key={item.topic.key} className="certificate-card">
                      <div className="certificate-header">
                        <div className="certificate-seal">🏅</div>
                        <div className="certificate-label">Subject completed</div>
                      </div>
                      <div className="certificate-subject">{item.topic.name}</div>
                      <div className="certificate-course">
                        {item.course?.name || item.course?.code} · {item.course?.code || '—'}
                      </div>
                      <div className="certificate-date">
                        {new Date(item.completedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="tests-section">
                <h3 className="tests-section-title">Module tests</h3>
                {courseAttempts.length === 0 && completedSubjects.length === 0 ? (
                  <p className="muted empty-tests">
                    No test attempts yet for this course. Complete module quizzes to see them here.
                  </p>
                ) : (
                  courseAttempts.map((a, idx) => (
                    <div
                      key={a.id || `${a.moduleKey}_${idx}`}
                      className="attempt-card"
                      style={{ backgroundColor: a.passed ? PASS_CARD_BG : FAIL_CARD_BG }}
                    >
                      <div className="attempt-card-top">
                        <div
                          className="attempt-icon"
                          style={{
                            backgroundColor: a.passed ? 'rgba(15,169,88,0.2)' : 'rgba(255,68,68,0.2)',
                          }}
                        >
                          {a.passed ? '✓' : '✗'}
                        </div>
                        <span className="attempt-ago">{formatTimeAgo(a.completedAt)}</span>
                      </div>
                      <div className="attempt-module">{a.moduleName || a.moduleKey}</div>
                      <div className="attempt-meta">
                        {a.topicName} · {a.courseName || a.courseCode}
                      </div>
                      <div className="attempt-score-row">
                        <span
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: a.passed ? colors.success : colors.error,
                          }}
                        >
                          {a.score}% · {getScoreLabel(a.score, a.passed)}
                        </span>
                        <span className="muted">
                          {a.correct} / {a.totalQuestions} correct
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
