import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PrimaryButton from '../components/PrimaryButton';

export default function Welcome() {
  const { token, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const accountNotice =
    location.state?.message ||
    (location.state?.accountRemoved
      ? 'This training account is no longer available. Contact your admin, then sign up or log in again.'
      : '');

  useEffect(() => {
    if (!isLoading && token && !location.state?.accountRemoved) {
      navigate('/app/courses', { replace: true });
    }
  }, [isLoading, token, navigate, location.state?.accountRemoved]);

  if (isLoading) {
    return (
      <div className="page-center welcome-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="welcome-page">
      <div className="welcome-scroll">
        <div className="welcome-inner">
          <img
            src="/crunches_logo.png"
            alt="Staff Academy"
            className="welcome-logo"
            width={220}
            height={150}
          />
          {accountNotice ? (
            <p className="welcome-account-notice" role="alert">
              {accountNotice}
            </p>
          ) : null}
          <h1 className="welcome-title">Welcome to Staff Academy</h1>
          <p className="welcome-subtitle">
            Get all the info about your new job role, complete modules, take tests, and certify your
            knowledge—all in one place.
          </p>
        </div>
      </div>
      <div className="welcome-footer">
        <div className="welcome-buttons">
          <Link to="/signup" style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}>
            <PrimaryButton title="Sign Up" />
          </Link>
          <Link to="/login" style={{ textDecoration: 'none', display: 'block' }}>
            <PrimaryButton title="Login" variant="outlineLight" />
          </Link>
        </div>
      </div>
    </div>
  );
}
