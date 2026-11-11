import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { HistoryEntry } from './types';
import { favicon } from './url';

interface Props { entries: HistoryEntry[]; setEntries: (f: (h: HistoryEntry[]) => HistoryEntry[]) => void; onOpen: (u: string) => void }
const PERIODS: Record<string, number> = { '1 heure': 3600e3, '24 heures': 86400e3, '7 jours': 7 * 86400e3 };
export default function HistoryPanel({ entries, setEntries, onOpen }: Props) {
  const [q, setQ] = useState('');
  const [p, setP] = useState('1 heure');
  const list = entries.filter(e => (e.url + e.title).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="panel">
      <h2>Historique</h2>
      <div className="row">
        <input placeholder="Rechercher dans l’historique" value={q} onChange={e => setQ(e.target.value)} />
        <select value={p} onChange={e => setP(e.target.value)}>{Object.keys(PERIODS).map(k => <option key={k}>{k}</option>)}</select>
        <button onClick={() => setEntries(h => h.filter(e => Date.now() - e.at > PERIODS[p]))}>Effacer la période</button>
        <button onClick={() => confirm('Effacer tout l’historique ?') && setEntries(() => [])}>Tout effacer</button>
      </div>
      {list.slice(0, 300).map(e => (
        <div className="row" key={e.id}>
          <img src={favicon(e.url)} width={16} height={16} alt="" />
          <button style={{ flex: 1, justifyContent: 'flex-start', overflow: 'hidden' }} onClick={() => onOpen(e.url)} title={e.url}>{e.title}</button>
          <small style={{ color: 'var(--mut)' }}>{new Date(e.at).toLocaleString('fr-FR')}</small>
          <button title="Supprimer" onClick={() => setEntries(h => h.filter(x => x.id !== e.id))}><Trash2 size={15} /></button>
        </div>
      ))}
      {!list.length && <p style={{ color: 'var(--mut)' }}>Aucune entrée.</p>}
    </div>
  );
}
