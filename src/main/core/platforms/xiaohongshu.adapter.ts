import type { BrowserContext, Page } from 'puppeteer'
import type { PlatformAdapter, PublishContent, LoginResult, PublishResult } from './adapter.interface'
import { cookieVault } from '../cookie-vault'
import { sleep, humanType, humanTypeInElement, randomScroll } from './human'
import log from 'electron-log'

const XHS_PUBLISH_URL = 'https://creator.xiaohongshu.com/publish/publish?target=image'

export class XiaohongshuAdapter implements PlatformAdapter {
  readonly platform = 'xiaohongshu'

  async checkLogin(ctx: BrowserContext): Promise<boolean> {
    return cookieVault.load(ctx.browser().process()?.pid ?? -1) !== null
  }

  async login(ctx: BrowserContext, accountId: number): Promise<LoginResult> {
    const page = await ctx.newPage()
    try {
      await page.goto('https://creator.xiaohongshu.com', { waitUntil: 'networkidle2', timeout: 60000 })
        .catch((e) => log.warn('XHS goto timeout (non-fatal):', e.message))

      const deadline = Date.now() + 180000
      while (Date.now() < deadline) {
        const url = page.url()
        if (url.includes('creator.xiaohongshu.com') && !url.includes('login')) {
          const cookies = await ctx.cookies()
          cookieVault.save(accountId, cookies)
          log.info('XHS login successful, saved', cookies.length, 'cookies')
          return { success: true }
        }
        await new Promise((r) => setTimeout(r, 2000))
      }
      return { success: false, error: '登录超时，请重试' }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Login failed' }
    } finally {
      await page.close()
    }
  }

  async publish(ctx: BrowserContext, content: PublishContent, accountId: number): Promise<PublishResult> {
    const page = await ctx.newPage()
    try {
      await page.setViewport({ width: 1280, height: 900 })

      const cookies = cookieVault.load(accountId)
      if (cookies) await ctx.setCookie(...cookies)

      await page.goto(XHS_PUBLISH_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
        .catch(() => {})
      await sleep(2000, 4000)
      log.info('XHS publish page url:', page.url())

      if (page.url().includes('login')) {
        return { success: false, error: 'COOKIE_EXPIRED' }
      }

      await randomScroll(page)

      await this._uploadImages(page, content.images)

      // 上传后等待随机时间再填内容
      await sleep(3000, 6000)

      const titleInput = await page.waitForSelector('input[placeholder="填写标题会有更多赞哦"]', { timeout: 30000 })
      await titleInput!.click()
      await sleep(300, 800)
      await humanTypeInElement(page, titleInput!, content.title.slice(0, 20))

      await sleep(1000, 2500)

      const bodyEditor = await page.waitForSelector('.tiptap.ProseMirror', { timeout: 10000 })
      await humanTypeInElement(page, bodyEditor!, content.body)

      await sleep(1000, 3000)
      await randomScroll(page)
      await sleep(1000, 2000)

      await page.waitForSelector('xhs-publish-btn', { timeout: 15000 })
      const { width, height } = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
      }))
      const clickX = width / 2 + 60
      const clickY = height - 45

      const client = await page.createCDPSession()
      await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: clickX, y: clickY, button: 'left', clickCount: 1 })
      await sleep(50, 150)
      await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: clickX, y: clickY, button: 'left', clickCount: 1 })

      await sleep(3000, 5000)
      return { success: true, url: page.url() }
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Publish failed'
      log.error('XHS publish failed:', error)
      return { success: false, error }
    } finally {
      await page.close()
    }
  }

  private async _uploadImages(page: Page, imagePaths: string[]): Promise<void> {
    if (imagePaths.length === 0) return
    const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 10000 })
    await fileInput!.uploadFile(...imagePaths)
  }
}

export const xiaohongshuAdapter = new XiaohongshuAdapter()
