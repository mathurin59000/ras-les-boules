import { expect, test } from '@playwright/test'
import { DATASETS } from './fixtures/datasets'
import {
  closeApp,
  createTournament,
  launchApp,
  playAllMatches,
  readHistory,
  readRanking,
  registerPlayers,
  startTournament,
} from './helpers'

for (const ds of DATASETS) {
  test(`tournoi complet : ${ds.name}`, async () => {
    const { app, page } = await launchApp()
    try {
      await createTournament(page, ds.name, ds)
      await registerPlayers(page, ds)
      await startTournament(page)
      await expect(page.getByText('Tour 1').first()).toBeVisible()

      await playAllMatches(page)
      // end condition reached: the tournament closes itself
      await expect(page.getByText('Terminé', { exact: true }).first()).toBeVisible()

      const history = await readHistory(page)
      expect(history.every((h) => h.status === 'Terminé')).toBe(true)

      // every player plays every round (a bye counts as a played round)
      const byes = history.filter((h) => h.match.includes('exemption'))
      expect(byes).toHaveLength(ds.byes)
      const real = history.filter((h) => !h.match.includes('exemption'))
      expect(real.length).toBe(((ds.players.length - ds.byes / ds.rounds) / 2) * ds.rounds)

      // rematches stay within the tolerated bound
      const pairs = real.map((h) => h.match.split(' vs ').sort().join('|'))
      expect(pairs.length - new Set(pairs).size).toBeLessThanOrEqual(ds.maxRematches)

      // history is newest first: rounds never increase going down
      const rounds = history.map((h) => h.round)
      expect(rounds).toEqual([...rounds].sort((a, b) => b - a))

      // ranking wins/losses match what the history says (first player named always wins)
      const wins = new Map<string, number>()
      const losses = new Map<string, number>()
      for (const h of real) {
        const [w, l] = h.match.split(' vs ')
        wins.set(w, (wins.get(w) ?? 0) + 1)
        losses.set(l, (losses.get(l) ?? 0) + 1)
      }
      for (const b of byes) {
        const n = b.match.split(' — ')[0]
        wins.set(n, (wins.get(n) ?? 0) + 1)
      }
      const ranking = await readRanking(page)
      expect(ranking).toHaveLength(ds.players.length)
      for (const r of ranking) {
        expect(r.wins, `${r.name} victoires`).toBe(wins.get(r.name) ?? 0)
        expect(r.losses, `${r.name} défaites`).toBe(losses.get(r.name) ?? 0)
        expect(r.points).toBe(r.wins * 3)
      }
      const order = ranking.map((r) => r.wins)
      expect(order).toEqual([...order].sort((a, b) => b - a))
    } finally {
      await closeApp(app)
    }
  })
}
