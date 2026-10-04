# Ras les boules

Gestion de tournois de tennis de table (Electron + React + TypeScript + shadcn/ui).

## Scripts

| Commande            | Rôle                                         |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Lance l'app avec rechargement à chaud        |
| `npm run build`     | Compile main, preload et renderer dans `out/` |
| `npm start`         | Lance la version compilée                    |
| `npm run typecheck` | Vérifie les types                            |
| `npm run lint`      | ESLint                                       |
| `npm run format`    | Prettier                                     |
| `npm test`          | Tests Vitest (logique métier)                |

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
