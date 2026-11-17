// Run through playwright-skill/run.js against a served build.
// TARGET_URL and PW_ARTIFACT_DIR follow verify-ui.cjs. No real POSTs are allowed.
const {chromium, expect} = require('playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const target = (process.env.TARGET_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
const artifacts = process.env.PW_ARTIFACT_DIR || path.join(os.tmpdir(), 'grabyou-audit');
fs.mkdirSync(artifacts, {recursive: true});

async function visit(page) {
  await page.goto(`${target}/`);
  await page.bringToFront();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('[data-motion="ticker-track"]')).toBeAttached();
}
async function overflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'motion must not create page overflow').toBe(true);
}
async function center(locator) {
  await locator.evaluate(e => e.scrollIntoView({block: 'center', behavior: 'instant'}));
}
async function tickerX(track) {
  return track.evaluate(e => new DOMMatrixReadOnly(getComputedStyle(e).transform).m41);
}
async function seekTicker(track, fraction) {
  return track.evaluate((element, fraction) => {
    const animation = element.getAnimations().find(a => a.effect.target === element);
    if (!animation) throw new Error('Ticker must have an autonomous CSS animation');
    const timing = animation.effect.getTiming();
    animation.pause();
    animation.currentTime = Number(timing.duration) * fraction;
    const groups = element.querySelectorAll('[data-motion="ticker-group"]');
    return {
      duration: Number(timing.duration), iterations: timing.iterations,
      x: new DOMMatrixReadOnly(getComputedStyle(element).transform).m41,
      first: groups[0].getBoundingClientRect().left, second: groups[1].getBoundingClientRect().left,
      properties: animation.effect.getKeyframes().flatMap(({offset, easing, composite, computedOffset, ...properties}) => Object.keys(properties)),
    };
  }, fraction);
}
async function frameDelta(locator) {
  return locator.evaluate(async e => {
    const animation = e.getAnimations().find(a => a.effect.target === e);
    const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await frames();
    const before = animation.currentTime;
    await frames();
    return {delta: animation.currentTime - before, state: animation.playState};
  });
}

