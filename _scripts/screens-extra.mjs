// Дополнительные скриншоты ЛК:
//  - lk-object-edit (object 977)
//  - lk-dashboard-wallet (зум на блок Кошелёк)
//  - lk-login, lk-registration, lk-password-requirements, lk-reset (incognito)

import { chromium } from 'playwright';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'assets', 'screenshots', 'lk');
const CREDS_PATH = path.join(ROOT, '_scripts', '.auth-creds.json');

mkdirSync(OUT, { recursive: true });

if (!existsSync(CREDS_PATH)) {
  console.error('❌ Нет _scripts/.auth-creds.json');
  process.exit(1);
}
const CREDS = JSON.parse(readFileSync(CREDS_PATH, 'utf-8'));

async function hideJivo(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[id*="jivo" i], [class*="jivo" i], iframe[src*="jivo" i]').forEach(el => { el.style.display = 'none'; });
  }).catch(() => {});
}

async function gotoSafe(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
  } catch {
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch {}
  }
  await page.waitForTimeout(1500);
}

async function save(page, name, clip) {
  const file = path.join(OUT, `${name}.png`);
  await hideJivo(page);
  await page.waitForTimeout(400);
  const opts = { path: file };
  if (clip) opts.clip = clip;
  await page.screenshot(opts);
  console.log('  ✓', name);
}

async function loginLK(ctx) {
  const page = await ctx.newPage();
  await gotoSafe(page, 'https://lk.rspace.pro/');
  if (page.url().includes('/my')) {
    console.log('✓ LK уже авторизован');
    return page;
  }
  console.log('🔑 Логинюсь в LK...');
  const phoneInput = page.locator('input[type="tel"], input[name*="phone" i]').first();
  const passInput = page.locator('input[type="password"]').first();
  await phoneInput.waitFor({ timeout: 10000 });
  await phoneInput.click();
  await phoneInput.press('Control+a'); await phoneInput.press('Backspace');
  await phoneInput.type(CREDS.lk.phone.replace(/^\+?7?/, ''), { delay: 80 });
  await passInput.click();
  await passInput.fill(CREDS.lk.password);
  const submit = page.locator('button[type="submit"], button:has-text("Войти")').first();
  if (await submit.count() > 0) await submit.click();
  else await passInput.press('Enter');
  await page.waitForURL(/\/my/, { timeout: 20000 });
  await page.waitForTimeout(1500);
  return page;
}

// ─── Browser ───────────────────────────────
const browser = await chromium.launch({ headless: false });

// ─── Authenticated shots ───────────────────
const authCtx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: 'ru-RU',
});
try {
  const page = await loginLK(authCtx);

  // 1. Object edit — object 977
  console.log('\n📸 Object edit (977)');
  await gotoSafe(page, 'https://lk.rspace.pro/my/listing/977/edit');
  // Если редирект на /my/listing — значит нет доступа. Скриншотим то что есть.
  await save(page, 'lk-object-edit');

  // 2. Dashboard wallet zoom
  console.log('\n📸 Dashboard wallet (zoom)');
  await gotoSafe(page, 'https://lk.rspace.pro/my');
  // Ищем блок Кошелёк
  const walletHandle = await page.$('text=Кошелёк');
  if (walletHandle) {
    const block = await walletHandle.evaluateHandle(el => {
      // Ищем ближайший родитель-карточку (несколько уровней вверх)
      let cur = el;
      for (let i = 0; i < 8; i++) {
        cur = cur.parentElement;
        if (!cur) break;
        const r = cur.getBoundingClientRect();
        if (r.width > 400 && r.height > 150 && r.width < 1400) return cur;
      }
      return el.parentElement;
    });
    const el = block.asElement();
    if (el) {
      const box = await el.boundingBox();
      if (box) {
        const clip = {
          x: Math.max(0, box.x - 8),
          y: Math.max(0, box.y - 8),
          width: Math.min(1440 - (box.x - 8), box.width + 16),
          height: Math.min(900 - (box.y - 8), box.height + 16),
        };
        await save(page, 'lk-dashboard-wallet', clip);
      }
    }
  } else {
    console.log('⚠️ Блок Кошелёк не найден, пропускаю zoom');
  }

  await page.close();
} catch (e) {
  console.log('LK section error:', e.message);
}
await authCtx.close();

// ─── Public shots (incognito, fresh context) ─
console.log('\n📸 Public LK pages (incognito)');
const pubCtx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: 'ru-RU',
});
const pubPage = await pubCtx.newPage();

// login
await gotoSafe(pubPage, 'https://lk.rspace.pro/');
await save(pubPage, 'lk-login');

// registration
await gotoSafe(pubPage, 'https://lk.rspace.pro/registration');
await save(pubPage, 'lk-registration');

// password requirements — скроллим вниз, чтобы показать блок требований
await pubPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await pubPage.waitForTimeout(600);
await save(pubPage, 'lk-password-requirements');

// reset
await gotoSafe(pubPage, 'https://lk.rspace.pro/reset');
await save(pubPage, 'lk-reset');

await pubCtx.close();

console.log('\n✅ Готово.');
await browser.close();
