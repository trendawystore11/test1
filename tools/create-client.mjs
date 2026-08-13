#!/usr/bin/env node
// =============================================================================
// create-client.mjs — مصنع العملاء (Client Factory)
// -----------------------------------------------------------------------------
// ينشئ نظاماً كاملاً لعميل جديد في خطوات تلقائية:
//   1) ينسخ القالب الحالي لمجلد العميل
//   2) يولّد src/client/config.js كاملاً (مفاتيح الغيب المحافظات + تصنيفات البيزنس)
//   3) ينشئ مستودع GitHub عام + يفعّل GitHub Pages (بناء عبر Actions)
//   4) يحفظ مفاتيح العميل السرية في Actions Secrets (تشفير libsodium)
//   5) يرفع الكود ويشغّل النشر ويعيد رابط التسليم الجاهز
//
// الاستخدام:
//   node create-client.mjs                       # إدخال تفاعلي
//   node create-client.mjs --dry-run --name demo  # تجربة بلا أي تغيير فعلي
//   node create-client.mjs --name myclient --appName "المتجر" ...
//
// المتغيرات البيئية: GITHUB_TOKEN (مطلوب للإنشاء الحقيقي)، GIT_BIN (اختياري)
// =============================================================================
import { readFileSync, writeFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join, resolve, basename } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline'
import { createRequire } from 'node:module'
import os from 'node:os'
import { pathToFileURL } from 'node:url'

const HERE = resolve(import.meta.dirname)
const TEMPLATE_ROOT = resolve(HERE, '..')

const FLAGS = parseArgs(process.argv.slice(2))
const DRY_RUN = !!FLAGS.dryRun
const TOKEN = process.env.GITHUB_TOKEN || ''

// =============================================================================
// أدوات مساعدة
// =============================================================================
function parseArgs(argv) {
  const flags = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') { flags.dryRun = true; continue }
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const hasNext = i + 1 < argv.length && argv[i + 1] !== undefined && !String(argv[i + 1]).startsWith('--')
      const val = hasNext ? argv[++i] : true
      flags[key] = val
    }
  }
  return flags
}

async function prompt(q, def = '') {
  if (!process.stdin.isTTY) return def   // غير تفاعلي → القيمة الافتراضية
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    const finish = (ans) => {
      rl.close()
      resolve(String(ans ?? '').trim() || def)
    }
    rl.question(def ? `${q} [${def}]: ` : `${q}: `, finish)
    rl.on('error', () => resolve(def))
  })
}

function json(v) { return JSON.stringify(v, null, 2) }

function git() {
  const candidates = ['git', process.env.GIT_BIN, 'C:\\Users\\m\\opencode\\portable-git\\cmd\\git.exe']
  for (const c of candidates) {
    if (!c) continue
    const r = spawnSync(c, ['--version'], { encoding: 'utf8' })
    if (r.status === 0) return c
  }
  throw new Error('git غير متوفر — حدد مساره عبر متغير GIT_BIN')
}

function runGit(args, cwd) {
  const r = spawnSync(git(), args, { encoding: 'utf8', cwd, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } })
  if (r.status !== 0) {
    throw new Error('git ' + args.join(' ') + ' فشل: ' + (r.stderr || r.stdout || '').trim())
  }
  return r.stdout.trim()
}

