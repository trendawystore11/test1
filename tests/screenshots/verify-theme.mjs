import { launch } from 'puppeteer-core'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildStoragePayload, PREFIX, SESSION } from './seed-data.mjs'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const viteBin = path.join(repo, 'node_modules', 'vite', 'bin', 'vite.js')
const PORT = 4174
const BASE_URL = `http://127.0.0.1:${PORT}/test1/`
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function startPreview() {
  const child = spawn(process.execPath, [viteBin, 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], {
    cwd: repo,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const deadline = Date.now() + 40000
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE_URL, { method: 'HEAD' })
      if (res.ok) return child
    } catch { /* not up */ }
    await sleep(500)
  }
  throw new Error('preview server failed')
}

async function main() {
  const server = await startPreview()
  let browser = null
  try {
    browser = await launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-background-networking', '--disable-extensions', '--disable-features=IsolateOrigins,site-per-process'],
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
    await page.setDefaultTimeout(20000)
    page.setRequestInterception(true)
    page.on('request', req => {
      const u = req.url()
      if (u.startsWith(BASE_URL) || u.startsWith(`http://127.0.0.1:${PORT}`)) req.continue()
      else req.abort()
    })

    const errors = []
    page.on('pageerror', e => errors.push('pageerror: ' + e.message))
    page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()) })

    // seed + session (same as visual.mjs)
    await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 })
    await sleep(600)
    await page.evaluate(({ payload, prefix, session }) => {
      Object.keys(localStorage).forEach(k => { if (k.indexOf(prefix) === 0) localStorage.removeItem(k) })
      Object.entries(payload).forEach(([k, v]) => localStorage.setItem(k, v))
      sessionStorage.setItem(prefix + 'user_session', JSON.stringify(session))
    }, { payload: buildStoragePayload(), prefix: PREFIX, session: SESSION })
    await page.reload({ waitUntil: 'load', timeout: 30000 })
    const deadline = Date.now() + 20000
    while (Date.now() < deadline) {
      if (await page.evaluate(() => document.querySelectorAll('aside nav button').length > 0).catch(() => false)) break
      await sleep(200)
    }

    async function sample(label) {
      const d = await page.evaluate(() => {
        const cs = el => getComputedStyle(el)
        const q = s => document.querySelector(s)
        const aside = q('aside')
        const header = q('header')
        const card = q('.card')
        const table = q('.data-table')
        const navActive = q('aside nav button.bg-brand-500\\/15')
        const btn = Array.from(q('header').querySelectorAll('button')).find(b => b.title && b.title.includes('إنشاء طلب جديد'))
        const input = q('input')
        return {
          bodyBg: cs(document.body).backgroundColor,
          bodyColor: cs(document.body).color,
          asideBg: aside ? cs(aside).backgroundColor : null,
          headerBg: header ? cs(header).backgroundColor : null,
          cardBg: card ? cs(card).backgroundColor : null,
          cardRadius: card ? cs(card).borderRadius : null,
          thBg: table ? cs(table.querySelector('th')).backgroundColor : null,
          thColor: table ? cs(table.querySelector('th')).color : null,
          navActiveBg: navActive ? cs(navActive).backgroundColor : null,
          navActiveColor: navActive ? cs(navActive).color : null,
          btnBg: btn ? cs(btn).backgroundColor : null,
          btnColor: btn ? cs(btn).color : null,
          inputBg: input ? cs(input).backgroundColor : null,
          inputRadius: input ? cs(input).borderRadius : null,
          thFont: table ? cs(table.querySelector('th')).textTransform : null,
        }
      })
      console.log('\n[' + label + '] theme=' + await page.evaluate(() => document.documentElement.getAttribute('data-theme')))
      console.log(JSON.stringify(d, null, 0))
    }

    await sample('dark')
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('header button')).find(b => b.title === 'تبديل المظهر')
      if (btn) btn.click()
    })
    await sleep(600)
    await sample('light')

    console.log('\n=== JS ERRORS ===')
    console.log(errors.length ? errors.join('\n') : 'none')
  } finally {
    if (browser) await browser.close()
    server.kill()
  }
}

main().catch(err => { console.error(err); process.exit(1) })
