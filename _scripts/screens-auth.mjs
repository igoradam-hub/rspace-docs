// Screenshots for authenticated LK and admin pages.
// Credentials: `_scripts/.auth-creds.json` (gitignored).
// Schema:
//   { "lk": {"phone":"9123456779","password":"…"},
//     "admin": {"login":"superadmin","password":"…"} }

import { chromium } from 'playwright';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'assets', 'screenshots');
const CREDS_PATH = path.join(ROOT, '_scripts', '.auth-creds.json');

if (!existsSync(CREDS_PATH)) {
  console.error('❌ Нет', CREDS_PATH);
  process.exit(1);
}
const CREDS = JSON.parse(readFileSync(CREDS_PATH, 'utf-8'));

mkdirSync(path.join(OUT, 'lk'), { recursive: true });
mkdirSync(path.join(OUT, 'admin'), { recursive: true });

async function save(page, category, name) {
  const file = path.join(OUT, category, `${name}.png`);
  await page.evaluate(() => {
    document.querySelectorAll('[id*="jivo" i], [class*="jivo" i], iframe[src*="jivo" i]').forEach(el => { el.style.display = 'none'; });
  }).catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: file, fullPage: false });
  console.log('  ✓', category + '/' + name);
}

async function gotoSafe(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
  } catch {
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch {}
  }
  await page.waitForTimeout(1500);
}

async function loginLK(ctx) {
  const page = await ctx.newPage();
  await gotoSafe(page, 'https://lk.rspace.pro/');
  if (page.url().includes('/my')) {
    console.log('✓ LK уже авторизован');
    await page.close();
    return;
  }
  console.log('🔑 Логинюсь в LK...');
  const phoneInput = page.locator('input[type="tel"], input[name*="phone" i]').first();
  const passInput = page.locator('input[type="password"]').first();
  await phoneInput.waitFor({ timeout: 10000 });
  await phoneInput.click();
  await phoneInput.press('Control+a');
  await phoneInput.press('Backspace');
  // Печатаем только 10 цифр — маска сама поставит +7
  await phoneInput.type(CREDS.lk.phone.replace(/^\+?7?/, ''), { delay: 80 });
  await page.waitForTimeout(300);
  await passInput.click();
  await passInput.fill(CREDS.lk.password);
  await page.waitForTimeout(300);
  const submit = page.locator('button[type="submit"], button:has-text("Войти"), button:has-text("ВОЙТИ")').first();
  if (await submit.count() > 0) await submit.click();
  else await passInput.press('Enter');
  try {
    await page.waitForURL(/\/my/, { timeout: 20000 });
    console.log('✓ Залогинен в LK');
  } catch {
    console.log('⚠️ Логин в LK не прошёл — проверь креды.');
    await page.close();
    throw new Error('LK login failed');
  }
  await page.waitForTimeout(1500);
  await page.close();
}

async function loginAdmin(ctx) {
  const page = await ctx.newPage();
  await gotoSafe(page, 'https://admin.rspace.pro/');
  if (page.url().includes('/console')) {
    console.log('✓ Admin уже авторизован');
    await page.close();
    return true;
  }
  console.log('🔑 Логинюсь в Admin...');
  // Первое текстовое поле = логин. Подхватим любое: email / tel / text / без типа
  const loginInput = page.locator('input:not([type="password"]):not([type="checkbox"]):not([type="submit"])').first();
  const passInput = page.locator('input[type="password"]').first();
  await loginInput.waitFor({ timeout: 10000 });
  await loginInput.click();
  await loginInput.fill(CREDS.admin.login);
  await page.waitForTimeout(200);
  await passInput.click();
  await passInput.fill(CREDS.admin.password);
  await page.waitForTimeout(200);
  const submit = page.locator('button[type="submit"], button:has-text("Войти"), button:has-text("ВОЙТИ")').first();
  if (await submit.count() > 0) await submit.click();
  else await passInput.press('Enter');
  try {
    await page.waitForURL(/\/console/, { timeout: 20000 });
    console.log('✓ Залогинен в Admin');
  } catch {
    console.log('⚠️ Логин в Admin не прошёл — проверь креды.');
    await page.close();
    return false;
  }
  await page.waitForTimeout(1500);
  await page.close();
  return true;
}