async function gh(pathname, { method = 'GET', body, token } = {}) {
  const res = await fetch('https://api.github.com' + pathname, {
    method,
    headers: {
      Authorization: 'token ' + token,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'client-factory',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) {
    const detail = (data.errors && data.errors.map((e) => e.message).join('; ')) || data.message || text
    throw new Error(`GitHub ${pathname} → ${res.status}: ${detail.slice(0, 300)}`)
  }
  return data
}

function ensureLibsodium() {
  const cacheDir = join(os.tmpdir(), 'client-factory-deps')
  if (!existsSync(join(cacheDir, 'node_modules', 'libsodium-wrappers'))) {
    mkdirSync(cacheDir, { recursive: true })
    const r = spawnSync('npm', ['install', '--prefix', cacheDir, 'libsodium-wrappers@0.7.15', '--no-audit', '--no-fund'], { encoding: 'utf8', stdio: 'ignore', shell: true })
    if (r.status !== 0) throw new Error('تعذّر تثبيت libsodium-wrappers — تأكد من توفر npm')
  }
  const require = createRequire(join(cacheDir, 'index.cjs'))
  return require('libsodium-wrappers')
}

function toSealedBox(value, publicKeyB64, sodium) {
  const pk = sodium.from_base64(publicKeyB64, sodium.base64_variants.ORIGINAL)
  const sealed = sodium.crypto_box_seal(sodium.from_string(value), pk)
  return sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL)
}

// =============================================================================
// 1) قراءة قيم القالب (محافظات + تصنيفات + العملة)
// =============================================================================
const templateConfig = await import(pathToFileURL(join(TEMPLATE_ROOT, 'src/client/config.js')).href)
const TPL = templateConfig.CLIENT
const TPL_SHEETS = templateConfig.SHEETS_SYNC_CONFIG
const TPL_AI = templateConfig.AI_CONFIG

// =============================================================================
// 2) جمع بيانات العميل
// =============================================================================
async function askClientData() {
  const data = {}
  data.clientId = (FLAGS.name || await prompt('معرّف العميل (إنجليزي صغير بلا مسافات، مثال: trendawy)')).trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]*$/.test(data.clientId)) throw new Error('معرّف العميل غير صالح — حروف/أرقام/شرطات فقط وابدأ بحرف')
  data.appName = FLAGS.appName || await prompt('اسم المتجر/العميل (مثال: Trendawy)', TPL.appName)
  data.tagline = FLAGS.tagline || await prompt('الشعار النصي (اختياري)', TPL.tagline || '')
  data.logo = FLAGS.logo || await prompt('اسم ملف الشعار داخل public/ بلا / (مثال: 2.png)', TPL.logo || '2.png')
  data.primaryColor = FLAGS.primaryColor || await prompt('اللون الرئيسي (Hex)', TPL.primaryColor)
  data.theme = FLAGS.theme || await prompt('الثيم', TPL.theme)
  data.defaultGovernorate = FLAGS.governorate || await prompt('المحافظة الافتراضية', TPL.region.defaultGovernorate)

  console.log('\n-- إعدادات مشروع Firebase (أنشئه أولاً في console.firebase.google.com) --')
  data.firebase = {}
  data.firebase.apiKey = FLAGS.fbApiKey || await prompt('  API Key')
  data.firebase.authDomain = FLAGS.fbAuthDomain || await prompt('  Auth Domain', '')
  data.firebase.projectId = FLAGS.fbProjectId || await prompt('  Project ID')
  data.firebase.storageBucket = FLAGS.fbBucket || await prompt('  Storage Bucket', '')
  data.firebase.messagingSenderId = FLAGS.fbSenderId || await prompt('  Messaging Sender ID', '')
  data.firebase.appId = FLAGS.fbAppId || await prompt('  App ID', '')
  data.firebase.measurementId = FLAGS.fbMeasurementId || await prompt('  Measurement ID', '')

  console.log('\n-- مزامنة Google Sheets --')
  data.spreadsheetId = (typeof FLAGS.spreadsheetId === 'string' ? FLAGS.spreadsheetId : '') || (await prompt('  Spreadsheet ID')) || ''
  data.sheetApiKey = (typeof FLAGS.sheetApiKey === 'string' ? FLAGS.sheetApiKey : '') || (await prompt('  Public Sheet API Key (اختياري)', '')) || ''
  data.syncDirection = FLAGS.syncDirection || await prompt('  اتجاه المزامنة (export/import/both)', TPL_SHEETS.direction || 'export')
  data.syncFrequency = FLAGS.syncFrequency || await prompt('  التكرار (manual/every-op/15m/1h)', TPL_SHEETS.frequency || 'manual')

  console.log('\n-- مفاتيح سرية خاصة بالعميل (تُحفظ في Actions Secrets، لا في الكود) --')
  data.geminiKey = FLAGS.geminiKey || await prompt('  مفتاح Gemini API (سرّي)', '')
  data.googleClientId = FLAGS.googleClientId || await prompt('  Google OAuth Client ID', '')
  data.googleClientSecret = FLAGS.googleClientSecret || await prompt('  Google OAuth Client Secret (سرّي)', '')
  data.aiModel = FLAGS.aiModel || await prompt('  نموذج AI', TPL_AI.model || 'gemini-2.0-flash-lite')

  data.repoName = (FLAGS.repo || await prompt('\nاسم المستودع على GitHub', data.clientId)).toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]*$/.test(data.repoName)) throw new Error('اسم المستودع غير صالح')
  data.outDir = FLAGS.out || await prompt('مجلد المشروع الجديد (المسار الكامل)', join(resolve(TEMPLATE_ROOT, '..'), data.clientId))
  return data
}

