import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/constants/ipc'

contextBridge.exposeInMainWorld('api', {
  invoke: <T>(channel: string, ...args: unknown[]): Promise<T> =>
    ipcRenderer.invoke(channel, ...args),
  IPC
})