// ─── Main ───────────────────────────────────
const browser = await chromium.launch({ headless: false });

// ── LK ── (отдельный контекст!)
const lkCtx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: 'ru-RU',
});
try {
  await loginLK(lkCtx);
  const page = await lkCtx.newPage();
  console.log('\n📸 LK (авторизованная часть)');
  await gotoSafe(page, 'https://lk.rspace.pro/my');
  await save(page, 'lk', 'lk-dashboard');

  await gotoSafe(page, 'https://lk.rspace.pro/my/listing');
  await save(page, 'lk', 'lk-objects-list');

  const firstEdit = await page.$('a[href*="/edit"]');
  if (firstEdit) {
    const href = await firstEdit.getAttribute('href');
    await gotoSafe(page, 'https://lk.rspace.pro' + href);
    await save(page, 'lk', 'lk-object-edit');
  }

  await gotoSafe(page, 'https://lk.rspace.pro/my/services');
  await save(page, 'lk', 'lk-services-shelf');

  await gotoSafe(page, 'https://lk.rspace.pro/my/subscription');
  await save(page, 'lk', 'lk-subscription');

  await gotoSafe(page, 'https://lk.rspace.pro/my/withdrawal');
  await save(page, 'lk', 'lk-withdrawal');

  await gotoSafe(page, 'https://lk.rspace.pro/my/profile');
  await save(page, 'lk', 'lk-profile');

  await page.close();
} catch (e) {
  console.log('LK section error:', e.message);
}
await lkCtx.close();

// ── Admin ── (совсем отдельный контекст, своя сессия)
const adCtx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: 'ru-RU',
});
try {
  const isAdmin = await loginAdmin(adCtx);
  if (isAdmin) {
    const page = await adCtx.newPage();
    console.log('\n📸 Admin');
    const adminUrls = [
      ['admin-users-list', 'https://admin.rspace.pro/console/users'],
      ['admin-user-card', 'https://admin.rspace.pro/console/users/1'],
      ['admin-plans-list', 'https://admin.rspace.pro/console/plans'],
      ['admin-services-catalog', 'https://admin.rspace.pro/console/services'],
      ['admin-scorings', 'https://admin.rspace.pro/console/scorings'],
      ['admin-service-orders', 'https://admin.rspace.pro/console/service-orders'],
      ['admin-leads-developers', 'https://admin.rspace.pro/console/leads'],
      ['admin-promo-codes', 'https://admin.rspace.pro/console/promo-codes'],
      ['admin-ai-prompts', 'https://admin.rspace.pro/console/prompts'],
      ['admin-administrators', 'https://admin.rspace.pro/console/administrators'],
      ['admin-balance-transactions', 'https://admin.rspace.pro/console/balance-transactions'],
      ['admin-withdrawal-orders', 'https://admin.rspace.pro/console/withdrawal-orders'],
      ['admin-calls', 'https://admin.rspace.pro/console/publishing-calls'],
    ];
    for (const [name, url] of adminUrls) {
      await gotoSafe(page, url);
      await save(page, 'admin', name);
    }
    await gotoSafe(page, 'https://admin.rspace.pro/console/plans');
    const levelsTab = await page.$('button:has-text("Настройки уровней"), a:has-text("Настройки уровней")');
    if (levelsTab) {
      await levelsTab.click();
      await page.waitForTimeout(800);
      await save(page, 'admin', 'admin-plan-levels');
    }
    await page.close();
  }
} catch (e) {
  console.log('Admin section error:', e.message);
}
await adCtx.close();

console.log('\n✅ Готово.');
await browser.close();
