import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import type { Browser } from 'puppeteer'
import path from 'path'
import { app } from 'electron'
import log from 'electron-log'

// 打包后把 puppeteer 缓存目录指向 app Resources，开发时用默认缓存
if (app.isPackaged) {
  process.env.PUPPETEER_CACHE_DIR = path.join(process.resourcesPath, 'puppeteer-cache')
}

puppeteer.use(StealthPlugin())

class PuppeteerEngine {
  private browsers = new Map<number, Browser>()

  // private userDataDir(accountId: number): string {
  //   return path.join(app.getPath('userData'), 'browser-profiles', String(accountId))
  // }

  // private clearProfileLocks(profileDir: string): void {
  //   for (const f of ['SingletonLock', 'SingletonSocket', 'SingletonCookie', 'LOCK']) {
  //     try { fs.rmSync(path.join(profileDir, f)) } catch { /* ignore */ }
  //   }
  // }

  async acquireBrowser(accountId: number): Promise<Browser> {
    if (!this.browsers.has(accountId)) {
      // const profileDir = this.userDataDir(accountId)
      // this.clearProfileLocks(profileDir)
      const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          // --disable-blink-features=AutomationControlled 直接在 Chromium 内核层面禁用 navigator.webdriver = true 的注入，配合 stealth 插件可以更有效地隐藏自动化痕迹
          '--disable-blink-features=AutomationControlled',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-features=ChromeWhatsNewUI'
        ]
      })
      browser.on('disconnected', () => {
        this.browsers.delete(accountId)
        log.info(`Browser disconnected for account ${accountId}`)
      })
      this.browsers.set(accountId, browser)
      log.info(`Browser started for account ${accountId}`)
    }
    return this.browsers.get(accountId)!
  }

  async releaseBrowser(accountId: number): Promise<void> {
    const browser = this.browsers.get(accountId)
    if (browser) {
      await browser.close().catch(() => {})
      this.browsers.delete(accountId)
    }
  }

  // 兼容旧调用：acquireContext → 返回默认 BrowserContext
  async acquireContext(accountId: number) {
    const browser = await this.acquireBrowser(accountId)
    return browser.defaultBrowserContext()
  }

  getBrowser(): Browser | null {
    return this.browsers.values().next().value ?? null
  }

  async start(): Promise<void> {
    /* no-op，按需启动 */
  }
}

export const puppeteerEngine = new PuppeteerEngine()
