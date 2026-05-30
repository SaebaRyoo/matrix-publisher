import { postRepo } from '../data/post.repo'
import { taskRepo } from '../data/task.repo'
import { taskQueue } from '../core/task-queue'
import { getDb } from '../data/db'
import type { Post, Task, PublishLog } from '../../shared/types'

export const publishService = {
  // 文章 CRUD
  listPosts(): Post[] { return postRepo.list() },
  createPost(title: string, content: string): Post { return postRepo.create(title, content) },
  updatePost(id: number, title: string, content: string): void { postRepo.update(id, title, content) },
  deletePost(id: number): void {
    const db = getDb()
    db.prepare('DELETE FROM publish_logs WHERE task_id IN (SELECT id FROM tasks WHERE post_id=?)').run(id)
    db.prepare('DELETE FROM tasks WHERE post_id=?').run(id)
    postRepo.delete(id)
  },

  // 发布：创建任务并入队
  publish(postId: number, accountIds: number[], imagePaths?: string[]): Task[] {
    if (accountIds.length === 0) throw new Error('请至少选择一个账号')
    return taskQueue.enqueue(postId, accountIds, imagePaths)
  },

  // 任务查询
  listTasks(): Task[] { return taskRepo.list() },
  retryTask(taskId: number): void { taskQueue.retry(taskId) },

  // 日志查询
  allLogs(): PublishLog[] { return taskRepo.allLogs() },
  taskLogs(taskId: number): PublishLog[] { return taskRepo.listLogs(taskId) }
}
