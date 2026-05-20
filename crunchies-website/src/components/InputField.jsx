import { colors } from '../constants/colors';

export default function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  autoCapitalize,
  disabled,
  id,
}) {
  const inputId = id || `field-${label || 'input'}`.replace(/\s+/g, '-');
  return (
    <div style={{ marginBottom: 16 }}>
      {label ? (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: colors.text,
            marginBottom: 8,
          }}
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoCapitalize={autoCapitalize}
        autoComplete={type === 'password' ? 'current-password' : undefined}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          height: 48,
          padding: '0 14px',
          fontSize: 16,
          border: `1px solid ${error ? colors.error : '#e0e0e0'}`,
          borderRadius: 12,
          outline: 'none',
        }}
      />
      {error ? (
        <p style={{ color: colors.error, fontSize: 13, marginTop: 6, marginBottom: 0 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
