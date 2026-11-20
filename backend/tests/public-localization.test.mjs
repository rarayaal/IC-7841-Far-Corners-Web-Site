import test from 'node:test';
import assert from 'node:assert/strict';
import { localizePublicContent } from '../dist/services/public-localization.service.js';

const calls = [];
const translator = { async display(text, lang, source) {
  calls.push({ text, lang, source }); return { text: `[${lang}] ${text}`, state: 'ready' };
} };

test('presentation copies preserve original fields, identifiers and manual translations', async () => {
  calls.length = 0;
  const input = [{ id: 'p1', title: 'Teatro local', title_en: 'Local theatre', description: 'Youth theatre', country: 'CR', image_url: 'https://example.org/a.png' }];
  const before = structuredClone(input);
  const { data, state } = await localizePublicContent(input, 'projects', 'en', translator);
  assert.deepEqual(input, before);
  assert.equal(data[0].title, 'Teatro local');
  assert.equal(data[0].localization.values.title, 'Local theatre');
  assert.equal(data[0].localization.values.description, '[en] Youth theatre');
  assert.deepEqual(calls.map(x => x.text), ['Youth theatre']);
  assert.equal(state, 'ready');
});

test('English-only content can be displayed in Spanish; manual institutional versions win', async () => {
  calls.length = 0;
  const input = [{ page_slug: 'about', language: 'en', title: 'Our history', content: 'We create community theatre.', cta_target: '/donate', images: [{ url: '/image.png', alt_text: 'Young people acting on stage' }] }];
  const es = await localizePublicContent(input, 'institutional', 'es', translator);
  assert.equal(es.data[0].localization.values.content, '[es] We create community theatre.');
  assert.equal(es.data[0].language, 'en');
  assert.equal(es.data[0].cta_target, '/donate');
  calls.length = 0;
  await localizePublicContent([{ ...input[0], images: [] }], 'institutional', 'en', translator);
  assert.equal(calls.length, 0);
});

test('contact addresses, emails, numbers, payment details and links never reach the translator', async () => {
  calls.length = 0;
  const input = ['email', 'phone', 'address', 'sinpe', 'donation_url'].map(channel_type =>
    ({ channel_type, label: 'Contacto', label_en: 'Contact', value: 'private literal', link_url: 'mailto:person@example.org' }));
  const result = await localizePublicContent(input, 'contacts', 'en', translator);
  assert.equal(calls.length, 0);
  assert.ok(result.data.every(x => !Object.hasOwn(x.localization.values, 'value')));
  await localizePublicContent([{ channel_type: 'office_hours', label: 'Horario', value: 'Lunes a viernes' }], 'contacts', 'en', translator);
  assert.ok(calls.some(x => x.text === 'Lunes a viernes'));
});

test('search preserves query, proper names, codes and private/unpublished content', async () => {
  calls.length = 0;
  const input = { query: 'nombre personal escrito por el visitante', events: [{ title: 'MAMMA MIA!', description: 'A musical comedy', venue: 'Monteverde' }], communities: [{ name: 'Monteverde', description: 'Teatro comunitario' }], projects: [{ title: 'Borrador privado', description: 'no publicar', is_published: false }], opportunities: [] };
  const result = await localizePublicContent(input, 'search', 'es', translator);
  assert.equal(result.data.query, input.query);
  assert.equal(result.data.events[0].title, 'MAMMA MIA!');
  assert.equal(result.data.communities[0].name, 'Monteverde');
  assert.ok(!calls.some(x => /privado|no publicar|nombre personal|Monteverde|MAMMA/.test(x.text)));
});

test('pending and quota states are exposed, with original fallback from the shared translator', async () => {
  for (const state of ['pending', 'limited', 'unavailable']) {
    const result = await localizePublicContent([{ title: 'Original' }], 'projects', 'en',
      { display: async text => ({ text, state }) });
    assert.equal(result.state, state);
    assert.equal(result.data[0].localization.values.title, 'Original');
  }
});
