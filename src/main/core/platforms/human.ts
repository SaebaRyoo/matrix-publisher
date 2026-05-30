import type { Page } from 'puppeteer'

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function sleep(min: number, max: number): Promise<void> {
  await new Promise((r) => setTimeout(r, rand(min, max)))
}

export async function humanType(page: Page, selector: string, text: string): Promise<void> {
  await page.click(selector)
  await sleep(200, 500)
  for (const char of text) {
    await page.keyboard.type(char)
    await new Promise((r) => setTimeout(r, rand(50, 180)))
  }
}

export async function humanTypeInElement(page: Page, el: any, text: string): Promise<void> {
  await el.click()
  await sleep(200, 500)
  for (const char of text) {
    await page.keyboard.type(char)
    await new Promise((r) => setTimeout(r, rand(50, 180)))
  }
}

export async function randomScroll(page: Page): Promise<void> {
  const times = rand(2, 4)
  for (let i = 0; i < times; i++) {
    const dy = rand(100, 400)
    await page.evaluate((y) => window.scrollBy({ top: y, behavior: 'smooth' }), dy)
    await sleep(500, 1500)
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await sleep(300, 800)
}