// =============================================================================
// 3) توليد config.js للعميل
// =============================================================================
function buildConfigSource(d) {
  const client = {
    clientId: d.clientId,
    appName: d.appName,
    tagline: d.tagline,
    logo: d.logo.replace(/^\/+/, ''),
    primaryColor: d.primaryColor,
    theme: d.theme,
    firebaseIsClientProject: true,
    currency: TPL.currency,
    region: {
      timeZone: TPL.region.timeZone,
      defaultGovernorate: d.defaultGovernorate,
      governorates: TPL.region.governorates,
    },
    customerCategories: TPL.customerCategories,
    defaultCustomerCategory: TPL.defaultCustomerCategory,
    expenseCategories: TPL.expenseCategories,
  }

  const sheets = `export const SHEETS_SYNC_CONFIG = {
  spreadsheetId:    ${json(d.spreadsheetId)},
  googleSheetsWebhookUrl: '',
  clientId:         env.VITE_GOOGLE_CLIENT_ID     || '',   // يُحقن وقت البناء (VITE_GOOGLE_CLIENT_ID)
  clientSecret:     env.VITE_GOOGLE_CLIENT_SECRET || '',   // يُحقن وقت البناء (VITE_GOOGLE_CLIENT_SECRET)
  accessToken:      '',
  refreshToken:     '',
  apiKey:           ${json(d.sheetApiKey)},         // Public Sheet API Key (fallback)
  direction:        ${json(d.syncDirection)},
  frequency:        ${json(d.syncFrequency)},
  enabled:          false,
  debounceMs:       3000,
  tokenExpiresAt:   0,
  lastSyncAt:       null,
  lastSyncDirection:'',
  lastSyncRows:     0,
  lastSyncStatus:   'none',
  lastSyncError:    '',
  cfgUpdatedAt:     0,
}`

  const ai = `export const AI_CONFIG = {
  provider: 'gemini',
  apiKey:   env.VITE_GEMINI_API_KEY || '',   // يُحقن وقت البناء (VITE_GEMINI_API_KEY)
  model:    ${json(d.aiModel)},
}`

  const fb = `export const FALLBACK_FIREBASE_CONFIG = {
  apiKey:            ${json(d.firebase.apiKey)},
  authDomain:        ${json(d.firebase.authDomain)},
  projectId:         ${json(d.firebase.projectId)},
  storageBucket:     ${json(d.firebase.storageBucket)},
  messagingSenderId: ${json(d.firebase.messagingSenderId)},
  appId:             ${json(d.firebase.appId)},
  measurementId:     ${json(d.firebase.measurementId)},
}`

  return `/**
 * =============================================================================
 * client.config.js — ملف تخصيص العميل الوحيد (Client Config)
 * =============================================================================
 * أُنشئ تلقائياً عبر create-client.mjs (Client Factory) بتاريخ ${new Date().toISOString()}.
 *
 * ملاحظة أمان (v2): القيم الحساسة (Google OAuth Client ID/Secret + مفتاح Gemini)
 * لا تُحفر في المستودع إطلاقاً؛ تُحقن وقت البناء من GitHub Actions Secrets عبر
 * متغيرات البيئة VITE_* فينتهي الأمر بالعميل صفر إعدادات والمستودع نظيف.
 * =============================================================================
 */

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}

export const CLIENT = ${json(client)}

${sheets}

${ai}

${fb}

// =============================================================================
// DEFAULT_CONFIG — تجميع شامل للقيم الافتراضية بأسماء متوافقة مع الإصدارات
// القديمة (aiProvider / aiModel / geminiApiKey).
// =============================================================================
export const DEFAULT_CONFIG = {
  client: CLIENT,
  sheets: SHEETS_SYNC_CONFIG,
  aiProvider: AI_CONFIG.provider,
  aiModel: AI_CONFIG.model,
  geminiApiKey: AI_CONFIG.apiKey,
  firebase: FALLBACK_FIREBASE_CONFIG,
}
`
}

