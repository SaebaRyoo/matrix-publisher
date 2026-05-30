import type { BrowserContext } from 'puppeteer'
import type { PlatformAdapter, PublishContent, LoginResult, PublishResult } from './adapter.interface'
import { cookieVault } from '../cookie-vault'
import { sleep, humanType, humanTypeInElement, randomScroll } from './human'
import log from 'electron-log'

const DOUYIN_CREATOR = 'https://creator.douyin.com'
const DOUYIN_PUBLISH_URL = 'https://creator.douyin.com/creator-micro/content/upload?default-tab=3'

export class DouyinAdapter implements PlatformAdapter {
  readonly platform = 'douyin'

  async checkLogin(ctx: BrowserContext): Promise<boolean> {
    const page = await ctx.newPage()
    try {
      await page.goto(DOUYIN_CREATOR, { waitUntil: 'networkidle2', timeout: 15000 })
      const url = page.url()
      return url.includes('creator.douyin.com') && !url.includes('login')
    } catch {
      return false
    } finally {
      await page.close()
    }
  }

  async login(ctx: BrowserContext, _accountId: number): Promise<LoginResult> {
    const page = await ctx.newPage()
    try {
      await page.goto(DOUYIN_CREATOR, { waitUntil: 'networkidle2', timeout: 60000 })
        .catch((e) => log.warn('Douyin goto timeout (non-fatal):', e.message))

      const deadline = Date.now() + 180000
      while (Date.now() < deadline) {
        const url = page.url()
        if (url.includes('creator-micro/home')) {
          const cookies = await ctx.cookies()
          cookieVault.save(_accountId, cookies)
          log.info('Douyin login successful, saved', cookies.length, 'cookies')
          return { success: true }
        }
        await new Promise((r) => setTimeout(r, 3000))
      }
      return { success: false, error: '登录超时，请重试' }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Login failed' }
    } finally {
      await page.close()
    }
  }

  async publish(ctx: BrowserContext, content: PublishContent, _accountId: number): Promise<PublishResult> {
    const page = await ctx.newPage()
    try {
      const cookies = cookieVault.load(_accountId)
      if (cookies) await ctx.setCookie(...cookies)
      await page.goto(DOUYIN_PUBLISH_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
        .catch(() => {})

      await sleep(2000, 4000)

      if (page.url().includes('login')) {
        return { success: false, error: 'COOKIE_EXPIRED' }
      }
      await randomScroll(page)

      // 上传图片
      const uploadInput = await page.waitForSelector('input[type="file"]', { timeout: 10000 })
      await uploadInput!.uploadFile(...content.images)

      // 上传后等待随机时间再填内容
      await sleep(3000, 6000)

      // 等待页面刷新后出现标题输入框
      await page.waitForSelector('input[placeholder="添加作品标题"]', { timeout: 30000 })
      await sleep(500, 1500)

      // 填写标题
      await humanType(page, 'input[placeholder="添加作品标题"]', content.title.slice(0, 55))

      await sleep(1000, 2500)

      // 填写正文
      const contentArea = await page.waitForSelector('[contenteditable="true"][data-slate-editor="true"]', { timeout: 10000 })
      await humanTypeInElement(page, contentArea!, content.body)

      await sleep(1000, 3000)
      await randomScroll(page)
      await sleep(1000, 2000)

      // 点击发布按钮
      const publishBtn = await page.waitForSelector('button.primary-cECiOJ', { timeout: 15000 })
      await publishBtn!.click()

      // 等待跳转成功 或 出现错误提示
      const result = await Promise.race([
        page.waitForNavigation({ timeout: 30000 })
          .then(() => ({ ok: true, url: page.url() }))
          .catch(() => ({ ok: true, url: page.url() })),
        page.waitForSelector('.semi-toast-content, .error-toast, [class*="error"]', { timeout: 30000 })
          .then(async (el) => ({ ok: false, error: await el!.evaluate((n) => n.textContent?.trim() || '发布失败') }))
          .catch(() => ({ ok: true, url: page.url() }))
      ])

      if (!result.ok) {
        log.error('Douyin publish error:', (result as any).error)
        return { success: false, error: (result as any).error }
      }
      const url = (result as any).url ?? page.url()
      log.info('Douyin publish done, url:', url)
      return { success: true, url }
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Publish failed'
      log.error('Douyin publish failed:', error)
      return { success: false, error }
    } finally {
      await page.close()
    }
  }
}

export const douyinAdapter = new DouyinAdapter()
