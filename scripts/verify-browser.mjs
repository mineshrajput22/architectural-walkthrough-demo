import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Run against npm run dev or npm run preview. BROWSER_CHANNEL=msedge uses
// installed Edge; otherwise install Chromium with npx playwright install chromium.
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || undefined });
const url = process.argv[2] || 'http://127.0.0.1:5173';
const failures = [];
function check(name, actual, expected) {
  try { assert.deepEqual(actual, expected); console.log(`PASS: ${name}`); }
  catch { failures.push(`${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let releaseScripts;
  const scriptsReady = new Promise(resolve => { releaseScripts = resolve; });
  await page.route('**/*', async route => {
    if (route.request().resourceType() === 'script') await scriptsReady;
    await route.continue();
  });
  await page.addInitScript(() => {
    let draws = 0;
    for (const name of ['drawElements', 'drawArrays']) {
      const original = WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name] = function(...args) {
        if (this.canvas.id === 'scene') draws++;
        return original.apply(this, args);
      };
    }
    new MutationObserver(() => {
      if (document.querySelector('#loading')?.hidden && window.drawsAtReveal === undefined) window.drawsAtReveal = draws;
    }).observe(document, { attributes: true, childList: true, subtree: true });
  });
  await page.goto(url, { waitUntil: 'commit' });
  await page.locator('main').waitFor({ state: 'attached' });
  await page.waitForTimeout(300);
  check('styled shell before JavaScript', await page.locator('main').evaluate(el => getComputedStyle(el).display), 'grid');
  check('loading overlay positioned before JavaScript', await page.locator('#loading').evaluate(el => getComputedStyle(el).position), 'absolute');
  releaseScripts();
  await page.locator('#loading').waitFor({ state: 'hidden' });
  check('model drawn before revealing canvas', await page.evaluate(() => window.drawsAtReveal > 0), true);
  await page.locator('#next').click();
  await page.waitForTimeout(2400);
  check('next space', await page.locator('#tour-counter').textContent(), '02 / 05');
  await page.locator('#space-markers [role="button"]').nth(2).click();
  await page.waitForTimeout(2400);
  check('map marker navigation', await page.locator('#tour-counter').textContent(), '03 / 05');
  await page.locator('#scene').focus();
  const heightBefore = await page.locator('#map-location').textContent();
  await page.keyboard.press('KeyE');
  check('E raises camera', await page.locator('#map-location').textContent() !== heightBefore, true);
  await page.keyboard.press('KeyQ');
  await page.locator('.author-tools summary').click();
  await page.locator('#view-name').fill('Browser check');
  await page.locator('#save-view').click();
  check('save viewpoint', await page.locator('#view-count').textContent(), '06 SPACES');
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#export-views').click();
  check('export tour', (await downloadEvent).suggestedFilename(), 'apartment-tour.json');
  await page.locator('#remove-view').click();
  await page.waitForTimeout(2400);
  check('remove viewpoint', await page.locator('#view-count').textContent(), '05 SPACES');
  await page.locator('#tour-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await page.waitForFunction(() => document.querySelector('#status').textContent.includes('valid tour'));
  check('invalid import preserves tour', await page.locator('#view-count').textContent(), '05 SPACES');
  await page.locator('#fullscreen').click();
  await page.waitForFunction(() => document.querySelector('#fullscreen').getAttribute('aria-label') === 'Exit fullscreen');
  check('fullscreen entry', await page.locator('#fullscreen').getAttribute('aria-label'), 'Exit fullscreen');
  await page.locator('#fullscreen').click();
  await page.locator('#floor-viewer').scrollIntoViewIfNeeded();
  await page.locator('#floor-loading').waitFor({ state: 'hidden' });
  const floor = await page.locator('#floor-scene').boundingBox();
  await page.mouse.move(floor.x + floor.width / 2, floor.y + floor.height / 2);
  await page.mouse.down();
  await page.mouse.move(floor.x + floor.width / 2 + 100, floor.y + floor.height / 2 + 30, { steps: 10 });
  await page.mouse.up();
  await page.mouse.wheel(0, -200);
  await page.locator('#floor-reset').click();
  check('floor viewer and reset available', await page.locator('#floor-reset').isEnabled(), true);
  check('desktop runtime errors', errors, []);

  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await phone.goto(url);
  await phone.locator('#loading').waitFor({ state: 'hidden' });
  await phone.evaluate(() => {
    document.querySelector('#viewer').requestFullscreen = undefined;
    document.querySelector('#viewer').webkitRequestFullscreen = undefined;
  });
  await phone.locator('#fullscreen').click();
  check('phone fullscreen fallback', await phone.locator('#viewer').evaluate(el => el.classList.contains('pseudo-fullscreen')), true);
  await phone.locator('#fs-toggle').click();
  const stick = await phone.locator('#stick').boundingBox();
  await phone.locator('#stick').dispatchEvent('pointerdown', { pointerId: 9, clientX: stick.x + 56, clientY: stick.y + 20, pointerType: 'touch' });
  await phone.evaluate(() => window.dispatchEvent(new Event('blur')));
  check('joystick stops on lost focus', await phone.locator('#stick').evaluate(el => el.classList.contains('active')), false);
  await phone.locator('#fullscreen').click();
  check('fullscreen restores scroll', await phone.evaluate(() => document.body.style.overflow), '');
  check('phone has no horizontal overflow', await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

  const failedModel = await browser.newPage();
  await failedModel.route('**/*apartment-demo*.glb*', route => route.request().resourceType() === 'script' ? route.continue() : route.abort());
  await failedModel.goto(url);
  await failedModel.waitForFunction(() => document.querySelector('#loading h2').textContent.includes('could not load'));
  check('failed model keeps loading/error overlay', await failedModel.locator('#loading').isVisible(), true);
  check('failed model keeps movement disabled', await failedModel.locator('#walk').isDisabled(), true);
  if (failures.length) throw new Error(failures.join('\n'));
} finally { await browser.close(); }