// =============================================================================
// 4) نسخ القالب لمجلد العميل
// =============================================================================
function copyTemplate(outDir) {
  if (existsSync(outDir)) throw new Error(`المجلد موجود مسبقاً: ${outDir}`)
  mkdirSync(outDir, { recursive: true })
  const EXCLUDE = new Set(['node_modules', 'dist', '.git', 'token*.txt', '*.secret.json', 'client_secret_*.json'])
  const isExcluded = (name) =>
    EXCLUDE.has(name) ||
    /^(token.*\.txt|.*\.secret\.json|client_secret_.*\.json)$/.test(name)
  cpSync(TEMPLATE_ROOT, outDir, { recursive: true, filter: (src) => !isExcluded(basename(src)) })
  // نقطة الدخول لنقل القالب: لا ننسخ نسخة قديمة من قائمة العملاء
  rmSync(join(outDir, 'node_modules'), { recursive: true, force: true })
  rmSync(join(outDir, 'dist'), { recursive: true, force: true })
}

// =============================================================================
// 5) الإنشاء الفعلي على GitHub
// =============================================================================
function setViteBase(outDir, repoName) {
  const vitePath = join(outDir, 'vite.config.js')
  if (!existsSync(vitePath)) return
  let src = readFileSync(vitePath, 'utf8')
  src = src.replace(/base:\s*'[^']*'/, `base: '/${repoName}/'`)
  writeFileSync(vitePath, src, 'utf8')
  console.log(`  vite base → /${repoName}/`)
}

function setHtmlTitle(outDir, appName) {
  const htmlPath = join(outDir, 'index.html')
  if (!existsSync(htmlPath)) return
  let src = readFileSync(htmlPath, 'utf8')
  src = src.replace(/<title>[\s\S]*?<\/title>/, `<title>${appName}</title>`)
  writeFileSync(htmlPath, src, 'utf8')
  console.log('  عنوان التبويب → اسم العميل')
}

async function createRepo(repoName, token) {
  console.log(`- إنشاء المستودع العام ${repoName} ...`)
  let repo
  try {
    repo = await gh('/user/repos', { method: 'POST', body: { name: repoName, private: false, auto_init: false, has_issues: false }, token })
  } catch (e) {
    if (!/exist/i.test(e.message)) throw e
    console.log(`  المستودع موجود مسبقاً — إعادة استخدامه`)
    const me = await gh('/user', { token }).then((u) => u.login)
    repo = await gh(`/repos/${me}/${repoName}`, { token })
  }
  const me = repo.owner ? repo.owner.login : await gh('/user', { token }).then((u) => u.login)
  try {
    await gh(`/repos/${me}/${repoName}/pages`, { method: 'POST', body: { build_type: 'workflow' }, token })
    console.log('  Pages مفعّل (بناء عبر GitHub Actions)')
  } catch (e) {
    console.log('  تنبيه: ' + e.message)
  }
  return { owner: me, repo }
}

async function setSecrets(owner, repoName, d, token) {
  const sodium = await ensureLibsodium()
  const pub = await gh(`/repos/${owner}/${repoName}/actions/secrets/public-key`, { token })
  const secretMap = {
    VITE_GEMINI_API_KEY: d.geminiKey,
    VITE_GOOGLE_CLIENT_ID: d.googleClientId,
    VITE_GOOGLE_CLIENT_SECRET: d.googleClientSecret,
  }
  for (const [name, value] of Object.entries(secretMap)) {
    if (!value) { console.log(`  - ${name}: فارغ — سيُترك بلا قيمة (يمكن ضبطه لاحقاً)`); continue }
    await gh(`/repos/${owner}/${repoName}/actions/secrets/${name}`, {
      method: 'PUT',
      body: { encrypted_value: toSealedBox(value, pub.key, sodium), key_id: pub.key_id },
      token,
    })
    console.log(`  - ${name} ✓`)
  }
}

