import { getDb } from './db'
import type { Task, PublishLog } from '../../shared/types'

export const taskRepo = {
  list(): Task[] {
    return getDb()
      .prepare('SELECT * FROM tasks ORDER BY created_at DESC')
      .all() as Task[]
  },

  listLogs(taskId: number): PublishLog[] {
    return getDb()
      .prepare('SELECT * FROM publish_logs WHERE task_id=? ORDER BY created_at ASC')
      .all(taskId) as PublishLog[]
  },

  allLogs(): PublishLog[] {
    return getDb()
      .prepare('SELECT * FROM publish_logs ORDER BY created_at DESC LIMIT 200')
      .all() as PublishLog[]
  }
}
