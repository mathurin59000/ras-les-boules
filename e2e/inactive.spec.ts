import { expect, test, type Page } from '@playwright/test'
import { DATASETS } from './fixtures/datasets'
import { closeApp, createTournament, launchApp, registerPlayers, startTournament } from './helpers'

const section = (page: Page, title: string) =>
  page.locator('section', { has: page.getByRole('heading', { name: title }) })

async function setInactive(page: Page, name: string) {
  await page.getByRole('tab', { name: 'Joueurs' }).click()
  await page.getByText(name, { exact: true }).click()
  await page.getByRole('dialog').getByRole('switch').click()
  await page.getByRole('button', { name: 'Sauvegarder' }).click()
  await page.getByRole('tab', { name: /^Overview/ }).click()
}

test('un joueur inactif sort de la boucle (match à lancer, en cours, en attente)', async () => {
  const ds = DATASETS[0] // Léa 1900 – Inès 1540, Hugo 1780 – Tom 1420, Sam 1660 – Clara 1300
  const { app, page } = await launchApp()
  try {
    await createTournament(page, 'Inactifs', ds)
    await registerPlayers(page, ds)
    await startTournament(page)
    const toStart = section(page, 'Matchs à lancer').getByTestId('match-card')
    const live = section(page, 'Matchs en cours').getByTestId('match-card')
    const waiting = section(page, "Joueurs en attente d'un adversaire")
    await expect(toStart).toHaveCount(3)

    // 1. inactive while his match is still to start: the match disappears, the opponent waits
    await setInactive(page, 'Léa Martin')
    await expect(toStart).toHaveCount(2)
    await expect(section(page, 'Matchs à lancer')).not.toContainText('Léa')
    await expect(waiting).toContainText('Inès Robert')
    await expect(waiting).not.toContainText('Léa')

    // 2. inactive while playing: the match goes on, but he does not come back afterwards
    await toStart.filter({ hasText: 'Hugo' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmer' }).click()
    await expect(live).toHaveCount(1)
    await setInactive(page, 'Hugo Bernard')
    await expect(live).toHaveCount(1)
    await live.first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('radio').first().click()
    await dialog.getByRole('button', { name: 'Confirmer' }).click()
    await expect(dialog).toBeHidden()
    await expect(waiting).toContainText('Tom Petit')
    await expect(waiting).not.toContainText('Hugo')
    await expect(section(page, 'Matchs à lancer')).not.toContainText('Hugo')

    // 3. removed from the tournament while his match is booked: same thing
    await page.getByRole('tab', { name: 'Joueurs' }).click()
    await page
      .locator('div.cursor-pointer', { hasText: 'Sam Durand' })
      .getByRole('button', { name: 'Retirer le joueur' })
      .click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Retirer' }).click()
    await page.getByRole('tab', { name: /^Overview/ }).click()
    await expect(section(page, 'Matchs à lancer')).not.toContainText('Sam')
    // his opponent gets the round off (exemption) and the free players meet each other
    await expect(toStart.filter({ hasText: 'Inès' })).toContainText('Clara')
    await expect(waiting).not.toContainText('Sam')
    await expect(page.getByTestId('match-card').filter({ hasText: 'Sam' })).toHaveCount(0)
  } finally {
    await closeApp(app)
  }
})