async function gitInitPush(outDir, owner, repoName, token, ghUser) {
  runGit(['init', '-b', 'main'], outDir)
  runGit(['config', 'user.name', ghUser.name || owner], outDir)
  runGit(['config', 'user.email', `${ghUser.id}+${owner}@users.noreply.github.com`], outDir)
  runGit(['add', '-A'], outDir)
  runGit(['commit', '-m', 'init: client system (generated by client factory)'], outDir)
  runGit(['remote', 'add', 'origin', `https://github.com/${owner}/${repoName}.git`], outDir)
  try {
    runGit(['push', `https://${owner}:${token}@github.com/${owner}/${repoName}.git`, 'main'], outDir)
  } catch (e) {
    console.log('  تنبيه: push عادي مرفوض — إعادة توليد لنفس العميل، إعادة الدفع قسرياً')
    runGit(['push', '-f', `https://${owner}:${token}@github.com/${owner}/${repoName}.git`, 'main'], outDir)
  }
}

async function waitForDeploy(owner, repoName, token, timeoutMs = 180000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const runs = await gh(`/repos/${owner}/${repoName}/actions/runs?per_page=1`, { token })
      const run = runs.workflow_runs && runs.workflow_runs[0]
      if (run && run.status === 'completed') return run.conclusion === 'success'
    } catch { /* transient */ }
    await new Promise((r) => setTimeout(r, 10000))
  }
  return false
}

// =============================================================================
// MAIN
// =============================================================================
const data = await askClientData()

if (!DRY_RUN && !TOKEN) throw new Error('لم يوجد GITHUB_TOKEN — ضعه في متغير البيئة GITHUB_TOKEN')

console.log('\n===== ملخص العميل الجديد =====')
console.log(`العميل: ${data.appName} (${data.clientId})`)
console.log(`المستودع: ${data.repoName}  |  المجلد: ${data.outDir}`)
console.log(`Firebase: ${data.firebase.projectId}  |  Sheets: ${data.spreadsheetId}`)

if (DRY_RUN) {
  console.log('\n[DRY-RUN] لا إنشاء فعلي. ملف config.js المتوقع:')
  console.log('──────────────────────────────────────────────')
  console.log(buildConfigSource(data))
  console.log('──────────────────────────────────────────────')
  process.exit(0)
}

const configSource = buildConfigSource(data)

console.log('\n- نسخ القالب لمجلد العميل ...')
copyTemplate(data.outDir)
writeFileSync(join(data.outDir, 'src', 'client', 'config.js'), configSource, 'utf8')
setViteBase(data.outDir, data.repoName)
setHtmlTitle(data.outDir, data.appName)
console.log('  config.js تم توليده')

const { owner } = await createRepo(data.repoName, TOKEN)
await setSecrets(owner, data.repoName, data, TOKEN)

console.log('\n- رفع الكود (git init/commit/push) ...')
const ghUser = await gh('/user', { token: TOKEN })
gitInitPush(data.outDir, owner, data.repoName, TOKEN, ghUser)
console.log('  تم الرفع — النشر يعمل الآن على GitHub Actions')

console.log('\n- انتظار النشر (حتى 3 دقائق) ...')
const ok = await waitForDeploy(owner, data.repoName, TOKEN)

console.log('\n═══════════════════════════════════════════════')
console.log(`✅ تم إنشاء نظام "${data.appName}"`)
console.log(`   الرابط الجاهز للتسليم: https://${owner}.github.io/${data.repoName}/`)
console.log(`   المستودع: https://github.com/${owner}/${data.repoName}`)
console.log(`   المجلد المحلي: ${data.outDir}`)
console.log(`   حالة النشر: ${ok ? 'نجح ✓' : 'قيد المراجعة (افحص الـ Actions)'}`)
console.log('═══════════════════════════════════════════════')
