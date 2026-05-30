import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../constants/colors';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';

export default function Login() {
  const { login, token, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/app/courses';
  const sessionMessage = location.state?.sessionMessage || '';

  useEffect(() => {
    if (!isLoading && token) {
      navigate(from.startsWith('/app') ? from : '/app/courses', { replace: true });
    }
  }, [isLoading, token, navigate, from]);

  if (isLoading) {
    return (
      <div className="page-center screen-page">
        <div className="spinner" />
      </div>
    );
  }

  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ staffId: '', password: '', api: '' });

  const validate = () => {
    const newErrors = { staffId: '', password: '', api: '' };
    if (!staffId.trim()) newErrors.staffId = 'Staff ID is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return !newErrors.staffId && !newErrors.password;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setErrors((prev) => ({ ...prev, api: '' }));
    setLoading(true);
    try {
      await login(staffId.trim(), password);
      navigate(from.startsWith('/app') ? from : '/app/courses', { replace: true });
    } catch (error) {
      setErrors((prev) => ({ ...prev, api: error.message || 'Login failed' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-page">
      <Link to="/" className="back-link" aria-label="Back">
        ←
      </Link>
      <div className="screen-pad">
        <img src="/crunches_logo.png" alt="Staff Academy" className="login-logo" width={180} height={120} />
          <div style={{ marginBottom: 32 }}>
            <h1 className="screen-title">Staff Academy</h1>
            <p className="screen-subtitle">Sign in with your staff ID and password to continue.</p>
            {sessionMessage ? (
              <p
                style={{
                  color: colors.error,
                  marginTop: 12,
                  fontSize: 15,
                  lineHeight: 1.5,
                  textAlign: 'center',
                }}
                role="alert"
              >
                {sessionMessage}
              </p>
            ) : null}
          </div>
        <InputField
          label="Staff ID"
          value={staffId}
          onChange={setStaffId}
          placeholder="Enter your staff ID"
          autoCapitalize="characters"
          error={errors.staffId}
        />
        <InputField
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          type="password"
          error={errors.password}
        />
        <PrimaryButton
          title="Continue"
          onClick={handleSubmit}
          loading={loading}
          style={{ marginTop: 12 }}
        />
        {errors.api ? (
          <p style={{ color: colors.error, textAlign: 'center', marginTop: 12 }}>{errors.api}</p>
        ) : null}
      </div>
    </div>
  );
}
