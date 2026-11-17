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
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('[data-motion="ticker-track"]')).toBeAttached();
}
async function overflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'motion must not create page overflow').toBe(true);
}
async function seekTicker(track, fraction) {
  return track.evaluate((e, fraction) => {
    const animation = e.getAnimations().find(a => a.effect.target === e);
    if (!animation) throw new Error('Ticker has no animation');
    const duration = Number(animation.effect.getTiming().duration);
    animation.pause();
    animation.currentTime = duration * fraction;
    const groups = e.querySelectorAll('[data-motion="ticker-group"]');
    return {
      duration,
      x: new DOMMatrixReadOnly(getComputedStyle(e).transform).m41,
      first: groups[0].getBoundingClientRect().left,
      second: groups[1].getBoundingClientRect().left,
      keyframes: animation.effect.getKeyframes().map(({offset, easing, composite, computedOffset, ...properties}) => Object.keys(properties)),
    };
  }, fraction);
}
async function animationDelta(locator) {
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
      const groups = page.locator('[data-motion="ticker-group"]');
      await track.scrollIntoViewIfNeeded();
      await expect(track.locator('xpath=ancestor::*[@data-running][1]')).toHaveAttribute('data-running', 'true');
      await expect(groups).toHaveCount(2);
      expect(await groups.nth(0).textContent()).toBe(await groups.nth(1).textContent());
      const [first, second] = await Promise.all([groups.nth(0).boundingBox(), groups.nth(1).boundingBox()]);
      expect(Math.abs(first.width - second.width), 'loop copies have equal width').toBeLessThan(1);
      expect(first.width, 'one loop group fills the viewport').toBeGreaterThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth) - 1);
      const start = await seekTicker(track, 0);
      const middle = await seekTicker(track, 0.5);
      const end = await seekTicker(track, 0.9999);
      const next = await seekTicker(track, 1);
      expect(middle.x, 'ticker travels right to left').toBeLessThan(start.x);
      expect(Math.abs(middle.x + first.width / 2)).toBeLessThan(1);
      expect(Math.abs(end.second - start.first), 'seam replaces the first group with the identical copy').toBeLessThan(2);
      expect(Math.abs(next.first - start.first), 'loop restart does not change its visible position').toBeLessThan(1);
      expect(start.keyframes.flat().every(property => property === 'transform')).toBe(true);
      // Reload after timeline instrumentation so author CSS owns play state again.
      await visit(page); await track.scrollIntoViewIfNeeded();
      const pause = page.getByRole('button', {name: 'Приостановить бегущую строку', exact: true});
      await pause.click();
      const resume = page.getByRole('button', {name: 'Продолжить бегущую строку', exact: true});
      await expect(track).toHaveCSS('animation-play-state', 'paused');
      const pausedTicker = await animationDelta(track);
      expect(pausedTicker.state).toBe('paused'); expect(Math.abs(pausedTicker.delta)).toBeLessThan(1);
      await resume.click(); await expect(track).toHaveCSS('animation-play-state', 'running');
      expect((await animationDelta(track)).delta).toBeGreaterThan(0);
      await overflow(page);
      await track.locator('xpath=ancestor::*[@data-running][1]').screenshot({path: path.join(artifacts, `motion-ticker-${width}.png`)});

      const dots = page.locator('[data-motion="typing-dot"]');
      await expect(dots).toHaveCount(3);
      await dots.first().scrollIntoViewIfNeeded();
      await expect(dots.first().locator('xpath=ancestor::*[@data-running][1]')).toHaveAttribute('data-running', 'true');
      const phases = await dots.evaluateAll(elements => elements.map(e => {
        const animation = e.getAnimations().find(a => a.effect.target === e);
        if (!animation) throw new Error('Typing dot has no animation');
        const timing = animation.effect.getTiming();
        animation.pause();
        const samples = [0.15, 0.35, 0.55, 0.75].map(fraction => {
          animation.currentTime = Number(timing.duration) * fraction;
          const style = getComputedStyle(e);
          return `${style.opacity}/${style.transform}`;
        });
        return {delay: timing.delay, samples,
          properties: animation.effect.getKeyframes().flatMap(({offset, easing, composite, computedOffset, ...properties}) => Object.keys(properties))};
      }));
      expect(new Set(phases.map(p => p.delay)).size, 'typing dots are staggered').toBe(3);
      expect(phases[0].samples.some((_, sample) => new Set(phases.map(p => p.samples[sample])).size > 1), 'dots occupy different phases').toBe(true);
      expect(phases.flatMap(p => p.properties).every(property => ['transform', 'opacity'].includes(property))).toBe(true);
      await visit(page); await dots.first().scrollIntoViewIfNeeded();
      await page.getByRole('button', {name: 'Приостановить анимацию диалога', exact: true}).click();
      const resumeTyping = page.getByRole('button', {name: 'Продолжить анимацию диалога', exact: true});
      for (const dot of await dots.all()) await expect(dot).toHaveCSS('animation-play-state', 'paused');
      const pausedDot = await animationDelta(dots.first());
      expect(pausedDot.state).toBe('paused'); expect(Math.abs(pausedDot.delta)).toBeLessThan(1);
      await resumeTyping.click();
      expect((await animationDelta(dots.first())).delta).toBeGreaterThan(0);
      await page.locator('[class*="aiChat"]').screenshot({path: path.join(artifacts, `motion-ai-${width}.png`)});
      await overflow(page);
      await page.evaluate(() => scrollTo({top: 0, behavior: 'instant'}));
      await expect(track.locator('xpath=ancestor::*[@data-running][1]')).toHaveAttribute('data-running', 'false');
      await expect(dots.first().locator('xpath=ancestor::*[@data-running][1]')).toHaveAttribute('data-running', 'false');
      // Existing one-time hero/phone effects must never become ambient loops.
      expect(await page.locator('[class*="heroGrid"], [class*="phone"]').evaluateAll(elements => elements.flatMap(e => e.getAnimations()).filter(a => a.effect.getComputedTiming().iterations === Infinity).length)).toBe(0);
      console.log(`PASS motion ${width}px: ticker direction/seam/pause; typing phases/pause; no overflow`);
    }
    for (const width of [390, 1440]) {
      const reduced = await browser.newContext({reducedMotion: 'reduce', colorScheme: 'dark', viewport: {width, height: 900}});
      const reducedPage = await reduced.newPage();
      await visit(reducedPage);
      await reducedPage.locator('[data-motion="ticker-track"]').scrollIntoViewIfNeeded();
      await expect(reducedPage.locator('[data-motion="ticker-group"]').nth(1)).toBeHidden();
      await reducedPage.locator('[data-motion="typing-dot"]').first().scrollIntoViewIfNeeded();
      expect(await reducedPage.evaluate(() => document.getAnimations().filter(a => a.effect.getComputedTiming().iterations === Infinity).length)).toBe(0);
      await overflow(reducedPage);
      await reduced.close();
    }
    expect(errors).toEqual([]);
    console.log(`PASS reduced motion: static ticker/typing and no infinite loops. Screenshots: ${artifacts}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
