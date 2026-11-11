import type { Settings } from './types';

/**
 * CONFIGURATION CENTRALE DE NOVA — modifie ici le nom, les défauts, les moteurs, les favoris
 * de départ et active/désactive des fonctionnalités.
 */
export const APP_CONFIG = {
  name: 'NOVA',
  tagline: 'Votre fenêtre sur le web. Recherchez, saisissez une adresse, ou lancez un favori.',
  features: { proxy: true, history: true, bookmarks: true }, // false = fonctionnalité retirée de l'interface
  engines: {
    google: 'https://www.google.com/search?q=%s',
    bing: 'https://www.bing.com/search?q=%s',
    duckduckgo: 'https://duckduckgo.com/?q=%s',
  } as Record<string, string>,
  defaultSettings: {
    theme: 'dark', accent: '#6366f1', radius: 12, fontSize: 16, animations: true, density: 'comfortable',
    engine: 'google', customEngine: '', showClock: true, showDate: true, showFavs: true, background: '',
    restoreTabs: true, privateMode: false,
    proxyEnabled: false, proxyUrl: 'http://localhost:8787', proxyToken: '', proxyAuto: true, iframeWhenPossible: true,
  } as Settings,
  defaultBookmarks: [
    ['Google', 'https://www.google.com'], ['YouTube', 'https://www.youtube.com'],
    ['Wikipédia', 'https://fr.wikipedia.org'], ['Gmail', 'https://mail.google.com'],
    ['GitHub', 'https://github.com'], ['Notion', 'https://www.notion.so'],
  ] as [string, string][],
};
