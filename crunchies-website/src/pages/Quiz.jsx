import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../constants/colors';
import PrimaryButton from '../components/PrimaryButton';

const DEFAULT_QUIZ_MINUTES = 25;

export default function Quiz() {
  const { courseCode, subjectKey, moduleKey } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { submitModuleQuiz } = useAuth();

  const {
    user,
    course,
    topic,
    module,
    moduleIndex,
    totalModules,
    quiz,
  } = location.state || {};

  const timeLimitMinutes = Number(quiz?.timeLimitMinutes) || DEFAULT_QUIZ_MINUTES;
  const quizDurationSeconds = Math.max(1, timeLimitMinutes) * 60;

  const finalQuestions = (quiz?.questions || []).map((q) => ({
    id: q.id,
    questionNo: q.questionNo,
    q: q.question,
    options: q.options || [],
  }));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(quizDurationSeconds);
  const submittedRef = useRef(false);

  const submitQuiz = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    try {
      setSubmitting(true);
      const orderedAnswers = finalQuestions.map((q) =>
        answers[q.id] === undefined ? -1 : Number(answers[q.id])
      );
      const result = await submitModuleQuiz(module?.key, orderedAnswers);
      navigate('/app/quiz-result', {
        replace: true,
        state: {
          user,
          course,
          topic,
          module,
          moduleIndex,
          totalModules,
          score: result?.result?.scorePercent || 0,
          totalQuestions: result?.result?.totalQuestions || finalQuestions.length,
          correct: result?.result?.correctAnswers || 0,
          grade: result?.result?.passed ? 'PASS' : 'FAIL',
          status: result?.result?.status || 'failed',
          passed: Boolean(result?.result?.passed),
          attemptsUsed: result?.result?.attemptsUsed || 0,
          attemptsLeft: result?.result?.attemptsLeft ?? 0,
          message:
            result?.message ||
            (result?.result?.passed ? '' : 'Time was up. Your answers were submitted.'),
        },
      });
    } catch (error) {
      submittedRef.current = false;
      setApiError(error.message || 'Unable to submit quiz');
    } finally {
      setSubmitting(false);
    }
  }, [answers, finalQuestions, submitModuleQuiz, navigate, user, course, topic, module, moduleIndex, totalModules]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0 && !submitting && !submittedRef.current) {
      submitQuiz();
    }
  }, [secondsLeft, submitting, submitQuiz]);

  if (!module || !quiz || !location.state) {
    return (
      <div className="screen-pad page-center">
        <p className="muted">Open the quiz from a module.</p>
        <button
          type="button"
          className="link-btn"
          onClick={() => navigate(`/app/c/${courseCode}/subjects/${subjectKey}/modules/${moduleKey}`)}
        >
          Go to module
        </button>
      </div>
    );
  }

  const question = finalQuestions[currentIndex];
  const totalQuestions = finalQuestions.length;
  const progress = totalQuestions ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!question || totalQuestions === 0) {
    return (
      <div className="page-center" style={{ minHeight: '100dvh' }}>
        <div className="spinner" />
        <p className="muted">No quiz available.</p>
      </div>
    );
  }

  const selectedAnswer = answers[question.id];

  return (
    <div className="screen-page">
      <button
        type="button"
        className="back-link"
        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 24 }}
        onClick={() => navigate(-1)}
      >
        ←
      </button>
      <div className="screen-pad quiz-header">
        <div className="quiz-header-row">
          <h1 className="quiz-title">Module Quiz</h1>
          <div
            className="timer-badge"
            style={{ background: secondsLeft <= 60 ? colors.error : colors.primary }}
          >
            ⏱ {formatTime(secondsLeft)}
          </div>
        </div>
        <p className="quiz-sub">
          Question {currentIndex + 1} of {totalQuestions}
        </p>
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="screen-pad quiz-body">
        <div className="question-card">
          <p className="question-text">{question.q}</p>
        </div>
        <div className="options-list">
          {question.options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              className={`option-row ${selectedAnswer === idx ? 'selected' : ''}`}
              onClick={() => {
                if (submitting) return;
                setApiError('');
                setAnswers({ ...answers, [question.id]: idx });
              }}
            >
              <span className={`option-dot ${selectedAnswer === idx ? 'on' : ''}`}>
                {selectedAnswer === idx ? '✓' : ''}
              </span>
              <span className="option-label">{opt}</span>
            </button>
          ))}
        </div>
        <div className="quiz-nav">
          <button
            type="button"
            className="nav-prev"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          >
            ‹ Previous
          </button>
          <PrimaryButton
            title={
              submitting && currentIndex === totalQuestions - 1
                ? ''
                : currentIndex < totalQuestions - 1
                  ? 'Next'
                  : 'Submit'
            }
            onClick={() => {
              if (currentIndex < totalQuestions - 1) {
                setCurrentIndex(currentIndex + 1);
              } else {
                submitQuiz();
              }
            }}
            disabled={selectedAnswer === undefined}
            loading={submitting && currentIndex === totalQuestions - 1}
            style={{ flex: 1, marginBottom: 0 }}
          />
        </div>
        {apiError ? <p className="quiz-api-error">{apiError}</p> : null}
      </div>
    </div>
  );
}
