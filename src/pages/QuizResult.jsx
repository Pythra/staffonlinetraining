import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../constants/colors';
import PrimaryButton from '../components/PrimaryButton';

export default function QuizResult() {
  const { saveAttempt } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;
  const savedRef = useRef(false);

  const {
    user,
    course,
    topic,
    module,
    score,
    totalQuestions,
    correct,
    grade,
    passed,
    status,
    attemptsUsed,
    attemptsLeft,
    message,
  } = state || {};

  useEffect(() => {
    if (savedRef.current || !module?.key) return;
    savedRef.current = true;
    saveAttempt({
      moduleKey: module.key,
      moduleName: module.name || module.key,
      topicKey: topic?.key,
      topicName: topic?.name || topic?.key || 'Subject',
      courseCode: course?.code,
      courseName: course?.name || course?.code || 'Course',
      score: Number(score) || 0,
      passed: Boolean(passed),
      correct: Number(correct) || 0,
      totalQuestions: Number(totalQuestions) || 0,
      completedAt: new Date().toISOString(),
    });
  }, [
    module?.key,
    module?.name,
    topic?.key,
    topic?.name,
    course?.code,
    course?.name,
    score,
    passed,
    correct,
    totalQuestions,
    saveAttempt,
  ]);

  const gradeLabel = String(grade || (passed ? 'PASS' : 'FAIL')).toUpperCase();
  const gradeFontSize = useMemo(() => {
    if (gradeLabel.length >= 6) return 20;
    if (gradeLabel.length >= 5) return 24;
    return 30;
  }, [gradeLabel]);

  const getMessage = () => {
    if (message) return message;
    return passed
      ? "Excellent work! You've passed this module."
      : 'Please review the module and try again.';
  };

  const handleFinish = () => {
    navigate(`/app/c/${course.code}/topics`, {
      replace: true,
      state: { user, course },
    });
  };

  if (!state || !course?.code) {
    return <Navigate to="/app/courses" replace />;
  }

  return (
    <div className="screen-page">
      <div className="screen-pad quiz-result-inner">
        <div
          className="grade-circle"
          style={{
            background: passed
              ? `linear-gradient(135deg, ${colors.accentGreen}, #70D29E)`
              : `linear-gradient(135deg, ${colors.primary}, #F16262)`,
          }}
        >
          <span style={{ fontSize: gradeFontSize, fontWeight: 800, color: '#fff' }}>
            {gradeLabel}
          </span>
        </div>
        <h1 className="result-title">{passed ? 'Congratulations!' : 'Quiz Complete'}</h1>
        <p className="result-sub">{getMessage()}</p>
        <div className="score-card">
          <div className="score-row">
            <span className="score-label">Score</span>
            <span
              className="score-value"
              style={{ color: passed ? colors.success : colors.error }}
            >
              {score}%
            </span>
          </div>
          <div className="score-row">
            <span className="score-label">Correct Answers</span>
            <span className="score-value">
              {correct} / {totalQuestions}
            </span>
          </div>
          <p className="result-badge">Status: {status || (passed ? 'passed' : 'failed')}</p>
          <p className="result-badge">
            Attempts used: {attemptsUsed || 0} • Attempts left: {attemptsLeft ?? 0}
          </p>
        </div>
        <PrimaryButton title="Back to Topics" onClick={handleFinish} />
      </div>
    </div>
  );
}
