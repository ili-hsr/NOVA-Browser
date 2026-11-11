import { useEffect, useState } from 'react';
/** useState sauvegardé dans localStorage. Les objets sont fusionnés avec les valeurs par défaut. */
export function usePersistentState<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const p = JSON.parse(raw);
      return initial && typeof initial === 'object' && !Array.isArray(initial) ? { ...initial, ...p } : p;
    } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* quota / mode privé */ } }, [key, v]);
  return [v, setV] as const;
}
