import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PrimaryButton from '../components/PrimaryButton';

export default function Welcome() {
  const { token, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && token) {
      navigate('/app/courses', { replace: true });
    }
  }, [isLoading, token, navigate]);

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
            alt="Crunchies"
            className="welcome-logo"
            width={220}
            height={150}
          />
          <h1 className="welcome-title">Welcome to Training</h1>
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
