import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark as BookmarkIcon, Clock, EyeOff, Home, Menu, RotateCw, Settings as Cog, Star } from 'lucide-react';
import type { Mode, Tab, View } from './types';
import { APP_CONFIG } from './config';

const LABEL: Record<Mode, string> = { home: '', checking: 'Vérification…', iframe: 'Iframe', proxy: 'Via proxy NOVA', external: 'Navigateur externe' };
interface Props {
  tab: Tab; privateMode: boolean; bookmarked: boolean;
  onBack: () => void; onForward: () => void; onReload: () => void; onHome: () => void;
  onSubmit: (v: string) => void; onToggleBookmark: () => void; onMenu: (v: View) => void; onTogglePrivate: () => void;
}
export default function Toolbar(p: Props) {
  const [text, setText] = useState(p.tab.url);
  const [open, setOpen] = useState(false);
  useEffect(() => setText(p.tab.url), [p.tab.url, p.tab.id]);
  const item = (icon: JSX.Element, label: string, fn: () => void) => <button onClick={() => { setOpen(false); fn(); }}>{icon}{label}</button>;
  return (
    <div className="bar">
      <button title="Précédent" disabled={p.tab.pos === 0} onClick={p.onBack}><ArrowLeft size={18} /></button>
      <button title="Suivant" disabled={p.tab.pos >= p.tab.trail.length - 1} onClick={p.onForward}><ArrowRight size={18} /></button>
      <button title="Actualiser" disabled={!p.tab.url} onClick={p.onReload}><RotateCw size={17} /></button>
      <button title="Accueil" onClick={p.onHome}><Home size={18} /></button>
      <form className="addr" onSubmit={e => { e.preventDefault(); p.onSubmit(text); }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Rechercher ou saisir une adresse" aria-label="Adresse" />
        {p.privateMode && <EyeOff size={14} />}
        <span className="badge">{LABEL[p.tab.mode]}</span>
      </form>
      {APP_CONFIG.features.bookmarks && <button title="Ajouter/retirer des favoris" disabled={!p.tab.url} onClick={p.onToggleBookmark}><Star size={18} fill={p.bookmarked ? 'var(--accent)' : 'none'} /></button>}
      <button title="Menu" onClick={() => setOpen(!open)}><Menu size={18} /></button>
      {open && (
        <div className="menu">
          {APP_CONFIG.features.bookmarks && item(<BookmarkIcon size={16} />, 'Favoris', () => p.onMenu('bookmarks'))}
          {APP_CONFIG.features.history && item(<Clock size={16} />, 'Historique', () => p.onMenu('history'))}
          {item(<EyeOff size={16} />, p.privateMode ? 'Quitter la navigation privée' : 'Navigation privée', p.onTogglePrivate)}
          {item(<Cog size={16} />, 'Paramètres', () => p.onMenu('settings'))}
        </div>
      )}
    </div>
  );
}
