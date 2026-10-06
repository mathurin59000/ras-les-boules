import { expect, test } from '@playwright/test'
import { DATASETS } from './fixtures/datasets'
import {
  closeApp,
  createTournament,
  launchApp,
  readHistory,
  registerPlayers,
  startTournament,
} from './helpers'

test('les données survivent à un redémarrage', async () => {
  const ds = DATASETS[0]
  const first = await launchApp()
  await createTournament(first.page, 'Persistance', ds)
  await registerPlayers(first.page, ds)
  await startTournament(first.page)
  await first.page.getByTestId('match-card').first().click()
  await first.page.getByRole('alertdialog').getByRole('button', { name: 'Confirmer' }).click()
  await expect(first.page.getByText('Aucun match en cours')).toBeHidden()
  const before = await readHistory(first.page)
  await closeApp(first.app)

  const second = await launchApp(first.userDataDir)
  try {
    await second.page.getByText('Persistance').first().click()
    await expect(second.page.getByRole('heading', { level: 1, name: 'Persistance' })).toBeVisible()
    await expect(second.page.getByText('Aucun match en cours')).toBeHidden()
    expect(await readHistory(second.page)).toEqual(before)
  } finally {
    await closeApp(second.app)
  }
})
