import { accountRepo } from '../data/account.repo'
import { getDb } from '../data/db'
import { puppeteerEngine } from '../core/puppeteer/engine'
import { xiaohongshuAdapter } from '../core/platforms/xiaohongshu.adapter'
import { douyinAdapter } from '../core/platforms/douyin.adapter'
import type { Account } from '../../shared/types'
import log from 'electron-log'

export const accountService = {
  list(): Account[] {
    return accountRepo.list()
  },

  add(name: string, platform: Account['platform'] = 'xiaohongshu'): Account {
    if (!name.trim()) throw new Error('账号名称不能为空')
    return accountRepo.create(name.trim(), platform)
  },

  delete(id: number): void {
    const db = getDb()
    db.prepare(`DELETE FROM publish_logs WHERE task_id IN (SELECT id FROM tasks WHERE account_id=?)`).run(id)
    db.prepare(`DELETE FROM tasks WHERE account_id=?`).run(id)
    accountRepo.delete(id)
  },

  async startLogin(id: number): Promise<{ success: boolean; error?: string }> {
    const account = accountRepo.findById(id)
    if (!account) throw new Error('账号不存在')

    accountRepo.updateStatus(id, 'logged_out')
    const ctx = await puppeteerEngine.acquireContext(id)
    const adapter = account.platform === 'douyin' ? douyinAdapter : xiaohongshuAdapter

    const result = await adapter.login(ctx, id)
    accountRepo.updateStatus(id, result.success ? 'logged_in' : 'error')
    if (result.success) {
      log.info(`Account ${id} (${account.platform}) logged in`)
    }
    return result
  },

  async restoreAllSessions(): Promise<void> {
    // userDataDir 持久化 session，无需恢复
  }
}
