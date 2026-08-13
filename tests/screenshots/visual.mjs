// =============================================================================
// visual.mjs — التقاط لقطات شاشة لكل شاشات النظام في بيئة حتمية (deterministic)
// -----------------------------------------------------------------------------
// الاستخدام:  node tests/screenshots/visual.mjs <اسم_المجلد>
// يبني محلياً:  npm run screenshot -- <اسم_المجلد>
//
// المنطق:
//   1) يشغّل `vite preview` على الـ dist المبنية.
//   2) يفتح Chrome حقيقي (puppeteer-core) — بدون أي شبكة خارجية (حتمية).
//   3) يلتقط شاشة تسجيل الدخول أولاً.
//   4) يحقن جلسة المدير + بيانات تجريبية ثابتة في التخزين المحلي، ثم يعيد
//      التحميل ويلتقط كل الشاشات (إدارة البيانات محلياً بالكامل — لا سحابة).
//   5) يحفظ اللقطات في tests/screenshots/shots/<اسم_المجلد>/*.png
//
// ملاحظة: لا نستخدم networkidle أبداً (اتصالات Firebase/SDK قد لا تهدأ) —
// نعتمد على انتظار محددات DOM حقيقية + نوم قصير لتستقر الرسوم المتحركة.
// =============================================================================
import { launch } from 'puppeteer-core'
import { mkdirSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildStoragePayload, PREFIX, SESSION } from './seed-data.mjs'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const outBase = path.join(repo, 'tests', 'screenshots', 'shots')
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const viteBin = path.join(repo, 'node_modules', 'vite', 'bin', 'vite.js')
const BASE = '/test1/'
const PORT = Number(process.env.SHOT_PORT) || 4174
const BASE_URL = `http://127.0.0.1:${PORT}${BASE}`

const dirName = process.argv[2]
if (!dirName) {
  console.error('استخدام: node tests/screenshots/visual.mjs <اسم_المجلد>')
  process.exit(1)
}
const outDir = path.join(outBase, dirName)

const VIEWS = [
  { id: 'dashboard', label: 'لوحة التحكم' },
  { id: 'orders', label: 'سجل الطلبات' },
  { id: 'customers', label: 'العملاء' },
  { id: 'products', label: 'المنتجات' },
  { id: 'suppliers', label: 'الموردون' },
  { id: 'expenses', label: 'المصروفات' },
  { id: 'payments', label: 'إدارة المدفوعات' },
  { id: 'reports', label: 'التقارير' },
  { id: 'users', label: 'المستخدمون' },
  { id: 'settings', label: 'الإعدادات' },
]

const sleep = ms => new Promise(r => setTimeout(r, ms))

function blockNetwork(page) {
  page.setRequestInterception(true)
  page.on('request', req => {
    const u = req.url()
    if (u.startsWith(BASE_URL) || u.startsWith(`http://127.0.0.1:${PORT}`) || u.startsWith(`http://localhost:${PORT}`)) {
      req.continue()
    } else {
      req.abort()
    }
  })
}

async function waitFor(page, expr, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      if (await page.evaluate(expr)) return true
    } catch { /* retry */ }
    await sleep(200)
  }
  throw new Error('لم يظهر العنصر المطلوب خلال المدة: ' + expr)
}

async function startPreview() {
  const child = spawn(process.execPath, [viteBin, 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], {
    cwd: repo,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let logs = ''
  child.stdout.on('data', d => { logs += String(d) })
  child.stderr.on('data', d => { logs += String(d) })
  const deadline = Date.now() + 40000
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE_URL, { method: 'HEAD' })
      if (res.ok) return child
    } catch { /* not up yet */ }
    await sleep(500)
  }
  throw new Error('فشل تشغيل خادم المعاينة:\n' + logs)
}

async function main() {
  mkdirSync(outDir, { recursive: true })

  // 1) بناء الواجهة ثم تشغيل المعاينة
  console.log('تشغيل خادم المعاينة على', BASE_URL)
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
    blockNetwork(page)

    // ---------- شاشة تسجيل الدخول ----------
    await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 })
    await waitFor(page, `document.querySelector('#root') && document.querySelector('#root').children.length > 0`)
    await sleep(800)
    writeFileSync(path.join(outDir, 'login.png'), await page.screenshot({ fullPage: true }))
    console.log('✓ login')

    // ---------- حقن الجلسة + البيانات ثم إعادة التحميل ----------
    await page.evaluate(({ payload, prefix, session }) => {
      Object.keys(localStorage).forEach(k => {
        if (k.indexOf(prefix) === 0) localStorage.removeItem(k)
      })
      Object.entries(payload).forEach(([k, v]) => localStorage.setItem(k, v))
      sessionStorage.setItem(prefix + 'user_session', JSON.stringify(session))
    }, { payload: buildStoragePayload(), prefix: PREFIX, session: SESSION })

    await page.reload({ waitUntil: 'load', timeout: 30000 })
    await waitFor(page, `document.querySelectorAll('aside nav button').length > 0`)
    await sleep(900)
    console.log('✓ جلسة المدير + البيانات ثابتة')

    // ---------- الشاشات الرئيسية (وضع داكن) ----------
    for (const v of VIEWS) {
      if (v.label) {
        const clicked = await page.evaluate(label => {
          const btn = Array.from(document.querySelectorAll('aside nav button'))
            .find(b => (b.textContent || '').trim() === label)
          if (!btn) return false
          btn.click()
          return true
        }, v.label)
        if (!clicked) throw new Error('زر تنقل غير موجود: ' + v.label)
        await sleep(900)
      }
      writeFileSync(path.join(outDir, v.id + '.png'), await page.screenshot({ fullPage: true }))
      console.log('✓ ' + v.id)
    }

    // ---------- نسخة فاتحة من اللوحة ----------
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('header button')).find(b => b.title === 'تبديل المظهر')
      if (btn) btn.click()
    })
    await sleep(600)
    writeFileSync(path.join(outDir, 'dashboard-light.png'), await page.screenshot({ fullPage: true }))
    console.log('✓ dashboard-light')

    // ---------- نسخة الموبايل من اللوحة ----------
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
    await sleep(600)
    writeFileSync(path.join(outDir, 'dashboard-mobile.png'), await page.screenshot({ fullPage: true }))
    console.log('✓ dashboard-mobile')

    console.log('اكتمل الالتقاط →', outDir)
  } finally {
    if (browser) await browser.close()
    server.kill()
  }
}

main().catch(err => {
  console.error(err && err.stack ? err.stack : err)
  process.exit(1)
})
