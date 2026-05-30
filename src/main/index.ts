import { app, BrowserWindow, globalShortcut } from 'electron'
import path from 'path'
import log from 'electron-log'
import { getDb } from './data/db'
import { registerAllHandlers } from './ipc'
import { accountService } from './services/account.service'
import { taskQueue } from './core/task-queue'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  log.initialize()
  getDb()
  registerAllHandlers()
  createWindow()
  globalShortcut.register('F12', () => {
    BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools()
  })
  // 启动时恢复已登录账号的 Cookie
  await accountService.restoreAllSessions()
  taskQueue.resumePending()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
