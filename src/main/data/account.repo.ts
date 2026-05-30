import { getDb } from './db'
import type { Account } from '../../shared/types'

export const accountRepo = {
  list(): Account[] {
    return getDb().prepare('SELECT * FROM accounts ORDER BY created_at DESC').all() as Account[]
  },

  findById(id: number): Account | undefined {
    return getDb().prepare('SELECT * FROM accounts WHERE id = ?').get(id) as Account | undefined
  },

  create(name: string, platform: Account['platform'] = 'xiaohongshu'): Account {
    const result = getDb()
      .prepare('INSERT INTO accounts (name, platform) VALUES (?, ?) RETURNING *')
      .get(name, platform) as Account
    return result
  },

  updateStatus(id: number, status: Account['status']): void {
    getDb()
      .prepare("UPDATE accounts SET status = ? WHERE id = ?")
      .run(status, id)
  },

  delete(id: number): void {
    getDb().prepare('DELETE FROM accounts WHERE id = ?').run(id)
  }
}
