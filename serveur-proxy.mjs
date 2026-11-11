// Proxy NOVA — module indépendant, sans dépendance. Node 18+.  Lancer : PROXY_TOKEN=secret node server/proxy.mjs
import http from 'node:http';
import dns from 'node:dns/promises';
import net from 'node:net';

const PORT = +process.env.PORT || 8787;
const TOKEN = process.env.PROXY_TOKEN;
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173').split(',').map(s => s.trim());
const MAX_BYTES = 5 * 1024 * 1024, TIMEOUT_MS = 10_000, RATE_PER_MIN = 60, MAX_REDIRECTS = 5;
if (!TOKEN || TOKEN.length < 12) { console.error('PROXY_TOKEN (12+ caractères) est obligatoire : le proxy ne doit jamais être public.'); process.exit(1); }

// ---- Protection SSRF : refuse les adresses privées / internes ----
function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  const v = ip.toLowerCase();
  if (v.startsWith('::ffff:')) return v.includes('.') ? isPrivateIp(v.slice(7)) : true;
  return v === '::' || v === '::1' || /^f[cd]/.test(v) || /^fe[89ab]/.test(v);
}
async function assertSafe(raw) {
  let u; try { u = new URL(raw); } catch { throw new Error('URL invalide'); }
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Protocole non autorisé');
  if (u.username || u.password) throw new Error('Identifiants dans l’URL interdits');
  if (u.port && !['80', '443'].includes(u.port)) throw new Error('Port non autorisé');
  const h = u.hostname.replace(/^\[|\]$/g, '');
  const ips = net.isIP(h) ? [h] : (await dns.lookup(h, { all: true })).map(r => r.address);
  if (!ips.length || ips.some(isPrivateIp)) throw new Error('Adresse interne ou privée bloquée');
  return u;
}
// Suit les redirections à la main en revalidant chaque étape.
async function safeFetch(raw) {
  let url = raw;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertSafe(url);
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'user-agent': 'NOVA-Proxy/0.1', accept: 'text/html,*/*;q=0.5' } });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) { url = new URL(res.headers.get('location'), url).href; res.body?.cancel(); continue; }
    return { res, url };
  }
  throw new Error('Trop de redirections');
}
// Politique de cadrage du site : on la RESPECTE (jamais contournée).
function framingForbidden(h) {
  const xfo = h.get('x-frame-options');
  const csp = h.get('content-security-policy') || '';
  return !!xfo || /frame-ancestors/i.test(csp);
}
async function readLimited(res) {
  const chunks = []; let n = 0;
  for await (const c of res.body) { n += c.length; if (n > MAX_BYTES) throw new Error('Réponse trop volumineuse'); chunks.push(c); }
  return Buffer.concat(chunks);
}
const INJECT = (base) => `<base href="${base.replace(/"/g, '&quot;')}"><script>
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a||!/^https?:/.test(a.href))return;e.preventDefault();parent.postMessage({type:'nova:navigate',url:a.href},'*')},true);
addEventListener('load',function(){parent.postMessage({type:'nova:title',title:document.title},'*')});
</script>`;
const page = (msg) => `<!doctype html><meta charset=utf-8><body style="font:16px system-ui;padding:2rem"><h2>NOVA Proxy</h2><p>${msg.replace(/[<>&]/g, '')}</p>`;

// ---- Limitation de débit simple par IP ----
const hits = new Map();
function limited(ip) { const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 60_000); a.push(now); hits.set(ip, a); return a.length > RATE_PER_MIN; }
setInterval(() => hits.clear(), 10 * 60_000).unref();

http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ORIGINS.includes(origin)) { res.setHeader('access-control-allow-origin', origin); res.setHeader('vary', 'origin'); }
  const json = (code, o) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
  try {
    const u = new URL(req.url, 'http://x');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    if (req.method !== 'GET') return json(405, { error: 'GET uniquement' });
    if (u.searchParams.get('token') !== TOKEN) return json(401, { error: 'jeton invalide' });
    if (limited(req.socket.remoteAddress)) return json(429, { error: 'trop de requêtes' });
    if (u.pathname === '/health') return json(200, { ok: true });
    const target = u.searchParams.get('url') || '';
    if (u.pathname === '/check') {
      try {
        const { res: r } = await safeFetch(target); r.body?.cancel();
        return json(200, { ok: r.status < 500, frameable: !framingForbidden(r.headers), reason: r.status >= 500 ? `Le site répond avec l’erreur ${r.status}.` : undefined });
      } catch (e) { return json(200, { ok: false, frameable: false, reason: e.message }); }
    }
    if (u.pathname === '/proxy') {
      const { res: r, url: finalUrl } = await safeFetch(target);
      const type = r.headers.get('content-type') || '';
      const send = (code, html) => { res.writeHead(code, { 'content-type': 'text/html; charset=utf-8', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' }); res.end(html); };
      if (framingForbidden(r.headers)) { r.body?.cancel(); return send(403, page('Ce site interdit son affichage dans une autre page. Ouvrez-le dans le navigateur.')); }
      if (!/text\/html/i.test(type)) { r.body?.cancel(); return send(415, page('Type de contenu non pris en charge (HTML uniquement).')); }
      const len = +r.headers.get('content-length'); if (len > MAX_BYTES) { r.body?.cancel(); return send(413, page('Page trop volumineuse.')); }
      const charset = (/charset=([\w-]+)/i.exec(type) || [])[1] || 'utf-8';
      let html; try { html = new TextDecoder(charset).decode(await readLimited(r)); } catch (e) { return send(502, page(e.message)); }
      html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + INJECT(finalUrl)) : INJECT(finalUrl) + html;
      return send(r.status, html);
    }
    json(404, { error: 'introuvable' });
  } catch (e) { json(500, { error: e.message }); }
}).listen(PORT, () => console.log(`NOVA proxy sur :${PORT} — origines autorisées : ${ORIGINS.join(', ')}`));
