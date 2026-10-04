import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { UpdateState } from '@shared/types'

export function initUpdater(win: BrowserWindow): void {
  if (!app.isPackaged) return // pas de latest.yml en dev
  const send = (s: UpdateState): void => win.webContents.send('update:state', s)

  autoUpdater.autoDownload = false
  autoUpdater.on('update-available', (i) => send({ status: 'available', version: i.version }))
  autoUpdater.on('download-progress', (p) => send({ status: 'downloading', percent: p.percent }))
  autoUpdater.on('update-downloaded', () => send({ status: 'ready' }))
  autoUpdater.on('error', (e) => console.error('[updater]', e))

  ipcMain.on('update:download', () => void autoUpdater.downloadUpdate())
  ipcMain.on('update:install', () => autoUpdater.quitAndInstall())

  void autoUpdater.checkForUpdates()
}
