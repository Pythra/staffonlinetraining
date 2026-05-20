export function looksLikeHtml(str) {
  if (!str || typeof str !== 'string') return false;
  return /<[a-z][\s\S]*>/i.test(str.trim());
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
