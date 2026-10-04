import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { load, openDb, save } from './db'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Ras les boules',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
    },
  })
  if (process.env['ELECTRON_RENDERER_URL']) win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  else win.loadFile(join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(() => {
  openDb()
  ipcMain.on('db:load', (e) => {
    e.returnValue = load()
  })
  ipcMain.on('db:save', (_e, slices) => save(slices))
  createWindow()
})

app.on('window-all-closed', () => app.quit())
