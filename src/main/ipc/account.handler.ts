import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/ipc'
import { accountService } from '../services/account.service'

export function registerAccountHandlers(): void {
  ipcMain.handle(IPC.ACCOUNT_LIST, () => accountService.list())
  ipcMain.handle(IPC.ACCOUNT_ADD, (_event, name: string, platform?: string) => accountService.add(name, (platform as 'xiaohongshu' | 'douyin') ?? 'xiaohongshu'))
  ipcMain.handle(IPC.ACCOUNT_DELETE, (_event, id: number) => accountService.delete(id))
  ipcMain.handle(IPC.ACCOUNT_LOGIN, (_event, id: number) => accountService.startLogin(id))
}
