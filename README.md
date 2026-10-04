# Ras les boules

Gestion de tournois de tennis de table (Electron + React + TypeScript + shadcn/ui).

## Scripts

| Commande            | Rôle                                          |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Lance l'app avec rechargement à chaud         |
| `npm run build`     | Compile main, preload et renderer dans `out/` |
| `npm start`         | Lance la version compilée                     |
| `npm run typecheck` | Vérifie les types                             |
| `npm run lint`      | ESLint                                        |
| `npm run format`    | Prettier                                      |
| `npm test`          | Tests Vitest (logique métier)                 |
| `npm run dist`      | Build + installeur de l'OS courant (`dist/`)  |

## Structure

- `src/main` : process Electron, base SQLite (`db.ts`), IPC.
- `src/preload` : expose `window.rlb` (`load` / `save`).
- `src/shared` : types partagés main ↔ renderer.
- `src/renderer`
  - `domain/` : logique métier pure et testée (appariement, score, handicap, progression…).
  - `features/` : un dossier par fonctionnalité (écrans, dialogues, `slice.ts` du store).
  - `stores/` : store Zustand (assemblage des slices), persistance vers SQLite, données de démo.
  - `components/` : composants partagés ; `components/ui/` = shadcn (ajout : `npx shadcn@latest add <composant>`).
  - `styles/globals.css` : Tailwind v4 + tokens de marque + thème clair/sombre.

## Release et mise à jour automatique

### Publier une version

1. Mettre à jour `version` dans `package.json` (ex. `0.2.0`), commit et push.
2. Créer et pousser le tag correspondant : `git tag v0.2.0 && git push origin v0.2.0`
   (ou créer la release depuis GitHub sur ce tag).
3. Le workflow `.github/workflows/release.yml` build en parallèle sur macOS, Windows et Linux, puis
   `electron-builder --publish always` attache à la release du tag :
   - macOS : `.dmg` + `.zip`, Windows : `.exe` (NSIS), Linux : `.AppImage`
   - `latest.yml`, `latest-mac.yml`, `latest-linux.yml` (lus par electron-updater).

La version du `package.json` **doit** correspondre au tag : c'est elle qu'electron-updater compare.

### Côté application

- `src/main/updater.ts` : au démarrage (app packagée uniquement), `electron-updater` interroge la
  dernière release GitHub. `autoDownload` est désactivé : le téléchargement est déclenché par l'utilisateur.
- IPC : le main pousse `update:state` (`idle | available | downloading | ready`) ; le renderer envoie
  `update:download` et `update:install`. Exposé via `window.rlb.onUpdate / downloadUpdate / installUpdate`.
- `AppSidebar.tsx` (`UpdateButton`) : bouton « Télécharger la vX » → progression → « Redémarrer et installer ».
  Invisible tant qu'aucune mise à jour n'est disponible.

- Le libellé de version de la sidebar est injecté au build depuis `package.json` (`__APP_VERSION__`, via `define` dans `electron.vite.config.ts`).

### Limites connues

- Pas de signature de code : Windows affichera SmartScreen, et **l'auto-update macOS exige une app signée
  et notarisée** (certificat Apple Developer + secrets `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_*` dans le workflow).
  Windows et Linux fonctionnent sans.
- Le test réel nécessite deux releases : installer la v0.x, publier la v0.x+1, relancer l'app.
