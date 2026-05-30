import type { BrowserContext } from 'puppeteer'

export interface PublishContent {
  title: string
  body: string        // 纯文本正文
  images: string[]   // 本地图片路径数组
}

export interface LoginResult {
  success: boolean
  error?: string
}

export interface PublishResult {
  success: boolean
  url?: string   // 发布成功后的笔记链接
  error?: string
}

export interface PlatformAdapter {
  readonly platform: string
  login(ctx: BrowserContext, accountId: number): Promise<LoginResult>
  checkLogin(ctx: BrowserContext): Promise<boolean>
  publish(ctx: BrowserContext, content: PublishContent, accountId: number): Promise<PublishResult>
}
