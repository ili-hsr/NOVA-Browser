import { useState } from 'react';
import type { Settings } from './types';
import { APP_CONFIG } from './config';
import { testProxy } from './proxy';

interface Props { s: Settings; set: (p: Partial<Settings>) => void }
export default function SettingsPage({ s, set }: Props) {
  const [test, setTest] = useState('');
  const T = (k: keyof Settings, label: string) => (
    <label className="row"><input type="checkbox" checked={s[k] as boolean} onChange={e => set({ [k]: e.target.checked } as Partial<Settings>)} />{label}</label>
  );
  return (
    <div className="panel">
      <h2>Paramètres <small style={{ color: 'var(--mut)', fontWeight: 400 }}>(sauvegarde automatique)</small></h2>
      <h3>Apparence</h3>
      <label className="row">Thème <select value={s.theme} onChange={e => set({ theme: e.target.value as Settings['theme'] })}><option value="dark">Sombre</option><option value="light">Clair</option></select></label>
      <label className="row">Couleur d’accent <input type="color" value={s.accent} onChange={e => set({ accent: e.target.value })} /></label>
      <label className="row">Arrondi ({s.radius}px) <input type="range" min={0} max={24} value={s.radius} onChange={e => set({ radius: +e.target.value })} /></label>
      <label className="row">Taille du texte ({s.fontSize}px) <input type="range" min={12} max={20} value={s.fontSize} onChange={e => set({ fontSize: +e.target.value })} /></label>
      <label className="row">Densité <select value={s.density} onChange={e => set({ density: e.target.value as Settings['density'] })}><option value="comfortable">Confortable</option><option value="compact">Compacte</option></select></label>
      {T('animations', 'Animations')}
      <h3>Page d’accueil</h3>
      {T('showClock', 'Afficher l’horloge')}{T('showDate', 'Afficher la date')}{T('showFavs', 'Afficher les favoris')}
      <label className="row">Arrière-plan <input placeholder="URL https://… d’image, ou couleur #112233 (vide = aucun)" value={s.background} onChange={e => set({ background: e.target.value.trim() })} /></label>
      <h3>Navigation</h3>
      <label className="row">Moteur de recherche
        <select value={s.engine} onChange={e => set({ engine: e.target.value as Settings['engine'] })}>
          <option value="google">Google</option><option value="bing">Bing</option><option value="duckduckgo">DuckDuckGo</option><option value="custom">Personnalisé</option>
        </select></label>
      {s.engine === 'custom' && <label className="row">URL <input placeholder="https://exemple.com/?q=%s  (%s = la recherche)" value={s.customEngine} onChange={e => set({ customEngine: e.target.value })} /></label>}
      {T('restoreTabs', 'Restaurer les onglets au démarrage')}{T('privateMode', 'Navigation privée (pas d’historique enregistré)')}
      {APP_CONFIG.features.proxy && <>
        <h3>Proxy</h3>
        {T('proxyEnabled', 'Activer le proxy NOVA (serveur personnel requis, voir README)')}
        <label className="row">Adresse du serveur <input value={s.proxyUrl} onChange={e => set({ proxyUrl: e.target.value })} /></label>
        <label className="row">Jeton d’accès <input type="password" value={s.proxyToken} onChange={e => set({ proxyToken: e.target.value })} placeholder="PROXY_TOKEN du serveur" /></label>
        {T('proxyAuto', 'Essayer le proxy automatiquement')}
        {T('iframeWhenPossible', 'Préférer l’iframe directe quand le proxy n’est pas nécessaire')}
        <div className="row"><button className="btn" onClick={async () => { setTest('Test…'); setTest(await testProxy(s)); }}>Tester la connexion</button><span>{test}</span></div>
      </>}
    </div>
  );
}
