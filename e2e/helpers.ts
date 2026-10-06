import {
  _electron as electron,
  expect,
  type ElectronApplication,
  type Page,
} from '@playwright/test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Dataset } from './fixtures/datasets'

export const newUserDataDir = () => mkdtempSync(join(tmpdir(), 'rlb-e2e-'))

/** Launches the built app (run `electron-vite build` first) on an isolated database. */
export async function launchApp(userDataDir = newUserDataDir()) {
  // set by some hosts (VS Code, Claude Code): it would make Electron behave like plain Node
  const env = { ...process.env } as Record<string, string>
  delete env.ELECTRON_RUN_AS_NODE
  const app = await electron.launch({
    args: ['.', `--user-data-dir=${userDataDir}`, ...(process.env.CI ? ['--no-sandbox'] : [])],
    env,
  })
  const page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  return { app, page, userDataDir }
}

export async function closeApp(app: ElectronApplication) {
  await app.close()
}

export async function createTournament(page: Page, name: string, ds: Dataset) {
  await page
    .getByRole('button', { name: /nouveau tournoi|créer un tournoi/i })
    .first()
    .click()
  await page.getByLabel('Nom du tournoi').fill(name)
  await page.getByRole('button', { name: 'Suivant' }).click()
  const row = (label: string) => page.getByText(label, { exact: true }).locator('..')
  if (ds.handicap) await row('Activé').getByRole('switch').click()
  await row('Valeur').getByRole('spinbutton').fill(String(ds.rounds))
  await page.getByRole('button', { name: 'Créer le tournoi' }).click()
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
}

export async function registerPlayers(page: Page, ds: Dataset) {
  await page.getByRole('button', { name: 'Inscrire des joueurs' }).first().click()
  const dialog = page.getByRole('dialog')
  for (const [first, last, points] of ds.players) {
    await dialog.getByLabel('Prénom').fill(first)
    await dialog.getByLabel('Nom', { exact: true }).fill(last)
    await dialog.getByRole('spinbutton').fill(String(points))
    await dialog.getByRole('button', { name: 'Ajouter à la liste' }).click()
  }
  await dialog.getByRole('button', { name: 'Terminer' }).click()
}

export async function startTournament(page: Page) {
  await page.getByRole('button', { name: 'Démarrer le tournoi' }).click()
  await page.getByRole('button', { name: "J'ai compris" }).click()
}

/** Starts / finishes matches one by one (first player always wins) until nothing is left to play. */
export async function playAllMatches(page: Page, max = 200): Promise<number> {
  await page.getByRole('tab', { name: /^Overview/ }).click()
  const section = (title: string) =>
    page.locator('section', { has: page.getByRole('heading', { name: title }) })
  const live = section('Matchs en cours').getByTestId('match-card')
  const pending = section('Matchs à lancer').getByTestId('match-card')
  let played = 0
  for (let i = 0; i < max; i++) {
    if (await live.count()) {
      await live.first().click()
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('radio').first().click()
      await dialog.getByRole('spinbutton').fill(String(5 + (played % 20)))
      await dialog.getByRole('button', { name: 'Confirmer' }).click()
      await expect(dialog).toBeHidden()
      played++
    } else if (await pending.count()) {
      await pending.first().click()
      const confirm = page.getByRole('alertdialog')
      await confirm.getByRole('button', { name: 'Confirmer' }).click()
      await expect(confirm).toBeHidden()
    } else {
      // cards re-render right after the dialog closes: make sure nothing is left before stopping
      await page.waitForTimeout(400)
      if (!(await live.count()) && !(await pending.count())) break
    }
  }
  return played
}

export interface HistoryRow {
  round: number
  match: string
  score: string
  status: string
}

export async function readHistory(page: Page): Promise<HistoryRow[]> {
  await page.getByRole('tab', { name: 'Historique' }).click()
  await expect(page.getByRole('columnheader', { name: 'Match' })).toBeVisible()
  const rows = page.locator('tbody tr')
  await expect(rows.first()).toBeVisible()
  return rows.evaluateAll((trs) =>
    trs.map((tr) => {
      const c = [...tr.querySelectorAll('td')].map((td) => td.textContent?.trim() ?? '')
      return { round: Number(c[1].replace(/\D/g, '')), match: c[2], score: c[3], status: c[4] }
    }),
  )
}

export async function readRanking(page: Page) {
  await page.getByRole('tab', { name: 'Classement' }).click()
  await expect(page.getByRole('columnheader', { name: 'Joueur' })).toBeVisible()
  const rows = page.locator('tbody tr')
  await expect(rows.first()).toBeVisible()
  return rows.evaluateAll((trs) =>
    trs.map((tr) => {
      const c = [...tr.querySelectorAll('td')].map((td) => td.textContent?.trim() ?? '')
      const name =
        tr.querySelector('td:nth-child(2) .flex')?.lastElementChild?.textContent?.trim() ?? ''
      return { name, wins: Number(c[2]), losses: Number(c[3]), points: Number(c[5]) }
    }),
  )
}
