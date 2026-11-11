import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Mode, Settings, Tab } from './types';
import { APP_CONFIG } from './config';
import { checkSite, proxiedSrc } from './proxy';
import { host } from './url';

type V = { kind: 'checking' } | { kind: 'iframe' | 'proxy'; src: string; note?: string } | { kind: 'external'; reason: string };
interface Props { tab: Tab; settings: Settings; onMode: (m: Mode) => void; onTitle: (t: string) => void; onNavigate: (u: string) => void }

/** Choisit honnêtement le mode d'affichage : proxy, iframe ou ouverture externe. Ne prétend jamais afficher ce qui ne l'est pas. */
export default function BrowserView({ tab, settings, onMode, onTitle, onNavigate }: Props) {
  const [v, setV] = useState<V>({ kind: 'checking' });
  const ref = useRef<HTMLIFrameElement>(null);
  const url = tab.url;
  const open = () => window.open(url, '_blank', 'noopener,noreferrer');

  useEffect(() => {
    let off = false;
    const go = (n: V) => { if (!off) { setV(n); onMode(n.kind); } };
    if (!(APP_CONFIG.features.proxy && settings.proxyEnabled)) {
      go({ kind: 'iframe', src: url, note: 'Page vide ? Le site refuse peut-être l’intégration (NOVA ne peut pas le détecter sans proxy).' });
      return () => { off = true; };
    }
    checkSite(settings, url).then(r => {
      if (!r.ok) go({ kind: 'external', reason: r.reason || 'Le proxy n’a pas pu accéder à ce site.' });
      else if (!r.frameable) go({ kind: 'external', reason: 'Ce site interdit son affichage dans une autre page (en-têtes de sécurité). NOVA respecte cette restriction.' });
      else if (settings.iframeWhenPossible || !settings.proxyAuto) go({ kind: 'iframe', src: url });
      else go({ kind: 'proxy', src: proxiedSrc(settings, url) });
    }).catch(e => go({ kind: 'iframe', src: url, note: `Proxy injoignable (${e.message}) — affichage direct tenté.` }));
    return () => { off = true; };
  }, [url]); // eslint-disable-line

  useEffect(() => {
    const h = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow || !e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'nova:navigate' && typeof e.data.url === 'string') onNavigate(e.data.url);
      if (e.data.type === 'nova:title' && typeof e.data.title === 'string' && e.data.title) onTitle(e.data.title.slice(0, 80));
    };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  });

  if (v.kind === 'checking') return <div className="center">Chargement de {host(url)}…</div>;
  if (v.kind === 'external') return (
    <div className="center"><div>
      <h2>Impossible d’afficher ce site dans NOVA</h2><p>{v.reason}</p>
      <button className="btn" onClick={open}><ExternalLink size={16} />Ouvrir dans le navigateur</button>
    </div></div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <iframe ref={ref} className="frame" src={v.src} title={tab.title}
        sandbox={v.kind === 'proxy' ? 'allow-scripts allow-forms allow-popups' : 'allow-scripts allow-forms allow-popups allow-same-origin'} />
      <div className="note"><span>{v.note ?? 'Affiché via le proxy NOVA.'}</span><button onClick={open}><ExternalLink size={13} />Ouvrir à l’extérieur</button></div>
    </div>
  );
}
