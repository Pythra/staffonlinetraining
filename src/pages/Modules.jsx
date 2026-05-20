import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../constants/colors';
import PrimaryButton from '../components/PrimaryButton';

const SNIPPET_LENGTH = 80;

export default function Modules() {
  const { courseCode, subjectKey } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchModule, getAttempts, fetchCourse } = useAuth();

  const user = location.state?.user;

  const [course, setCourse] = useState(location.state?.course || null);
  const [topic, setTopic] = useState(location.state?.topic || null);
  const [loadError, setLoadError] = useState('');

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [attempts, setAttempts] = useState([]);

  const modules = topic?.modules || [];

  useEffect(() => {
    let active = true;
    if (
      course &&
      topic &&
      topic.key === subjectKey &&
      String(course.code).toUpperCase() === String(courseCode).toUpperCase()
    ) {
      return () => {
        active = false;
      };
    }
    (async () => {
      setLoadError('');
      try {
        const c = await fetchCourse(courseCode);
        const t = c.subjects?.find((s) => s.key === subjectKey);
        if (!active) return;
        setCourse(c);
        setTopic(t || null);
        if (!t) setLoadError('Subject not found.');
      } catch (e) {
        if (active) setLoadError(e.message || 'Failed to load');
      }
    })();
    return () => {
      active = false;
    };
  }, [courseCode, subjectKey, fetchCourse, course, topic]);

  const loadAttempts = useCallback(async () => {
    try {
      const list = await getAttempts();
      setAttempts(list || []);
    } catch {
      setAttempts([]);
    }
  }, [getAttempts]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  const passedModuleKeys = useMemo(
    () => new Set((attempts || []).filter((a) => a.passed).map((a) => a.moduleKey)),
    [attempts]
  );

  const handleModulePress = (module, index, scrollToSectionIndex = null) => {
    navigate(`/app/c/${courseCode}/subjects/${subjectKey}/modules/${module.key}`, {
      state: {
        user,
        course,
        topic,
        module,
        moduleIndex: index,
        totalModules: modules.length,
        scrollToSectionIndex,
      },
    });
  };

  const runSearch = async () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const results = [];
      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        try {
          const payload = await fetchModule(mod.key);
          const moduleData = payload?.module || {};
          const body = (moduleData.body || '').toLowerCase();
          const sections = moduleData.sections || [];

          if (body.includes(q)) {
            const start = body.indexOf(q);
            const snippetStart = Math.max(0, start - 20);
            const snippetEnd = Math.min(body.length, start + q.length + SNIPPET_LENGTH);
            let snippet = (moduleData.body || '').slice(snippetStart, snippetEnd);
            if (snippetStart > 0) snippet = '…' + snippet;
            if (snippetEnd < (moduleData.body || '').length) snippet = snippet + '…';
            results.push({
              module: mod,
              moduleIndex: i,
              sectionIndex: null,
              heading: null,
              snippet,
            });
          }

          sections.forEach((sec, idx) => {
            const heading = (sec.heading || '').toLowerCase();
            const text = (sec.text || '').toLowerCase();
            if (heading.includes(q) || text.includes(q)) {
              const rawText = sec.text || '';
              const start = text.indexOf(q);
              let snippet = rawText;
              if (start >= 0 && rawText.length > SNIPPET_LENGTH) {
                const snippetStart = Math.max(0, start - 15);
                const snippetEnd = Math.min(rawText.length, start + q.length + 50);
                snippet = rawText.slice(snippetStart, snippetEnd);
                if (snippetStart > 0) snippet = '…' + snippet;
                if (snippetEnd < rawText.length) snippet = snippet + '…';
              }
              results.push({
                module: mod,
                moduleIndex: i,
                sectionIndex: idx,
                heading: sec.heading || '',
                snippet,
              });
            }
          });
        } catch {
          /* skip */
        }
      }
      setSearchResults(results);
    } finally {
      setSearchLoading(false);
    }
  };

  if (loadError || !topic) {
    return (
      <div className="screen-page">
        <Link to={`/app/c/${courseCode}/topics`} className="back-link">
          ←
        </Link>
        <div className="screen-pad page-center">
          <p style={{ color: colors.error }}>{loadError || 'Loading…'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-page">
      <button
        type="button"
        className="back-link"
        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 24 }}
        onClick={() =>
          navigate(`/app/c/${courseCode}/topics`, { state: { user, course } })
        }
      >
        ←
      </button>
      <div className="modules-header">
        <div className="modules-header-row">
          <div>
            <h1 className="modules-title">{topic?.name || 'Topic'}</h1>
            <p className="modules-sub">
              {modules.length} modules • Tap to start learning
            </p>
          </div>
          <button
            type="button"
            className="search-toggle"
            onClick={() => setSearchVisible(!searchVisible)}
            aria-label="Search"
          >
            {searchVisible ? '✕' : '🔍'}
          </button>
        </div>
        {searchVisible && (
          <div className="search-row">
            <input
              className="search-input"
              placeholder="Search in module content…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
            <PrimaryButton
              title="Search"
              onClick={runSearch}
              loading={searchLoading}
              style={{ width: 'auto', minWidth: 88, minHeight: 44, marginBottom: 0 }}
            />
          </div>
        )}
        {searchVisible && searchResults.length > 0 && (
          <p className="results-label">Appearances in modules</p>
        )}
      </div>
      <div className="screen-pad modules-scroll">
        {searchVisible && searchResults.length > 0 ? (
          searchResults.map((r, idx) => (
            <button
              key={`${r.module.key}-${r.sectionIndex ?? 'body'}-${idx}`}
              type="button"
              className="search-result-card"
              onClick={() => handleModulePress(r.module, r.moduleIndex, r.sectionIndex)}
            >
              <div className="result-mod-title">{r.module.title}</div>
              {r.heading ? <div className="result-heading">{r.heading}</div> : null}
              <div className="result-snippet">{r.snippet}</div>
            </button>
          ))
        ) : searchVisible && searchQuery.trim() && !searchLoading && searchResults.length === 0 ? (
          <p className="muted">No matches for &quot;{searchQuery.trim()}&quot;</p>
        ) : (
          modules.map((module, index) => {
            const isPassed = passedModuleKeys.has(module.key);
            return (
              <button
                key={module.key}
                type="button"
                className={`module-card ${isPassed ? 'passed' : ''}`}
                onClick={() => handleModulePress(module, index)}
              >
                <div className="module-card-inner">
                  <div className="module-num">{index + 1}</div>
                  <div>
                    <div className="module-title">{module.title}</div>
                    <div className="module-meta">
                      Module {index + 1} of {modules.length}
                    </div>
                  </div>
                </div>
                {isPassed && <div className="passed-pill">PASSED</div>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
