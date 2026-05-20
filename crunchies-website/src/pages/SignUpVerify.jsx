import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../constants/colors';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';

const RESEND_COOLDOWN_SEC = 40;

export default function SignUpVerify() {
  const { sendSignupCode, verifySignupCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { staffId = '', email = '' } = location.state || {};

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errors, setErrors] = useState({ code: '', api: '' });
  const [success, setSuccess] = useState(false);
  const [passwordEmailWarning, setPasswordEmailWarning] = useState('');
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SEC);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!staffId || !email) {
      navigate('/signup', { replace: true });
    }
  }, [staffId, email, navigate]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return undefined;
    }
    setCanResend(false);
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setErrors({ code: 'Enter the 6-digit code from your email', api: '' });
      return;
    }
    setErrors({ code: '', api: '' });
    setLoading(true);
    try {
      const result = await verifySignupCode(staffId, email, trimmed);
      if (result?.emailSent === false) {
        setPasswordEmailWarning(
          result.message ||
            'Your account was verified but the password email could not be sent. Contact your admin.'
        );
      } else {
        setPasswordEmailWarning('');
      }
      setSuccess(true);
    } catch (error) {
      setErrors({ code: '', api: error.message || 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setErrors((prev) => ({ ...prev, api: '' }));
    try {
      await sendSignupCode(staffId, email);
      setCountdown(RESEND_COOLDOWN_SEC);
      setCanResend(false);
    } catch (error) {
      setErrors((prev) => ({ ...prev, api: error.message || 'Failed to resend code' }));
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="screen-page">
        <div className="screen-pad" style={{ paddingTop: 56 }}>
          <div className="success-box">
            <h1 className="screen-title" style={{ marginBottom: 12 }}>
              You&apos;re all set
            </h1>
            <p className="success-text">
              {passwordEmailWarning ||
                'Check your email for your password, then sign in on the login screen.'}
            </p>
            <PrimaryButton title="Go to Login" onClick={() => navigate('/login')} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-page">
      <Link to="/signup" className="back-link" aria-label="Back">
        ←
      </Link>
      <div className="screen-pad" style={{ paddingTop: 56 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 className="screen-title">Verify your email</h1>
          <p className="screen-subtitle">
            Enter the 6-digit code we sent to {email}.
          </p>
        </div>
        <InputField
          label="Verification code"
          value={code}
          onChange={(value) => {
            setCode(String(value).replace(/\D/g, '').slice(0, 6));
            setErrors((prev) => ({ ...prev, code: '' }));
          }}
          placeholder="123456"
          type="text"
          error={errors.code}
        />
        <PrimaryButton
          title="Verify and finish sign up"
          onClick={handleVerify}
          loading={loading}
          style={{ marginTop: 12 }}
        />
        <p style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>
          Didn&apos;t get a code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || isResending}
            style={{
              background: 'none',
              border: 'none',
              color: canResend ? colors.primary : '#999',
              fontWeight: 600,
              cursor: canResend && !isResending ? 'pointer' : 'default',
            }}
          >
            {isResending ? 'Sending…' : canResend ? 'Resend code' : `Resend in ${countdown}s`}
          </button>
        </p>
        {errors.api ? (
          <p style={{ color: colors.error, textAlign: 'center', marginTop: 12 }}>{errors.api}</p>
        ) : null}
      </div>
    </div>
  );
}
