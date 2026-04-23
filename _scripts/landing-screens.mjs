// Landing screenshots — runs headless in sandbox
// Output: rspace-docs/assets/screenshots/landing/
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';

const OUT = '/sessions/modest-compassionate-ride/mnt/rspace/rspace-docs/assets/screenshots/landing';
mkdirSync(OUT, { recursive: true });

const BASE = 'https://rspace.pro';

async function save(page, name, opts = {}) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, ...opts });
  console.log('✓', name);
}

async function scrollToText(page, text) {
  await page.evaluate((t) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.includes(t)) {
        node.parentElement.scrollIntoView({ block: 'start', behavior: 'instant' });
        return true;
      }
    }
    return false;
  }, text);
  await page.waitForTimeout(600);
}

async function clip(page, selector) {
  const el = await page.$(selector);
  if (!el) return null;
  const box = await el.boundingBox();
  return box;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  locale: 'ru-RU',
});
const page = await context.newPage();

await page.goto(BASE, { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(1500);

// 1. Hero
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
await save(page, 'landing-hero-desktop');

// 2. About section "О сервисе" — a block with the stats 12/3/8/24·7
await scrollToText(page, 'создан').catch(() => {});
await save(page, 'landing-about-section');

// 3. How you earn — "БЕЗ RSPACE" comparative cards
await scrollToText(page, 'БЕЗ RSPACE').catch(() => scrollToText(page, 'Как вы зарабатываете'));
await save(page, 'landing-earning-cards');

// 4. Features grid
await scrollToText(page, 'Юрист').catch(() => {});
await save(page, 'landing-features-grid');

// 5 & 6. Pricing Moscow / Regions
// Scroll exactly to the "Стоимость подписки" heading
const priceHeading = await page.$('h2:has-text("Стоимость"), h3:has-text("Стоимость")');
if (priceHeading) {
  await priceHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
} else {
  await scrollToText(page, 'Стоимость');
}
// Scroll down a bit so that tariff cards are fully visible (heading is above)
await page.evaluate(() => window.scrollBy(0, 80));
await page.waitForTimeout(400);
// Moscow tab (default) — 3 tariff cards
await save(page, 'landing-pricing-moscow');

// Find the region tab WITHIN the pricing section (not in the comparison table)
// The tabs for pricing block are near the tariff cards
const regionTab = await page.locator('button:has-text("ДРУГОЙ РЕГИОН"), button:has-text("Другой регион")').first();
if (await regionTab.count() > 0) {
  await regionTab.scrollIntoViewIfNeeded();
  await regionTab.click();
  await page.waitForTimeout(700);
  // After clicking, scroll back up to show the tariff cards
  if (priceHeading) {
    await priceHeading.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 80));
    await page.waitForTimeout(400);
  }
  await save(page, 'landing-pricing-regions');
  // Back to Moscow for downstream screens
  const mskTab = page.locator('button:has-text("МОСКВА"), button:has-text("Москва")').first();
  if (await mskTab.count() > 0) await mskTab.click();
  await page.waitForTimeout(400);
}

// 7. RSpace PRO block
await scrollToText(page, 'RSpace PRO').catch(() => {});
await save(page, 'landing-rspace-pro');

// 8. Testimonials
await scrollToText(page, 'Истории').catch(() => scrollToText(page, 'отзыв'));
await save(page, 'landing-testimonials');

// 9. FAQ — expand first question
await scrollToText(page, 'FAQ').catch(() => scrollToText(page, 'Часто задаваемые').catch(() => scrollToText(page, 'вопрос')));
await page.waitForTimeout(400);
// try to click first FAQ item
const faqItem = await page.$('[class*="faq" i] button, [class*="accordion" i] button, summary');
if (faqItem) {
  await faqItem.click().catch(() => {});
  await page.waitForTimeout(500);
}
await save(page, 'landing-faq');

// 10. Footer
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(600);
await save(page, 'landing-footer');

await browser.close();
console.log('DONE');
