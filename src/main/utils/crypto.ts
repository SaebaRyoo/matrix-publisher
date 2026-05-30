import { app } from 'electron'
import crypto from 'crypto'

// 用 Electron safeStorage 作为密钥来源（macOS Keychain / Windows Credential Vault）
// 如果 safeStorage 不可用（如 headless CI），退回到机器 ID 派生
function getMasterKey(): Buffer {
  try {
    const { safeStorage } = require('electron')
    if (safeStorage.isEncryptionAvailable()) {
      const seed = `matrix-publisher-${app.getPath('userData')}`
      const encrypted = safeStorage.encryptString(seed)
      return crypto.createHash('sha256').update(encrypted).digest()
    }
  } catch {
    // fallback
  }
  // 退路：用 userData 路径派生一个固定密钥（不依赖系统 keychain）
  const seed = `matrix-publisher-fallback-${app.getPath('userData')}`
  return crypto.createHash('sha256').update(seed).digest()
}

export function encrypt(plaintext: string): { iv: string; authTag: string; ciphertext: string } {
  const key = getMasterKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    ciphertext: ciphertext.toString('hex')
  }
}

export function decrypt(iv: string, authTag: string, ciphertext: string): string {
  const key = getMasterKey()
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  return decipher.update(Buffer.from(ciphertext, 'hex')) + decipher.final('utf8')
}
