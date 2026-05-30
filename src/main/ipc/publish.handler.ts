import { ipcMain } from 'electron'
import { IPC } from '../../shared/constants/ipc'
import { publishService } from '../services/publish.service'

export function registerPublishHandlers(): void {
  ipcMain.handle(IPC.POST_LIST, () => publishService.listPosts())
  ipcMain.handle(IPC.POST_CREATE, (_e, title: string, content: string) =>
    publishService.createPost(title, content))
  ipcMain.handle(IPC.POST_UPDATE, (_e, id: number, title: string, content: string) =>
    publishService.updatePost(id, title, content))
  ipcMain.handle(IPC.POST_DELETE, (_e, id: number) => publishService.deletePost(id))

  ipcMain.handle(IPC.PUBLISH_CREATE, (_e, postId: number, accountIds: number[], imagePaths?: string[]) =>
    publishService.publish(postId, accountIds, imagePaths))

  ipcMain.handle(IPC.TASK_LIST, () => publishService.listTasks())
  ipcMain.handle(IPC.TASK_RETRY, (_e, taskId: number) => publishService.retryTask(taskId))

  ipcMain.handle(IPC.LOG_LIST, () => publishService.allLogs())
}
