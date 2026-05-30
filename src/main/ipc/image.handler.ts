import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IPC } from '../../shared/constants/ipc'
import fs from 'fs'
import path from 'path'

export interface ImageInfo {
  id: string
  path: string
  base64: string
}

export function registerImageHandlers(): void {
  ipcMain.handle(IPC.IMAGE_SELECT, async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }]
    })
    if (result.canceled) return []

    return result.filePaths.map((filePath) => {
      const ext = path.extname(filePath).slice(1)
      const mime = ext === 'jpg' ? 'jpeg' : ext
      const data = fs.readFileSync(filePath)
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        path: filePath,
        base64: `data:image/${mime};base64,${data.toString('base64')}`
      } as ImageInfo
    })
  })
}
