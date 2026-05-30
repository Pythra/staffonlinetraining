const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://crunches-training.fly.dev';

export function looksLikeHtml(str) {
  if (!str || typeof str !== 'string') return false;
  return /<[a-z][\s\S]*>/i.test(str.trim());
}

/** Turn stored module-asset paths into full API URLs so images load on the staff site. */
export function resolveModuleAssetUrl(src, apiBaseUrl = DEFAULT_API_BASE_URL) {
  const trimmed = String(src || '').trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;

  const base = String(apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/$/, '');
  const assetPath = trimmed.match(/\/api\/module-assets\/[a-fA-F0-9]{24}/);
  if (assetPath) {
    return `${base}${assetPath[0]}`;
  }
  if (trimmed.startsWith('/api/module-assets/')) {
    return `${base}${trimmed}`;
  }
  return trimmed;
}

export function resolveModuleHtmlForDisplay(html, apiBaseUrl = DEFAULT_API_BASE_URL) {
  if (!html || typeof html !== 'string') return '';
  const trimmed = html.trim();
  if (!trimmed) return '';

  return trimmed.replace(/src=(["'])([^"']+)\1/gi, (_match, quote, src) => {
    return `src=${quote}${resolveModuleAssetUrl(src, apiBaseUrl)}${quote}`;
  });
}

export function htmlToPlainText(html) {
  if (!html || typeof html !== 'string') return '';
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text || 'No content available for this module yet.';
}
