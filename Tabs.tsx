import { Copy, Plus, X } from 'lucide-react';
import type { Tab } from './types';
import { favicon } from './url';

interface Props { tabs: Tab[]; activeId: string; onSelect: (id: string) => void; onClose: (id: string) => void; onDuplicate: (id: string) => void; onNew: () => void }
export default function Tabs({ tabs, activeId, onSelect, onClose, onDuplicate, onNew }: Props) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <div key={t.id} className={'tab' + (t.id === activeId ? ' on' : '')} onClick={() => onSelect(t.id)}>
          {t.mode === 'checking' ? <i className="dot" /> : t.url ? <img src={favicon(t.url)} alt="" /> : null}
          <span title={t.title}>{t.title}</span>
          {t.id === activeId && t.url && <button title="Dupliquer l'onglet" onClick={e => { e.stopPropagation(); onDuplicate(t.id); }}><Copy size={13} /></button>}
          <button title="Fermer l'onglet" onClick={e => { e.stopPropagation(); onClose(t.id); }}><X size={14} /></button>
        </div>
      ))}
      <button title="Nouvel onglet" onClick={onNew}><Plus size={16} /></button>
    </div>
  );
}
