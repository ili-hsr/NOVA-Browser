import { useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Trash2 } from 'lucide-react';
import type { Bookmark } from './types';
import { isHttp } from './url';

interface Props { bookmarks: Bookmark[]; setBookmarks: (f: (b: Bookmark[]) => Bookmark[]) => void; onOpen: (u: string) => void }
export default function BookmarksPanel({ bookmarks, setBookmarks, onOpen }: Props) {
  const [n, setN] = useState({ name: '', url: '', folder: '' });
  const edit = (id: string, p: Partial<Bookmark>) => setBookmarks(b => b.map(x => x.id === id ? { ...x, ...p } : x));
  const move = (i: number, d: number) => setBookmarks(b => { const a = [...b], j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; });
  const add = () => {
    const url = /^https?:\/\//.test(n.url) ? n.url : 'https://' + n.url;
    if (!n.name.trim() || !isHttp(url)) return alert('Nom et adresse valides requis.');
    setBookmarks(b => [...b, { id: crypto.randomUUID(), name: n.name.trim(), url, folder: n.folder.trim() }]);
    setN({ name: '', url: '', folder: '' });
  };
  const folders = [...new Set(bookmarks.map(b => b.folder).filter(Boolean))];
  return (
    <div className="panel">
      <h2>Favoris</h2>
      <datalist id="folders">{folders.map(f => <option key={f} value={f} />)}</datalist>
      <div className="row">
        <input placeholder="Nom" value={n.name} onChange={e => setN({ ...n, name: e.target.value })} />
        <input placeholder="Adresse" value={n.url} onChange={e => setN({ ...n, url: e.target.value })} />
        <input placeholder="Dossier (facultatif)" list="folders" value={n.folder} onChange={e => setN({ ...n, folder: e.target.value })} />
        <button className="btn" onClick={add}>Ajouter</button>
      </div>
      {bookmarks.map((b, i) => (
        <div className="row" key={b.id}>
          <input value={b.name} onChange={e => edit(b.id, { name: e.target.value })} aria-label="Nom" />
          <input value={b.url} onChange={e => edit(b.id, { url: e.target.value })} aria-label="Adresse" />
          <input value={b.folder} list="folders" placeholder="Dossier" onChange={e => edit(b.id, { folder: e.target.value })} aria-label="Dossier" />
          <button title="Monter" onClick={() => move(i, -1)}><ArrowUp size={15} /></button>
          <button title="Descendre" onClick={() => move(i, 1)}><ArrowDown size={15} /></button>
          <button title="Ouvrir" onClick={() => onOpen(b.url)}><ExternalLink size={15} /></button>
          <button title="Supprimer" onClick={() => setBookmarks(x => x.filter(y => y.id !== b.id))}><Trash2 size={15} /></button>
        </div>
      ))}
      {!bookmarks.length && <p style={{ color: 'var(--mut)' }}>Aucun favori.</p>}
    </div>
  );
}
