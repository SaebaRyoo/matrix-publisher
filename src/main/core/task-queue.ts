import { getDb } from '../data/db'
import { accountRepo } from '../data/account.repo'
import { puppeteerEngine } from './puppeteer/engine'
import { xiaohongshuAdapter } from './platforms/xiaohongshu.adapter'
import { douyinAdapter } from './platforms/douyin.adapter'
import type { PlatformAdapter } from './platforms/adapter.interface'
import type { Task } from '../../shared/types'
import log from 'electron-log'

// 并发为 1：避免多账号同时操作被风控
let running = false
const pending: (() => Promise<void>)[] = []

const queue = {
  add(fn: () => Promise<void>) {
    pending.push(fn)
    if (!running) drain()
  }
}

async function drain() {
  running = true
  while (pending.length > 0) {
    await pending.shift()!().catch(() => {})
  }
  running = false
}

// 用户上传的图片路径（内存中，不持久化）
const uploadedImages = new Map<number, string[]>()

export const taskQueue = {
  // 创建任务并入队
  enqueue(postId: number, accountIds: number[], imagePaths?: string[]): Task[] {
    const db = getDb()
    const tasks: Task[] = []

    for (const accountId of accountIds) {
      const task = db
        .prepare(
          `INSERT INTO tasks (post_id, account_id, status)
           VALUES (?, ?, 'pending') RETURNING *`
        )
        .get(postId, accountId) as Task
      tasks.push(task)
      if (imagePaths && imagePaths.length > 0) {
        uploadedImages.set(task.id, [...imagePaths])
      }
      queue.add(() => runTask(task.id))
    }

    return tasks
  },

  // 手动重试失败任务
  retry(taskId: number): void {
    getDb()
      .prepare(
        `UPDATE tasks SET status='pending', error=NULL, updated_at=datetime('now') WHERE id=?`
      )
      .run(taskId)
    queue.add(() => runTask(taskId))
  },

  // 启动时恢复 pending 任务
  resumePending(): void {
    const pending = getDb()
      .prepare(`SELECT * FROM tasks WHERE status IN ('pending','running')`)
      .all() as Task[]

    // 把 running 重置为 pending（上次异常退出）
    getDb().prepare(`UPDATE tasks SET status='pending' WHERE status='running'`).run()

    for (const task of pending) {
      queue.add(() => runTask(task.id))
    }
    if (pending.length > 0) log.info(`Resumed ${pending.length} pending tasks`)
  }
}

async function runTask(taskId: number): Promise<void> {
  const db = getDb()

  const task = db.prepare('SELECT * FROM tasks WHERE id=?').get(taskId) as Task | undefined
  if (!task || task.status === 'success') return

  setStatus(taskId, 'running')
  addLog(taskId, `开始执行任务 #${taskId}`, 'info')

  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(task.post_id) as
    | { title: string; content: string }
    | undefined

  if (!post) {
    return fail(taskId, '找不到对应的文章')
  }

  const account = accountRepo.findById(task.account_id)
  if (!account) return fail(taskId, '找不到对应的账号')

  try {
    const adapter: PlatformAdapter =
      account.platform === 'douyin' ? douyinAdapter : xiaohongshuAdapter
    const browser = await puppeteerEngine.acquireBrowser(task.account_id)
    const publishCtx = browser.defaultBrowserContext()

    const userImages = uploadedImages.get(taskId)
    if (!userImages || userImages.length === 0) {
      return fail(taskId, '请先上传图片再发布')
    }
    const imagePaths = userImages
    uploadedImages.delete(taskId)

    addLog(
      taskId,
      `正在发布到${account.platform === 'douyin' ? '抖音' : '小红书'}账号「${account.name}」...`,
      'info'
    )
    const result = await adapter.publish(
      publishCtx,
      {
        title: post.title,
        body: post.content.slice(0, 1000),
        images: imagePaths
      },
      task.account_id
    )

    if (result.success) {
      setStatus(taskId, 'success')
      addLog(taskId, `发布成功${result.url ? '：' + result.url : ''}`, 'info')
    } else if (result.error === 'COOKIE_EXPIRED') {
      accountRepo.updateStatus(task.account_id, 'logged_out')
      fail(taskId, 'Cookie 已失效，请重新扫码登录')
    } else {
      fail(taskId, result.error ?? '发布失败')
    }
  } catch (e) {
    fail(taskId, e instanceof Error ? e.message : String(e))
  }
}

function setStatus(taskId: number, status: Task['status']): void {
  getDb()
    .prepare(`UPDATE tasks SET status=?, updated_at=datetime('now') WHERE id=?`)
    .run(status, taskId)
}

function fail(taskId: number, error: string): void {
  getDb()
    .prepare(`UPDATE tasks SET status='failed', error=?, updated_at=datetime('now') WHERE id=?`)
    .run(error, taskId)
  addLog(taskId, `失败：${error}`, 'error')
  log.error(`Task ${taskId} failed:`, error)
}

function addLog(taskId: number, message: string, level: 'info' | 'warn' | 'error'): void {
  getDb()
    .prepare(`INSERT INTO publish_logs (task_id, message, level) VALUES (?, ?, ?)`)
    .run(taskId, message, level)
}
