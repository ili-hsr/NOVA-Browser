/** Détecte URL vs recherche. "google.com" → https://google.com ; "voiture" → moteur de recherche. */
export function resolveInput(input: string, engineUrl: string): string {
  const v = input.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return isHttp(v) ? v : '';
  if (/^[^\s/]+\.[a-z]{2,}(:\d+)?([/?#]\S*)?$/i.test(v) || /^localhost(:\d+)?([/?#]\S*)?$/i.test(v)) return 'https://' + v;
  return engineUrl.replace('%s', encodeURIComponent(v));
}
export const isHttp = (u: string) => { try { const p = new URL(u).protocol; return p === 'http:' || p === 'https:'; } catch { return false; } };
export const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
export const favicon = (u: string) => `https://icons.duckduckgo.com/ip3/${host(u)}.ico`;
