// Node 24 (the project's local development version); no additional dependencies.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPublicContent, publicDisplay } from '../src/services/publicLocalization.ts';

test('public presentation preserves originals and only applies the selected language', () => {
  const input = { id: '1', title: 'Original', images: [{ url: '/photo', alt_text: 'Original alt', localization: { language: 'en', values: { alt_text: 'English alt' } } }], localization: { language: 'en', values: { title: 'English title' } } };
  const before = structuredClone(input);
  assert.equal(publicDisplay(input, 'en').title, 'English title');
  assert.equal(publicDisplay(input, 'es').title, 'Original');
  assert.equal(publicDisplay(input, 'en').images[0].alt_text, 'English alt');
  assert.deepEqual(input, before);
});

test('ready responses do not poll, and search parameters are preserved', async t => {
  const urls = [];
  t.mock.method(globalThis, 'fetch', async url => {
    urls.push(url);
    return new Response(JSON.stringify([{ title: 'Original', localization: { language: 'en', values: { title: 'Translated' } } }]), { headers: { 'X-Translation-State': 'ready' } });
  });
  let output;
  await loadPublicContent('/api/v1/search?q=teatro', 'en', new AbortController().signal, data => { output = data; });
  assert.deepEqual(urls, ['/api/v1/search?q=teatro&lang=en']);
  assert.equal(output[0].title, 'Translated');
});

test('a late response after leaving or changing language cannot update the view', async t => {
  let resolve;
  t.mock.method(globalThis, 'fetch', () => new Promise(done => { resolve = done; }));
  const controller = new AbortController();
  let updates = 0;
  const request = loadPublicContent('/api/v1/projects', 'en', controller.signal, () => updates++);
  controller.abort();
  resolve(new Response('[]'));
  await request;
  assert.equal(updates, 0);
});

test('pending content polls once cache is ready; quota fallback ends polling', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let requests = 0;
  const updates = [];
  t.mock.method(globalThis, 'fetch', async () => {
    requests++;
    return new Response(JSON.stringify([{ title: requests === 1 ? 'Original' : 'Translated' }]),
      { headers: { 'X-Translation-State': requests === 1 ? 'pending' : 'ready' } });
  });
  const request = loadPublicContent('/api/v1/projects', 'en', new AbortController().signal, data => updates.push(data));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(updates[0][0].title, 'Original');
  t.mock.timers.tick(3000);
  await request;
  assert.equal(requests, 2);
  assert.equal(updates[1][0].title, 'Translated');
  t.mock.method(globalThis, 'fetch', async () => new Response('[]', { headers: { 'X-Translation-State': 'limited' } }));
  await loadPublicContent('/api/v1/projects', 'en', new AbortController().signal, () => {});
});

test('initial HTTP failure is reported without polling', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 500 }));
  await assert.rejects(loadPublicContent('/api/v1/projects', 'en', new AbortController().signal, () => {}));
});
