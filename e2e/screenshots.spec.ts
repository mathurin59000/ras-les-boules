// Regenerates the screenshots of the GitHub page: `npm run docs:screenshots`
import { expect, test, type Page } from '@playwright/test'
import {
  closeApp,
  createTournament,
  launchApp,
  playAllMatches,
  registerPlayers,
  startTournament,
} from './helpers'
import type { Dataset } from './fixtures/datasets'

test.skip(!process.env.DOCS_SCREENSHOTS, 'only run by npm run docs:screenshots')

const OUT = 'docs/img'
const ds: Dataset = {
  name: 'Open de Noël 2026',
  players: [
    ['Léa', 'Martin', 1850],
    ['Hugo', 'Bernard', 1720],
    ['Sam', 'Durand', 1650],
    ['Inès', 'Robert', 1580],
    ['Tom', 'Petit', 1490],
    ['Clara', 'Vidal', 1410],
    ['Noé', 'Faure', 1330],
    ['Zoé', 'Roux', 1250],
  ],
  rounds: 4,
  handicap: true,
  byes: 0,
  maxRematches: 0,
}

// let the page animations settle before shooting
const shot = async (page: Page, name: string) => {
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

test('captures de la page de présentation', async () => {
  test.setTimeout(240_000)
  const { app, page } = await launchApp()
  try {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addStyleTag({ content: '[data-sonner-toaster]{display:none!important}' })

    await page.getByRole('button', { name: 'Nouveau tournoi' }).first().click()
    await page.getByLabel('Nom du tournoi').fill(ds.name)
    await page.getByRole('button', { name: 'Suivant' }).click()
    await expect(page.getByText('Handicap au classement')).toBeVisible()
    await shot(page, 'wizard')
    await page.keyboard.press('Escape')

    await createTournament(page, ds.name, ds)
    await registerPlayers(page, ds)
    await startTournament(page)

    // round 1 played, two round-2 matches started, the rest waiting
    const section = (t: string) =>
      page.locator('section', { has: page.getByRole('heading', { name: t }) })
    const finishFirstLive = async () => {
      await section('Matchs en cours').getByTestId('match-card').first().click()
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('radio').first().click()
      await dialog.getByRole('spinbutton').fill(String(8 + Math.floor(Math.random() * 15)))
      await dialog.getByRole('button', { name: 'Confirmer' }).click()
      await expect(dialog).toBeHidden()
    }
    const startFirstPending = async () => {
      await section('Matchs à lancer').getByTestId('match-card').first().click()
      const confirm = page.getByRole('alertdialog')
      await confirm.getByRole('button', { name: 'Confirmer' }).click()
      await expect(confirm).toBeHidden()
    }
    for (let i = 0; i < 4; i++) {
      await startFirstPending()
      await finishFirstLive()
    }
    await startFirstPending()
    await startFirstPending()
    await page.waitForTimeout(600)
    await shot(page, 'overview')

    await page.getByRole('tab', { name: 'Classement' }).click()
    await expect(page.getByRole('columnheader', { name: 'Joueur' })).toBeVisible()
    await shot(page, 'ranking')

    await page.getByRole('tab', { name: 'Historique' }).click()
    await expect(page.getByRole('columnheader', { name: 'Match' })).toBeVisible()
    await shot(page, 'history')

    await page.getByRole('tab', { name: /^Overview/ }).click()
    await playAllMatches(page)
    await expect(page.getByRole('button', { name: 'Exporter les résultats' })).toBeVisible()
    await page.getByRole('button', { name: 'Exporter les résultats' }).click()
    await expect(page.getByLabel('Texte du classement')).toBeVisible()
    await page.waitForTimeout(400)
    await shot(page, 'export')
  } finally {
    await closeApp(app)
  }
})
