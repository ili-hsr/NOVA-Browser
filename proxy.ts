import type { Settings } from './types';
/** Client du proxy NOVA (module indépendant : désactiver features.proxy ne casse rien d'autre). */
const base = (s: Settings) => s.proxyUrl.replace(/\/+$/, '');
const q = (s: Settings, url?: string) => `${url ? `url=${encodeURIComponent(url)}&` : ''}token=${encodeURIComponent(s.proxyToken)}`;
export interface CheckResult { ok: boolean; frameable: boolean; reason?: string }
export async function checkSite(s: Settings, url: string): Promise<CheckResult> {
  const r = await fetch(`${base(s)}/check?${q(s, url)}`);
  if (r.status === 401) throw new Error('jeton refusé');
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
export const proxiedSrc = (s: Settings, url: string) => `${base(s)}/proxy?${q(s, url)}`;
export async function testProxy(s: Settings): Promise<string> {
  try {
    const r = await fetch(`${base(s)}/health?${q(s)}`);
    if (r.status === 401) return '❌ Jeton refusé';
    return r.ok ? '✅ Proxy opérationnel' : `❌ Erreur HTTP ${r.status}`;
  } catch (e) { return `❌ Injoignable (${(e as Error).message}). Serveur lancé ? HTTPS requis si NOVA est en HTTPS.`; }
}
