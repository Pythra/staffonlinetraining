import { colors } from '../constants/colors';

export default function PrimaryButton({
  title,
  onClick,
  disabled,
  loading,
  variant = 'solid',
  style = {},
}) {
  const isOutline = variant === 'outline' || variant === 'outlineLight';
  const bg =
    variant === 'outlineLight'
      ? 'transparent'
      : isOutline
        ? 'transparent'
        : colors.verifyActive;
  const color =
    variant === 'outlineLight' ? '#fff' : isOutline ? colors.primary : '#fff';
  const border = isOutline
    ? `2px solid ${variant === 'outlineLight' ? '#fff' : colors.primary}`
    : 'none';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%',
        minHeight: 52,
        borderRadius: 14,
        border,
        background: loading ? '#ccc' : bg,
        color,
        fontSize: 17,
        fontWeight: 700,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {loading ? (
        <span
          style={{
            display: 'inline-block',
            width: 22,
            height: 22,
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            verticalAlign: 'middle',
          }}
        />
      ) : (
        title
      )}
    </button>
  );
}
