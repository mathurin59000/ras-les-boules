import { contextBridge, ipcRenderer } from 'electron'
import type { RlbApi, UpdateState } from '@shared/types'

const api: RlbApi = {
  load: () => ipcRenderer.sendSync('db:load'),
  save: (slices) => ipcRenderer.send('db:save', slices),
  onUpdate: (cb) => {
    const h = (_e: unknown, state: UpdateState): void => cb(state)
    ipcRenderer.on('update:state', h)
    return () => ipcRenderer.removeListener('update:state', h)
  },
  downloadUpdate: () => ipcRenderer.send('update:download'),
  installUpdate: () => ipcRenderer.send('update:install'),
}

contextBridge.exposeInMainWorld('rlb', api)
