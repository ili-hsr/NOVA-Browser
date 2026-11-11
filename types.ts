export type Mode = 'home' | 'checking' | 'iframe' | 'proxy' | 'external';
export interface Tab { id: string; url: string; title: string; mode: Mode; trail: string[]; pos: number; nonce: number }
export interface Bookmark { id: string; name: string; url: string; folder: string }
export interface HistoryEntry { id: string; url: string; title: string; at: number }
export interface Settings {
  theme: 'light' | 'dark'; accent: string; radius: number; fontSize: number; animations: boolean;
  density: 'comfortable' | 'compact';
  engine: 'google' | 'bing' | 'duckduckgo' | 'custom'; customEngine: string;
  showClock: boolean; showDate: boolean; showFavs: boolean; background: string;
  restoreTabs: boolean; privateMode: boolean;
  proxyEnabled: boolean; proxyUrl: string; proxyToken: string; proxyAuto: boolean; iframeWhenPossible: boolean;
}
export type View = 'browser' | 'bookmarks' | 'history' | 'settings';
