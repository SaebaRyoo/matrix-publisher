import { getDb } from '../data/db'
import { encrypt, decrypt } from '../utils/crypto'
import type { CookieData } from 'puppeteer-core'

export const cookieVault = {
  save(accountId: number, cookies: CookieData[]): void {
    const json = JSON.stringify(cookies)
    const { iv, authTag, ciphertext } = encrypt(json)
    getDb()
      .prepare(`
        INSERT INTO cookie_vault (account_id, ciphertext, iv, auth_tag)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(account_id) DO UPDATE SET
          ciphertext = excluded.ciphertext,
          iv = excluded.iv,
          auth_tag = excluded.auth_tag,
          updated_at = datetime('now')
      `)
      .run(accountId, ciphertext, iv, authTag)
  },

  load(accountId: number): CookieData[] | null {
    const row = getDb()
      .prepare('SELECT ciphertext, iv, auth_tag FROM cookie_vault WHERE account_id = ?')
      .get(accountId) as { ciphertext: string; iv: string; auth_tag: string } | undefined
    if (!row) return null
    try {
      return JSON.parse(decrypt(row.iv, row.auth_tag, row.ciphertext))
    } catch {
      return null
    }
  },

  delete(accountId: number): void {
    getDb().prepare('DELETE FROM cookie_vault WHERE account_id = ?').run(accountId)
  }
}