(async () => {
  const browser = await chromium.launch({headless: false});
  const errors = [];
  const context = await browser.newContext({colorScheme: 'light'});
  context.on('page', p => p.on('pageerror', e => errors.push(e.message)));
  await context.route('**/*', route => route.request().method() === 'POST' ? route.abort('blockedbyclient') : route.continue());
  const page = await context.newPage();
  try {
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({width, height: 900});
      await visit(page);
      const track = page.locator('[data-motion="ticker-track"]');
      const region = track.locator('xpath=ancestor::*[@data-running][1]');
      const groups = page.locator('[data-motion="ticker-group"]');
      await center(region);
      await expect(region).toHaveAttribute('data-running', 'true');
      await expect(groups).toHaveCount(2);
      expect(await groups.nth(0).textContent()).toBe(await groups.nth(1).textContent());
      const [first, second] = await groups.evaluateAll(elements => elements.map(e => {
        const r = e.getBoundingClientRect();
        return {x: r.x, width: r.width};
      }));
      expect(Math.abs(first.width - second.width), 'copies have equal width').toBeLessThan(1);
      expect(Math.abs(second.x - first.x - first.width), 'copies meet without a gap').toBeLessThan(1);
      expect(first.width, 'one group fills the viewport').toBeGreaterThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth) - 1);
      const scrollPosition = await page.evaluate(() => scrollY);
      const stationaryStart = await tickerX(track);
      expect((await frameDelta(track)).delta, 'ticker advances while the page is stationary').toBeGreaterThan(0);
      expect(await tickerX(track), 'stationary ticker travels right to left').toBeLessThan(stationaryStart);
      expect(await page.evaluate(() => scrollY), 'ticker requires no scrolling').toBe(scrollPosition);
      const start = await seekTicker(track, 0);
      const middle = await seekTicker(track, 0.5);
      const end = await seekTicker(track, 0.9999);
      const next = await seekTicker(track, 1);
      expect(start.duration).toBeGreaterThan(0);
      expect(start.iterations, 'ticker repeats autonomously').toBe(Infinity);
      expect(Math.abs(middle.x + first.width / 2), 'constant right-to-left travel').toBeLessThan(1);
      expect(Math.abs(end.second - start.first), 'identical copy covers the loop seam').toBeLessThan(2);
      expect(Math.abs(next.first - start.first), 'restart preserves the visible sequence').toBeLessThan(1);
      expect(start.properties.every(property => property === 'transform'), 'ticker animates only transform').toBe(true);
      expect(await region.getByRole('button').count(), 'ticker has no visible controls').toBe(0);
      // Discard WAAPI instrumentation before screenshots and the independent AI checks.
      await visit(page); await center(region);
      await expect(region).toHaveAttribute('data-running', 'true');
      await region.screenshot({path: path.join(artifacts, `motion-ticker-${width}.png`)});
      await overflow(page);

      const dots = page.locator('[data-motion="typing-dot"]');
      const reply = page.locator('[data-motion="ai-reply"]');
      const demo = dots.first().locator('xpath=ancestor::*[@data-running][1]');
      await center(demo);
      await expect(demo).toHaveAttribute('data-running', 'true');
      await expect(demo).toHaveAttribute('data-animate', 'true');
      const phases = await dots.evaluateAll(elements => elements.map(e => {
        const animation = e.getAnimations().find(a => a.effect.target === e);
        if (!animation) throw new Error('Typing dot has no animation');
        const timing = animation.effect.getTiming();
        return {delay: timing.delay, duration: timing.duration, iterations: timing.iterations,
          properties: animation.effect.getKeyframes().flatMap(({offset, easing, composite, computedOffset, ...properties}) => Object.keys(properties))};
      }));
      expect(new Set(phases.map(p => p.delay)).size, 'dots have distinct phases').toBe(3);
      expect(phases.every(p => p.duration * p.iterations + p.delay < 5000), 'typing ends within five seconds').toBe(true);
      expect(phases.flatMap(p => p.properties).every(property => ['transform', 'opacity'].includes(property))).toBe(true);
      await page.locator('[class*="aiChat"]').screenshot({path: path.join(artifacts, `motion-ai-typing-${width}.png`)});
      await page.evaluate(() => scrollTo({top: 0, behavior: 'instant'}));
      await expect(demo).toHaveAttribute('data-running', 'false');
      const paused = await frameDelta(dots.first());
      expect(paused.state).toBe('paused'); expect(Math.abs(paused.delta)).toBeLessThan(1);
      await center(demo);
      await expect(demo).toHaveAttribute('data-running', 'true');
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {configurable: true, value: 'hidden'});
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await expect(demo).toHaveAttribute('data-running', 'false');
      expect((await frameDelta(dots.first())).state).toBe('paused');
      await page.evaluate(() => {
        // Control both sides of this synthetic visibility test independently of other browser windows.
        Object.defineProperty(document, 'visibilityState', {configurable: true, value: 'visible'});
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await expect(demo).toHaveAttribute('data-running', 'true');
      await page.bringToFront();
      expect((await frameDelta(reply)).delta, 'reply timeline resumes').toBeGreaterThan(0);
      // Skip the already tested typing cycles and let the last part finish in real time.
      await demo.evaluate(e => {
        for (const animation of e.getAnimations({subtree: true})) {
          const end = animation.effect.getComputedTiming().endTime;
          animation.currentTime = Math.max(animation.currentTime, end - 200);
        }
      });
      await expect(reply).toHaveCSS('opacity', '1');
      await expect(reply).toContainText('букет за 890 ₽');
      await expect(dots.first().locator('..')).toHaveCSS('opacity', '0');
      await page.locator('[class*="aiChat"]').screenshot({path: path.join(artifacts, `motion-ai-${width}.png`)});
      await overflow(page);
      expect(await page.evaluate(() => document.getAnimations().filter(a => a.effect.getComputedTiming().iterations === Infinity && a.effect.target?.dataset.motion !== 'ticker-track').length), 'only the requested ticker can loop').toBe(0);
      console.log(`PASS motion ${width}px: autonomous seamless ticker; finite typing/reply; offscreen/hidden pause; no overflow`);
    }
    for (const width of [390, 1440]) {
      const reduced = await browser.newContext({reducedMotion: 'reduce', colorScheme: 'dark', viewport: {width, height: 900}});
      const reducedPage = await reduced.newPage();
      await visit(reducedPage);
      const track = reducedPage.locator('[data-motion="ticker-track"]');
      await center(track.locator('..'));
      await expect(reducedPage.locator('[data-motion="ticker-group"]').nth(1)).toBeHidden();
      await expect(track).toHaveCSS('transform', 'none');
      const reply = reducedPage.locator('[data-motion="ai-reply"]');
      await center(reply);
      await expect(reply).toHaveCSS('opacity', '1');
      await expect(reducedPage.locator('[data-motion="typing-dot"]').first().locator('..')).toBeHidden();
      expect(await reducedPage.evaluate(() => document.getAnimations().length)).toBe(0);
      await overflow(reducedPage);
      await reduced.close();
    }
    const noScript = await browser.newContext({javaScriptEnabled: false, viewport: {width: 390, height: 900}});
    const noScriptPage = await noScript.newPage();
    await noScriptPage.goto(`${target}/`);
    await expect(noScriptPage.locator('[data-motion="ai-reply"]')).toHaveCSS('opacity', '1');
    await noScript.close();
    expect(errors).toEqual([]);
    console.log(`PASS reduced motion and no-JS: final reply visible, no controls/loops. Screenshots: ${artifacts}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
