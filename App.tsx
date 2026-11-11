import { useEffect, useState } from 'react';
import { APP_CONFIG } from './config';
import { usePersistentState } from './usePersistentState';
import { host, resolveInput } from './url';
import type { Bookmark, HistoryEntry, Mode, Settings, Tab, View } from './types';
import Tabs from './Tabs';
import Toolbar from './Toolbar';
import BrowserView from './BrowserView';
import HomePage from './HomePage';
import BookmarksPanel from './BookmarksPanel';
import HistoryPanel from './HistoryPanel';
import SettingsPage from './SettingsPage';

const uid = () => crypto.randomUUID();
const view = (url: string): Pick<Tab, 'url' | 'title' | 'mode'> => ({ url, title: url ? host(url) : 'Nouvel onglet', mode: url ? 'checking' : 'home' });
const mkTab = (url = ''): Tab => ({ id: uid(), trail: [url], pos: 0, nonce: 0, ...view(url) });
const visit = (t: Tab, url: string): Tab => { const trail = [...t.trail.slice(0, t.pos + 1), url]; return { ...t, trail, pos: trail.length - 1, ...view(url) }; };
const seek = (t: Tab, pos: number): Tab => ({ ...t, pos, ...view(t.trail[pos]) });

export default function App() {
  const [s, setS] = usePersistentState<Settings>('nova.settings', APP_CONFIG.defaultSettings);
  const [bookmarks, setBookmarks] = usePersistentState<Bookmark[]>('nova.bookmarks', APP_CONFIG.defaultBookmarks.map(([name, url]) => ({ id: uid(), name, url, folder: '' })));
  const [hist, setHist] = usePersistentState<HistoryEntry[]>('nova.history', []);
  const [tabs, setTabs] = usePersistentState<Tab[]>('nova.tabs', [mkTab()]);
  const [activeId, setActiveId] = usePersistentState<string>('nova.active', '');
  const [screen, setScreen] = useState<View>('browser');
  const set = (p: Partial<Settings>) => setS(o => ({ ...o, ...p }));
  const active = tabs.find(t => t.id === activeId) ?? tabs[0];

  useEffect(() => { if (!s.restoreTabs) setTabs([mkTab()]); }, []); // eslint-disable-line
  useEffect(() => {
    const r = document.documentElement;
    r.dataset.theme = s.theme;
    r.style.setProperty('--accent', s.accent); r.style.setProperty('--radius', s.radius + 'px'); r.style.fontSize = s.fontSize + 'px';
    r.className = (s.animations ? '' : 'noanim ') + 'dens-' + s.density;
  }, [s]);

  const engine = s.engine === 'custom' && s.customEngine.includes('%s') ? s.customEngine : APP_CONFIG.engines[s.engine] ?? APP_CONFIG.engines.google;
  const patch = (id: string, p: Partial<Tab>) => setTabs(ts => ts.map(t => t.id === id ? { ...t, ...p } : t));
  const update = (fn: (t: Tab) => Tab) => setTabs(ts => ts.map(t => t.id === active.id ? fn(t) : t));

  const navigate = (raw: string) => {
    const url = raw.trim() === '' ? '' : resolveInput(raw, engine);
    if (raw.trim() !== '' && !url) return;
    setScreen('browser'); update(t => visit(t, url));
    if (url && APP_CONFIG.features.history && !s.privateMode) setHist(h => [{ id: uid(), url, title: host(url), at: Date.now() }, ...h].slice(0, 2000));
  };
  const newTab = (url = '') => { const t = mkTab(url); setTabs(ts => [...ts, t]); setActiveId(t.id); setScreen('browser'); };
  const closeTab = (id: string) => {
    if (tabs.length === 1) { const t = mkTab(); setTabs([t]); setActiveId(t.id); return; }
    const i = tabs.findIndex(t => t.id === id), rest = tabs.filter(t => t.id !== id);
    setTabs(rest); if (id === active.id) setActiveId(rest[Math.min(i, rest.length - 1)].id);
  };
  const duplicate = (id: string) => { const t = tabs.find(x => x.id === id); if (!t) return; const c = { ...t, id: uid(), trail: [...t.trail] }; setTabs(ts => [...ts, c]); setActiveId(c.id); };
  const bookmarked = bookmarks.some(b => b.url === active.url);
  const toggleBookmark = () => setBookmarks(b => bookmarked ? b.filter(x => x.url !== active.url) : [...b, { id: uid(), name: active.title, url: active.url, folder: '' }]);

  return (
    <div className="app">
      <Tabs tabs={tabs} activeId={active.id} onSelect={id => { setActiveId(id); setScreen('browser'); }} onClose={closeTab} onDuplicate={duplicate} onNew={() => newTab()} />
      <Toolbar tab={active} privateMode={s.privateMode} bookmarked={bookmarked}
        onBack={() => update(t => seek(t, t.pos - 1))} onForward={() => update(t => seek(t, t.pos + 1))}
        onReload={() => update(t => ({ ...t, nonce: t.nonce + 1, mode: 'checking' }))} onHome={() => navigate('')}
        onSubmit={navigate} onToggleBookmark={toggleBookmark} onMenu={setScreen} onTogglePrivate={() => set({ privateMode: !s.privateMode })} />
      <main className="main">
        {screen === 'bookmarks' && <BookmarksPanel bookmarks={bookmarks} setBookmarks={setBookmarks} onOpen={navigate} />}
        {screen === 'history' && <HistoryPanel entries={hist} setEntries={setHist} onOpen={navigate} />}
        {screen === 'settings' && <SettingsPage s={s} set={set} />}
        {screen === 'browser' && (active.url
          ? <BrowserView key={active.id + active.url + active.nonce} tab={active} settings={s} onMode={(m: Mode) => patch(active.id, { mode: m })}
              onTitle={t => patch(active.id, { title: t })} onNavigate={navigate} />
          : <HomePage s={s} bookmarks={bookmarks} onGo={navigate} onManage={() => setScreen('bookmarks')} />)}
      </main>
    </div>
  );
}
