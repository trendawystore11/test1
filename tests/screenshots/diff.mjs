// =============================================================================
// diff.mjs — مقارنة بكسل-بكسل بين مجلدين من لقطات الشاشة
// -----------------------------------------------------------------------------
// الاستخدام: node tests/screenshots/diff.mjs <المجلد_الأول> <المجلد_الثاني>
// يقارن كل ملف مشترك بين tests/screenshots/shots/<أ>/<ب> عبر لوحة رسم داخل
// Chrome حقيقي (بدون أي مكتبة PNG إضافية)، ويكتب صورة الاختلاف في
// tests/screenshots/diff/<name>.png. مخرج 1 إذا تغيّر أي لقطة بنسبة > العتبة.
// =============================================================================
import { launch } from 'puppeteer-core'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const shotsBase = path.join(repo, 'tests', 'screenshots', 'shots')
const diffDir = path.join(repo, 'tests', 'screenshots', 'diff')
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const a = process.argv[2]
const b = process.argv[3]
if (!a || !b) {
  console.error('استخدام: node tests/screenshots/diff.mjs <أ> <ب>')
  process.exit(1)
}

const dirA = path.join(shotsBase, a)
const dirB = path.join(shotsBase, b)
if (!existsSync(dirA) || !existsSync(dirB)) {
  console.error('أحد المجلدين غير موجود:', dirA, dirB)
  process.exit(1)
}

// العتبة: نسبة البكسلات المتغيرة المسموحة (0.002 = 0.2%)
const THRESHOLD = 0.002

const names = readdirSync(dirA).filter(f => f.endsWith('.png'))
mkdirSync(diffDir, { recursive: true })

const browser = await launch({
  executablePath: chromePath,
  headless: true,
  args: ['--no-sandbox', '--disable-background-networking', '--disable-extensions'],
})
const page = await browser.newPage()
await page.setViewport({ width: 400, height: 300 })

let failed = 0
const results = []
for (const name of names) {
  const pathB = path.join(dirB, name)
  if (!existsSync(pathB)) {
    results.push({ name, status: 'MISSING', pct: 100 })
    failed++
    continue
  }
  const bufA = readFileSync(path.join(dirA, name)).toString('base64')
  const bufB = readFileSync(pathB).toString('base64')

  const out = await page.evaluate(async ({ a64, b64, threshold }) => {
    const load = src => new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
    const [imA, imB] = await Promise.all([load(a64), load(b64)])
    const w = Math.max(imA.width, imB.width)
    const h = Math.max(imA.height, imB.height)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(imA, 0, 0)
    const dataA = ctx.getImageData(0, 0, w, h).data
    ctx.drawImage(imB, 0, 0)
    const dataB = ctx.getImageData(0, 0, w, h).data

    let changed = 0
    let total = (w * h) / 4 // نربع مساحة للتسريع (يقارن عينة ربع البكسلات)
    const imgData = ctx.getImageData(0, 0, w, h)
    const px = imgData.data
    for (let i = 0; i < w * h; i += 4) {
      const r = i * 4
      const diff =
        Math.abs(dataA[r] - dataB[r]) > 12 ||
        Math.abs(dataA[r + 1] - dataB[r + 1]) > 12 ||
        Math.abs(dataA[r + 2] - dataB[r + 2]) > 12 ||
        Math.abs(dataA[r + 3] - dataB[r + 3]) > 12
      if (diff) {
        changed++
        // طلاء وحدات الاختلاف باللون الأحمر الفاقع
        px[r] = 255; px[r + 1] = 0; px[r + 2] = 0; px[r + 3] = 255
      } else {
        px[r + 3] = 128 // بهوت الخلفية المطابقة
      }
    }
    ctx.putImageData(imgData, 0, 0)
    const pct = (changed / total) * 100
    return { pct, changed, total, diffUrl: canvas.toDataURL('image/png') }
  }, { a64: 'data:image/png;base64,' + bufA, b64: 'data:image/png;base64,' + bufB, threshold: THRESHOLD })

  writeFileSync(path.join(diffDir, name), Buffer.from(out.diffUrl.split(',')[1], 'base64'))
  const ok = out.pct <= THRESHOLD * 100
  if (!ok) failed++
  results.push({ name, status: ok ? 'OK' : 'DIFF', pct: out.pct })
  console.log(`${ok ? '✓' : '✗'} ${name.padEnd(24)} ${out.pct.toFixed(3)}%`)
}

await browser.close()

const changed = results.filter(r => r.status !== 'OK')
console.log('\n=== خلاصة المقارنة ===')
console.log(`إجمالي: ${results.length} | متغير: ${changed.length} | متطابق: ${results.length - changed.length}`)
if (changed.length) {
  changed.forEach(r => console.log(`  ${r.name} → ${r.status} (${r.pct.toFixed(3)}%)`))
  process.exit(1)
}
process.exit(0)
