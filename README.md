# NOVA — navigateur web personnel

Application React + TypeScript + Vite, données en `localStorage`, proxy optionnel (Node, sans dépendance).
**Aucune dépendance à Base44 ou à Claude.**

## Lancer en local
```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # vérification TypeScript
npm run build        # génère dist/
```

## Proxy (optionnel)
```bash
PROXY_TOKEN="une-longue-phrase-secrete" npm run proxy     # :8787
```
Puis dans NOVA → Menu → Paramètres → Proxy : activer, adresse `http://localhost:8787`, coller le jeton, « Tester la connexion ».

### Fonctionnement
1. NOVA appelle `GET /check?url=…&token=…` : le serveur valide l'URL, récupère les en-têtes du site.
2. Si le site **interdit** son affichage (X-Frame-Options / `frame-ancestors`), NOVA propose l'ouverture externe. Cette restriction est respectée, jamais contournée.
3. Sinon : iframe directe (par défaut) ou `GET /proxy?url=…` (HTML récupéré, `<base>` ajouté pour que CSS/images se chargent depuis le site, clics interceptés pour rester dans NOVA).
4. Proxy désactivé ou serveur injoignable : NOVA tente l'iframe directe et affiche un avertissement honnête.

### Sécurité du proxy
Jeton obligatoire (pas de relais public) · CORS limité à `ALLOWED_ORIGINS` · blocage des IP privées/loopback/link-local (SSRF), redirections revalidées · ports 80/443 uniquement · HTML uniquement · 5 Mo max · délai 10 s · 60 requêtes/min/IP · aucun cookie transmis · page proxifiée dans une iframe `sandbox` sans `allow-same-origin`.
**Limites connues :** le jeton passe dans l'URL (utile pour l'iframe) ; une attaque par « DNS rebinding » reste théoriquement possible entre la validation DNS et la requête ; les sites très dynamiques (YouTube, TikTok, Instagram, Reddit…) ne fonctionneront pas correctement et beaucoup interdisent l'affichage en iframe : NOVA l'indique et propose l'ouverture externe.

## Déployer gratuitement
**Frontend** (Cloudflare Pages, Netlify ou Vercel) : pousse ce dossier sur GitHub, connecte le dépôt, commande `npm run build`, dossier de sortie `dist`.
**Backend** (Render, Fly.io…) : service Node, commande `node proxy.mjs`, variables `PROXY_TOKEN` et `ALLOWED_ORIGINS` (= l'URL de ton site NOVA). Le site NOVA est en HTTPS : l'adresse du proxy doit l'être aussi (fournie par l'hébergeur).

## Modifier / ajouter une fonctionnalité
- Nom, défauts, moteurs, favoris de départ, fonctionnalités actives : `src/config.ts`.
- Un réglage : ajoute le champ dans `Settings` (`src/types.ts`) et `defaultSettings`, puis une ligne dans `SettingsPage.tsx`.
- Un panneau : crée `src/components/panels/MonPanneau.tsx`, ajoute son nom dans `View` (`types.ts`), une entrée dans `Toolbar.tsx` (menu) et une ligne dans `App.tsx`.
- Retirer le proxy : `features.proxy = false` dans `config.ts`.

## Structure
`src/components/{browser,home,panels}` interface · `src/hooks` persistance · `src/services/proxy.ts` client proxy · `src/utils/url.ts` détection URL/recherche · `server/proxy.mjs` backend.

## Pas encore fait
Dossiers d'onglets mémorisés (chaque onglet se recharge au changement), glisser-déposer des favoris (boutons ↑↓ à la place), import/export des favoris, raccourcis clavier, extensions, synchronisation, mots de passe. Les icônes de sites viennent de `icons.duckduckgo.com` (l'hôte visité leur est transmis).
