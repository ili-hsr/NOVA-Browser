import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import type { Bookmark, Settings } from './types';
import { APP_CONFIG } from './config';
import { favicon } from './url';

interface Props { s: Settings; bookmarks: Bookmark[]; onGo: (v: string) => void; onManage: () => void }
export default function HomePage({ s, bookmarks, onGo, onManage }: Props) {
  const [now, setNow] = useState(new Date());
  const [q, setQ] = useState('');
  useEffect(() => { if (!s.showClock) return; const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, [s.showClock]);
  const bg = /^https:\/\//.test(s.background) ? { backgroundImage: `url("${encodeURI(s.background)}")` } : /^#[0-9a-f]{3,8}$/i.test(s.background) ? { background: s.background } : undefined;
  return (
    <div className="home" style={bg}>
      <h1>{APP_CONFIG.name}</h1>
      {s.showClock && <div style={{ fontSize: '2.2em', fontWeight: 300 }}>{now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>}
      {s.showDate && <div style={{ color: 'var(--mut)' }}>{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>}
      <form className="search" onSubmit={e => { e.preventDefault(); onGo(q); }}>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher sur le web ou saisir une adresse" aria-label="Recherche" />
        <button className="btn" style={{ marginLeft: 8 }} title="Rechercher"><Search size={18} /></button>
      </form>
      <p style={{ color: 'var(--mut)', margin: 0, textAlign: 'center' }}>{APP_CONFIG.tagline}</p>
      {s.showFavs && (
        <div className="grid">
          {bookmarks.slice(0, 12).map(b => <button key={b.id} className="fav" onClick={() => onGo(b.url)}><img src={favicon(b.url)} alt="" />{b.name}</button>)}
          <button className="fav" onClick={onManage}>＋<br />Gérer</button>
        </div>
      )}
    </div>
  );
}
