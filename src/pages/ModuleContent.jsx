import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../constants/colors';
import { looksLikeHtml, resolveModuleHtmlForDisplay } from '../utils/html';
import PrimaryButton from '../components/PrimaryButton';

export default function ModuleContent() {
  const { courseCode, subjectKey, moduleKey } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchModule, fetchCourse } = useAuth();

  const {
    user,
    course: stateCourse,
    topic: stateTopic,
    module: routeModule,
    moduleIndex: stateModuleIndex,
    totalModules: stateTotalModules,
    scrollToSectionIndex = null,
  } = location.state || {};

  const [course, setCourse] = useState(stateCourse || null);
  const [topic, setTopic] = useState(stateTopic || null);
  const [moduleIndex, setModuleIndex] = useState(stateModuleIndex ?? 0);
  const [totalModules, setTotalModules] = useState(stateTotalModules ?? 1);

  useEffect(() => {
    if (course && topic && topic.modules?.some((m) => m.key === moduleKey)) {
      const idx = topic.modules.findIndex((m) => m.key === moduleKey);
      if (idx >= 0) {
        setModuleIndex(idx);
        setTotalModules(topic.modules.length);
      }
      return;
    }
    let active = true;
    (async () => {
      try {
        const c = await fetchCourse(courseCode);
        const t = c.subjects?.find((s) => s.key === subjectKey);
        const mods = t?.modules || [];
        const idx = mods.findIndex((m) => m.key === moduleKey);
        if (!active) return;
        setCourse(c);
        setTopic(t || null);
        if (idx >= 0) {
          setModuleIndex(idx);
          setTotalModules(mods.length);
        }
      } catch {
        /* handled by module fetch */
      }
    })();
    return () => {
      active = false;
    };
  }, [courseCode, subjectKey, moduleKey, fetchCourse, course, topic]);

  const currentModule =
    topic?.modules?.[moduleIndex]?.key === moduleKey
      ? topic.modules[moduleIndex]
      : routeModule || { key: moduleKey, title: moduleKey };
  const scrollRef = useRef(null);
  const sectionRefs = useRef([]);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [modulePayload, setModulePayload] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setApiError('');
        setLoading(true);
        const payload = await fetchModule(currentModule?.key);
        if (active) setModulePayload(payload);
      } catch (error) {
        if (active) setApiError(error.message || 'Failed to load module');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentModule?.key, fetchModule]);

  useEffect(() => {
    if (scrollToSectionIndex === undefined || scrollToSectionIndex === null) return;
    const el = sectionRefs.current[scrollToSectionIndex + 1];
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [scrollToSectionIndex, modulePayload]);

  const progress = modulePayload?.progress || {};
  const maxFailAttempts = modulePayload?.quiz?.maxFailAttempts ?? 3;
  const failStreak = progress.fail_streak ?? progress.failStreak ?? 0;
  const hasPassed = progress.status === 'passed' || !!progress.passed_at;
  const isModuleLocked =
    !hasPassed && (progress.status === 'locked' || failStreak >= maxFailAttempts);

  const isLastModule = moduleIndex === totalModules - 1;

  const handleTakeTest = () => {
    if (isModuleLocked) return;
    navigate(
      `/app/c/${courseCode}/subjects/${subjectKey}/modules/${currentModule.key}/quiz`,
      {
        state: {
          user,
          course,
          topic,
          module: modulePayload?.module || currentModule,
          quiz: modulePayload?.quiz || { questions: [] },
          progress: modulePayload?.progress || {},
          moduleIndex,
          totalModules,
        },
      }
    );
  };

  const handleSkip = () => {
    const mods = topic?.modules || [];
    const nextIndex = moduleIndex + 1;
    if (nextIndex >= mods.length) {
      alert('This is the last module in the subject. Use Take Test or go back.');
      return;
    }
    const nextModule = mods[nextIndex];
    navigate(
      `/app/c/${courseCode}/subjects/${subjectKey}/modules/${nextModule.key}`,
      {
        replace: true,
        state: {
          user,
          course,
          topic,
          module: nextModule,
          moduleIndex: nextIndex,
          totalModules: mods.length,
        },
      }
    );
  };

  if (loading) {
    return (
      <div className="page-center" style={{ minHeight: '100dvh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="screen-pad page-center" style={{ minHeight: '100dvh' }}>
        <p style={{ color: colors.error }}>{apiError}</p>
        <button type="button" className="link-btn" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  const moduleData = modulePayload?.module;
  const sections = moduleData?.sections || [];
  const bodyContent = moduleData?.body ?? '';
  const isHtmlBody = looksLikeHtml(bodyContent);
  const moduleHtml = isHtmlBody ? resolveModuleHtmlForDisplay(bodyContent) : '';

  return (
    <div className="screen-page">
      <button
        type="button"
        className="back-link"
        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 24 }}
        onClick={() =>
          navigate(`/app/c/${courseCode}/subjects/${subjectKey}/modules`, {
            state: { user, course, topic },
          })
        }
      >
        ←
      </button>
      <div className="screen-pad module-content-header">
        <h1 className="module-content-title">{moduleData?.title || currentModule?.title || 'Module'}</h1>
        <p className="module-content-meta">
          Module {moduleIndex + 1} of {totalModules}
        </p>
        <div className="module-stepper">
          {Array.from({ length: totalModules }, (_, i) => (
            <div key={i} className="module-step-row">
              <div className={`module-step-circle ${i <= moduleIndex ? 'filled' : ''}`}>
                {i + 1}
              </div>
              {i < totalModules - 1 ? (
                <div className={`module-step-line ${i < moduleIndex ? 'filled' : ''}`} />
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="screen-pad module-content-body" ref={scrollRef}>
        <div
          className={`content-card${isHtmlBody ? ' module-html-content' : ''}`}
          ref={(el) => {
            sectionRefs.current[0] = el;
          }}
        >
          {isHtmlBody ? (
            moduleHtml ? (
              <div dangerouslySetInnerHTML={{ __html: moduleHtml }} />
            ) : (
              <p className="content-text">No content available for this module yet.</p>
            )
          ) : (
            <p className="content-text">
              {bodyContent || 'No content available for this module yet.'}
            </p>
          )}
        </div>
        {!isHtmlBody &&
          sections.map((section, index) => (
            <div
              key={`${section.heading}-${index}`}
              className="section-card"
              ref={(el) => {
                sectionRefs.current[index + 1] = el;
              }}
            >
              <h2 className="section-heading">{section.heading}</h2>
              <p className="content-text">{section.text}</p>
            </div>
          ))}
        <div className="quiz-meta-card">
          <div className="quiz-meta-title">
            Quiz: {modulePayload?.quiz?.questions?.length || 0} questions
          </div>
          <div className="quiz-meta-sub">
            Pass mark: {modulePayload?.quiz?.passMarkPercent || 70}% • Max fails:{' '}
            {modulePayload?.quiz?.maxFailAttempts || 3}
          </div>
        </div>
        {isModuleLocked && (
          <div className="locked-banner">
            <span>🔒</span>
            <p>
              You&apos;ve used all {maxFailAttempts} attempts. This module is locked. Contact HR to
              reset your attempts.
            </p>
          </div>
        )}
        <PrimaryButton
          title={isModuleLocked ? 'Locked' : 'Take Test'}
          onClick={handleTakeTest}
          disabled={isModuleLocked}
          style={{
            background: isModuleLocked ? '#999' : colors.primary,
            marginBottom: 12,
          }}
        />
        {!isLastModule && (
          <PrimaryButton title="Skip to Next Module" onClick={handleSkip} variant="outline" />
        )}
      </div>
    </div>
  );
}
