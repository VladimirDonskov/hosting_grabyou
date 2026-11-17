// Run through playwright-skill/run.js. TARGET_URL selects a served production build.
// PW_ARTIFACT_DIR selects screenshot output. PW_PREVIEW=1 opens a fixture toolbar;
// close that browser window to finish. No requests are sent to the real partner API.
const {chromium, expect} = require('playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {version} = require('../src/data/partner-consent.json');

const target = (process.env.TARGET_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const artifacts = process.env.PW_ARTIFACT_DIR || path.join(os.tmpdir(), 'grabyou-audit');
const fixtures = {
  'Demo data': {name: 'Пекарня на Лиговском', address: 'Санкт-Петербург, Лиговский проспект, 30', phone: '+7 (900) 000-00-00', email: 'partner@example.test'},
  'Worst case': {name: 'Кофейня-пекарня «Wiśniewska-Kowalczyk & Сыновья» 🥐 — гастрономическая мастерская', address: 'Санкт-Петербург, набережная канала Грибоедова, торговая галерея «Большой Гостиный Двор», павильон на втором этаже', phone: '+44 (20) 7946-0958', email: 'bartholomew.fitzgerald@northwind-industries-holdings.example.test'},
  Empty: {name: '', address: '', phone: '', email: ''},
};
fs.mkdirSync(artifacts, {recursive: true});

async function fill(page, values) {
  for (const [name, value] of Object.entries(values)) await page.locator(`dialog input[name="${name}"]`).fill(value);
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'document has horizontal overflow').toBe(true);
}
async function noClippedActions(page) {
  const clipped = await page.locator('main h1, main h2, main h3, main button, main [class*="cardCta"], main [class*="faqPlus"]').evaluateAll(elements => elements.flatMap(e => {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height || e.closest('[class*="shots"], [class*="offerStrip"]')) return [];
    return r.left < -1 || r.right > innerWidth + 1 ? [{text: e.textContent.trim().slice(0, 80), left: r.left, right: r.right}] : [];
  }));
  expect(clipped, 'important content is clipped by the viewport').toEqual([]);
}
async function capture(page, name, fullPage = true) {
  await page.screenshot({path: path.join(artifacts, `${name}.png`), fullPage});
}
async function visit(page, route = '') {
  await page.goto(`${target}/${route}`);
  await expect(page.locator('.navbar__logo img:visible').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  // Docusaurus hydrates its mobile controls after the document load event.
  if (page.viewportSize().width <= 996) await expect(page.locator('.navbar__toggle')).toBeVisible();
}

(async () => {
  const browser = await chromium.launch({headless: false});
  const errors = [];
  const context = await browser.newContext({colorScheme: 'light'});
  const fontOrigins = new Set();
  context.on('request', request => {
    if (request.resourceType() === 'font') fontOrigins.add(new URL(request.url()).origin);
  });
  context.on('page', p => p.on('pageerror', e => errors.push(e.message)));
  await context.route('**/*', route => route.request().method() === 'POST' ? route.abort('blockedbyclient') : route.continue());
  // Every API path is mocked at context level, including any configurable host.
  await context.route('**/api/partner', route => route.fulfill({status: 502, contentType: 'application/json', body: '{"ok":false}'}));
  const page = await context.newPage();
  try {
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({width, height: 900});
      for (const [name, route] of [['home', ''], ['download', 'download'], ['partners', 'partners'], ['privacy', 'privacy'], ['soglasie', 'soglasie']]) {
        await visit(page, route);
        await expect(page.locator('h1')).toHaveCount(1);
        for (const image of await page.locator('main img').all()) {
          await image.scrollIntoViewIfNeeded();
          await expect.poll(() => image.evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true);
        }
        await page.evaluate(() => {
          document.querySelectorAll('[class*="shots"], [class*="offerStrip"]').forEach(e => e.scrollTo({left: 0, behavior: 'instant'}));
          scrollTo({top: 0, behavior: 'instant'});
        });
        await noOverflow(page);
        await noClippedActions(page);
        expect(await page.locator('main img').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0)), `${name}: image failed`).toBe(true);
        await capture(page, `after-${name}-${width}`);
        await capture(page, `after-${name}-${width}-top`, false);
      }
      await visit(page);
      await page.getByRole('link', {name: 'Открыть GrabYou', exact: true}).first().click();
      await expect(page).toHaveURL(/\/download\/?$/);
      const destinations = ['https://www.rustore.ru/catalog/app/com.grabyou.app', 'https://t.me/GrabYou_bot', 'https://vk.com/app54610417'];
      for (const href of destinations) await expect(page.locator(`main a[href="${href}"]`)).toHaveAttribute('target', '_blank');
      if (width <= 996) {
        await page.locator('.navbar__toggle').click();
        await expect(page.locator('.navbar__toggle')).toHaveAttribute('aria-expanded', 'true');
        await page.keyboard.press('Escape');
        await expect(page.locator('.navbar__toggle')).toHaveAttribute('aria-expanded', 'false');
        await page.locator('.navbar__toggle').click();
        await page.locator('.navbar-sidebar').getByRole('link', {name: 'Партнёрам', exact: true}).click();
        await expect(page).toHaveURL(/\/partners\/?$/);
      }
      console.log(`PASS: ${width}px pages, images, overflow, primary action and links`);
    }

    await page.setViewportSize({width: 1440, height: 900});
    await visit(page);
    await page.getByRole('link', {name: 'Как это работает', exact: true}).first().click();
    await expect(page).toHaveURL(/#how-it-works$/);
    await expect.poll(() => page.locator('#how-it-works').evaluate(e => Math.round(e.getBoundingClientRect().top))).toBeGreaterThanOrEqual(68);
    await expect.poll(() => page.locator('#how-it-works').evaluate(e => e.getBoundingClientRect().top)).toBeLessThan(150);
    await page.keyboard.press('Home');
    await visit(page, 'partners');
    const faq = page.getByRole('button', {name: 'Сколько стоит подключение?'});
    await faq.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    expect(await faq.evaluate(e => { const s = getComputedStyle(e); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0; }), 'keyboard focus has a visible outline').toBe(true);
    await page.keyboard.press('Enter');
    await expect(faq).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#partner-faq-answer-0')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('#partner-faq-answer-0')).toBeHidden();

    await page.setViewportSize({width: 390, height: 844});
    await visit(page, 'partners');
    const trigger = page.getByRole('button', {name: 'Стать партнёром', exact: true}).first();
    await trigger.focus(); await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', {name: 'Стать партнёром', exact: true});
    await expect(dialog).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeFocused();
    expect(await dialog.evaluate(e => e.dataset.motion)).toBe('false');
    // Chromium may visit browser chrome (activeElement BODY); underlying page controls stay inert.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.querySelector('dialog:modal') && (document.activeElement === document.body || !!document.activeElement.closest('dialog')))).toBe(true);
    }
    const submit = dialog.getByRole('button', {name: 'Отправить заявку'});
    await submit.click();
    expect(await page.locator('input[name="name"]').evaluate(e => e.validity.valueMissing)).toBe(true);
    await expect(dialog.locator('input[name="phone"]')).toHaveValue('+7');
    const consent = dialog.getByRole('checkbox', {name: /^Даю согласие/});
    const policy = dialog.getByRole('checkbox', {name: /^Подтверждаю/});
    await expect(consent).not.toBeChecked();
    await expect(policy).not.toBeChecked();
    for (const route of ['soglasie', 'privacy']) {
      const [documentPage] = await Promise.all([
        context.waitForEvent('page'),
        dialog.locator(`a[href$="/${route}"]`).click(),
      ]);
      await documentPage.waitForLoadState();
      await expect(documentPage.locator('main')).toContainText(
        route === 'privacy' ? 'Донсков Владимир Дмитриевич' : 'Донскову Владимиру Дмитриевичу',
      );
      expect(new URL(documentPage.url()).origin).toBe(new URL(target).origin);
      await documentPage.close();
    }
    await expect(dialog).toBeVisible();
    await expect(consent).not.toBeChecked();
    await expect(policy).not.toBeChecked();
    await fill(page, fixtures['Demo data']);
    await submit.click();
    expect(await consent.evaluate(e => e.validity.valueMissing)).toBe(true);
    await consent.check();
    await submit.click();
    expect(await policy.evaluate(e => e.validity.valueMissing)).toBe(true);
    await policy.check();
    await fill(page, {...fixtures['Demo data'], name: '   '});
    await submit.click();
    expect(await page.locator('input[name="name"]').evaluate(e => e.validationMessage)).toContain('пробелов');
    await fill(page, {...fixtures['Demo data'], phone: 'не телефон'}); await submit.click();
    expect(await page.locator('input[name="phone"]').evaluate(e => e.validity.customError)).toBe(true);
    await fill(page, {...fixtures['Demo data'], email: 'wrong-address'}); await submit.click();
    expect(await page.locator('input[name="email"]').evaluate(e => e.validity.typeMismatch)).toBe(true);
    await fill(page, fixtures['Worst case']);
    await capture(page, 'after-form-worst-case', false);
    await noOverflow(page);
    await page.keyboard.press('Escape'); await expect(dialog).toBeHidden(); await expect(trigger).toBeFocused();
    await trigger.click(); await expect(page.locator('input[name="name"]')).toHaveValue(fixtures['Worst case'].name);
    await page.locator('input[name="name"]').fill('Я');
    await page.locator('input[name="name"]').fill(fixtures['Worst case'].name.repeat(6));
    expect(await page.locator('input[name="name"]').inputValue()).toHaveLength(300);
    await fill(page, fixtures['Worst case']);
    await submit.click(); await expect(dialog.getByRole('alert')).toContainText('Не получилось отправить');
    await capture(page, 'after-form-error', false);
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    let payload;
    await context.route('**/api/partner', async route => { payload = route.request().postDataJSON(); await pending; await route.fulfill({status: 200, contentType: 'application/json', body: '{"ok":true}'}); });
    await submit.click(); await expect(dialog.locator('form')).toHaveAttribute('aria-busy', 'true');
    await expect(dialog.getByRole('button', {name: 'Отправляем…', exact: true})).toBeDisabled();
    await capture(page, 'after-form-loading', false);
    release();
    await expect(page.getByRole('heading', {name: 'Заявка отправлена!'})).toBeFocused();
    expect(payload).toEqual({...fixtures['Worst case'], consent: true, policyRead: true, documentVersion: version});
    await capture(page, 'after-form-success', false);
    await page.getByRole('button', {name: 'Отлично'}).click(); await trigger.click();
    await expect(page.locator('input[name="name"]')).toHaveValue('');
    await expect(consent).not.toBeChecked();
    await expect(policy).not.toBeChecked();
    await fill(page, fixtures['Demo data']); await consent.check(); await policy.check();
    await context.route('**/api/partner', route => route.fulfill({status: 409, contentType: 'application/json', body: '{"ok":false}'}));
    await submit.click(); await expect(dialog.getByRole('alert')).toContainText('Документы обновились');
    await expect(consent).not.toBeChecked(); await expect(policy).not.toBeChecked();
    await page.keyboard.press('Escape');
    console.log('PASS: FAQ, keyboard, dialog focus/draft, empty/invalid/long fields, API error/retry/loading/success');

    for (const width of [320, 768]) {
      await page.setViewportSize({width, height: 900});
      for (const route of ['', 'download', 'partners', 'privacy', 'soglasie']) {
        await visit(page, route);
        await page.evaluate(() => document.documentElement.style.fontSize = '200%');
        await noOverflow(page);
        await noClippedActions(page);
      }
    }
    const reduced = await browser.newContext({colorScheme: 'dark', reducedMotion: 'reduce', viewport: {width: 390, height: 844}});
    await reduced.route('**/*', route => route.request().method() === 'POST' ? route.abort('blockedbyclient') : route.continue());
    await reduced.route('**/api/partner', route => route.fulfill({status: 502, contentType: 'application/json', body: '{"ok":false}'}));
    const reducedPage = await reduced.newPage();
    for (const [name, route] of [['home', ''], ['download', 'download'], ['partners', 'partners']]) {
      await visit(reducedPage, route); await noOverflow(reducedPage); await capture(reducedPage, `after-${name}-dark-reduced`, false);
      expect(await reducedPage.evaluate(() => document.getAnimations().filter(a => a.effect?.getComputedTiming().iterations === Infinity).length)).toBe(0);
    }
    await reducedPage.getByRole('button', {name: 'Стать партнёром', exact: true}).first().click();
    await expect(reducedPage.getByRole('dialog', {name: 'Стать партнёром', exact: true})).toHaveCSS('transform', 'none');
    await reduced.close();
    expect([...fontOrigins], 'fonts are served by the site').toEqual([new URL(target).origin]);
    expect(errors).toEqual([]);
    console.log(`PASS: 320px, 200% text, dark/reduced motion, no JavaScript errors. Screenshots: ${artifacts}`);

    if (process.env.PW_PREVIEW === '1') {
      await visit(page, 'partners'); await trigger.click();
      await page.exposeFunction('selectFixture', name => fill(page, fixtures[name]));
      await page.evaluate(names => {
        const toolbar = document.createElement('div');
        toolbar.setAttribute('aria-label', 'QA fixtures');
        toolbar.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);padding:6px;background:#ddd;border-radius:12px;display:flex;gap:4px;z-index:10000;font:14px system-ui';
        for (const name of names) { const button = document.createElement('button'); button.textContent = name; button.style.cssText = 'background:white;border:0;padding:8px;border-radius:8px;white-space:nowrap'; button.onclick = () => window.selectFixture(name); toolbar.append(button); }
        document.querySelector('dialog[open]').append(toolbar);
      }, Object.keys(fixtures));
      await page.waitForEvent('close', {timeout: 0});
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
