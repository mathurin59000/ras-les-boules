import { contextBridge, ipcRenderer } from 'electron'
import type { RlbApi } from '@shared/types'

const api: RlbApi = {
  load: () => ipcRenderer.sendSync('db:load'),
  save: (slices) => ipcRenderer.send('db:save', slices),
}

contextBridge.exposeInMainWorld('rlb', api)
