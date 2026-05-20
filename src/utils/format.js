export function capitalizeWords(str) {
  if (!str || typeof str !== 'string') return str || '';
  return str
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now - d;
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  const diffW = Math.floor(diffD / 7);
  const diffY = Math.floor(diffD / 365);
  if (diffM < 60) return `${diffM}m`;
  if (diffH < 24) return `${diffH}h`;
  if (diffD < 7) return `${diffD}d`;
  if (diffW < 52) return `${diffW}w`;
  return `${diffY}y`;
}

export function getScoreLabel(scorePercent, passed) {
  if (scorePercent == null) return passed ? 'Pass' : 'Fail';
  const s = Number(scorePercent);
  if (!passed) return 'Fail';
  if (s >= 80) return 'Distinction';
  if (s >= 70) return 'Merit';
  return 'Pass';
}
