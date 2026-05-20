import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../constants/colors';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';

export default function SignUp() {
  const { sendSignupCode } = useAuth();
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ staffId: '', email: '', api: '' });

  const validate = () => {
    const newErrors = { staffId: '', email: '', api: '' };
    if (!staffId.trim()) newErrors.staffId = 'Staff ID is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    setErrors(newErrors);
    return !newErrors.staffId && !newErrors.email;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setErrors((prev) => ({ ...prev, api: '' }));
    setLoading(true);
    try {
      await sendSignupCode(staffId.trim(), email.trim().toLowerCase());
      navigate('/signup/verify', {
        state: { staffId: staffId.trim(), email: email.trim().toLowerCase() },
      });
    } catch (error) {
      setErrors((prev) => ({ ...prev, api: error.message || 'Sign up failed' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-page">
      <Link to="/" className="back-link" aria-label="Back">
        ←
      </Link>
      <div className="screen-pad" style={{ paddingTop: 56 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 className="screen-title">Sign up</h1>
          <p className="screen-subtitle">
            Your profile was created by admin. Enter your Staff ID and email to receive a verification code.
          </p>
        </div>
        <>
            <InputField
              label="Staff ID"
              value={staffId}
              onChange={setStaffId}
              placeholder="Enter your staff ID"
              autoCapitalize="characters"
              error={errors.staffId}
            />
            <InputField
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="Enter your work email"
              type="email"
              error={errors.email}
            />
            <PrimaryButton
              title="Send verification code"
              onClick={handleSubmit}
              loading={loading}
              style={{ marginTop: 12 }}
            />
            {errors.api ? (
              <p style={{ color: colors.error, textAlign: 'center', marginTop: 12 }}>{errors.api}</p>
            ) : null}
          </>
      </div>
    </div>
  );
}
