import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MyMemoryTranslator, splitTranslationText, sourceLanguage } from '../dist/services/translation.service.js';
import { localizePublishedForms, localizeFormStructure } from '../dist/services/forms-localization.service.js';

async function fixture(t, settings = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'farcorners-translation-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const requests = [];
  const cacheFile = join(directory, 'cache.json');
  const fetchImpl = async input => {
    const url = new URL(String(input)); requests.push(url);
    return Response.json({ responseStatus: 200, responseData: { translatedText: `Translated: ${url.searchParams.get('q')}` } });
  };
  const service = new MyMemoryTranslator({ cacheFile, intervalMs: 0, fetchImpl, ...settings });
  return { service, requests, cacheFile, fetchImpl };
}

test('UTF-8 chunks preserve every character, paragraph and option value', () => {
  const text = `  ${'áéíóú🙂 largo '.repeat(140)}\nSecond paragraph.\r\n\n${'x'.repeat(1000)} `;
  const chunks = splitTranslationText(text);
  assert.equal(chunks.join(''), text);
  for (const chunk of chunks) assert.ok(Buffer.byteLength(chunk, 'utf8') <= 450);
  for (const chunk of chunks) if (chunk.includes('\n')) assert.equal(chunk.trim(), '');
});

test('English and Spanish labels use the correct direction', () => {
  assert.equal(sourceLanguage('Full Legal Name (as it appears in your passport)', 'es'), 'en');
  assert.equal(sourceLanguage('Nombre completo', 'en'), 'es');
  assert.equal(sourceLanguage('First Year', 'es'), 'en');
  assert.equal(sourceLanguage('Por favor indique su experiencia', 'en'), 'es');
});

test('Concurrent readers deduplicate provider requests; cache survives a restart', async t => {
  const f = await fixture(t);
  const first = await Promise.all(Array.from({ length: 30 }, () => f.service.display('Personal information', 'es', 'en')));
  assert.ok(first.every(item => item.text === 'Personal information'));
  await f.service.whenIdle();
  assert.equal(f.requests.length, 1);
  const cached = await f.service.display('Personal information', 'es', 'en');
  assert.equal(cached.state, 'ready');
  assert.equal(cached.text, 'Translated: Personal information');
  let restartCalls = 0;
  const restarted = new MyMemoryTranslator({ cacheFile: f.cacheFile, fetchImpl: async () => { restartCalls++; throw Error('unexpected'); } });
  assert.deepEqual(await restarted.display('Personal information', 'es', 'en'), cached);
  assert.equal(restartCalls, 0);
});

test('Daily budget is reserved on disk and is not reset by restarting', async t => {
  const f = await fixture(t, { dailyLimit: 20 });
  await f.service.display('Personal information', 'es', 'en');
  await f.service.whenIdle();
  const disk = JSON.parse(await readFile(f.cacheFile, 'utf8'));
  assert.equal(disk.usage.characters, 20);
  const restarted = new MyMemoryTranslator({ cacheFile: f.cacheFile, dailyLimit: 20, fetchImpl: f.fetchImpl });
  const value = await restarted.display('Preferred name', 'es', 'en');
  assert.equal(value.state, 'limited');
  assert.equal(value.text, 'Preferred name');
  assert.equal(f.requests.length, 1);
});

test('Provider quota messages never become translated labels', async t => {
  let calls = 0;
  const f = await fixture(t, { fetchImpl: async () => {
    calls++;
    return Response.json({ responseStatus: 403, quotaFinished: true, responseData: { translatedText: 'MYMEMORY WARNING: QUOTA' } });
  } });
  await f.service.display('Personal information', 'es', 'en');
  await f.service.whenIdle();
  assert.deepEqual(await f.service.display('Personal information', 'es', 'en'), { text: 'Personal information', state: 'limited' });
  assert.equal(calls, 1);
  assert.equal(Object.keys(JSON.parse(await readFile(f.cacheFile, 'utf8')).entries).length, 0);
});

test('Network failure keeps original content and opens a circuit-breaker', async t => {
  let calls = 0;
  const f = await fixture(t, { fetchImpl: async () => { calls++; throw new Error('network'); } });
  await f.service.display('Personal information', 'es', 'en');
  await f.service.whenIdle();
  const value = await f.service.display('Personal information', 'es', 'en');
  assert.equal(value.text, 'Personal information');
  assert.notEqual(value.state, 'pending');
  assert.equal(calls, 1);
});

test('HTTP 429 with a non-JSON body blocks requests without leaking provider errors', async t => {
  let calls = 0;
  const f = await fixture(t, { fetchImpl: async () => { calls++; return new Response('Too many requests', { status: 429 }); } });
  await f.service.display('Personal information', 'es', 'en');
  await f.service.whenIdle();
  const data = JSON.parse(await readFile(f.cacheFile, 'utf8'));
  assert.ok(data.blockedUntil > Date.now() + 23 * 60 * 60 * 1000);
  assert.equal((await f.service.display('Personal information', 'es', 'en')).text, 'Personal information');
  assert.equal(calls, 1);
});

test('Disabling translation makes no requests', async t => {
  const f = await fixture(t, { enabled: false });
  assert.equal((await f.service.display('Personal information', 'es', 'en')).text, 'Personal information');
  await f.service.whenIdle();
  assert.equal(f.requests.length, 0);
});

test('Manual translations win and original publication rows stay untouched', async t => {
  const f = await fixture(t);
  const forms = [{ slug: 'internship', title: 'Pasantía internacional', title_en: 'Reviewed title', description: 'Experiencia en teatro', description_en: 'Reviewed description', period: null, period_en: null, requirements: { es: ['Experiencia'], en: ['Reviewed requirement'] }, category: 'internship', is_featured: true, image_url: null }];
  const before = JSON.stringify(forms);
  const result = await localizePublishedForms(forms, 'en', f.service);
  await f.service.whenIdle();
  assert.equal(result[0].localization.title, 'Reviewed title');
  assert.equal(result[0].localization.description, 'Reviewed description');
  assert.deepEqual(result[0].localization.requirements, ['Reviewed requirement']);
  assert.equal(f.requests.length, 0);
  assert.equal(JSON.stringify(forms), before);
});

test('Form localization preserves IDs, grouping keys, original options and answers contract', async t => {
  const f = await fixture(t);
  const sections = [{ name: 'Personal information', description: 'Please select your current year' }];
  const fields = [{ id: 'field-id', form_type: 'internship', field_key: 'current_year', section: 'Personal information', label: 'Current year', field_type: 'select', options: ['First Year', 'Second Year'], required: true, display_order: 1 }];
  const before = JSON.stringify({ sections, fields });
  await localizeFormStructure(sections, fields, 'es', f.service);
  await f.service.whenIdle();
  const presentation = await localizeFormStructure(sections, fields, 'es', f.service);
  assert.equal(presentation.texts['First Year'], 'Translated: First Year');
  assert.equal(presentation.state, 'ready');
  assert.equal(JSON.stringify({ sections, fields }), before);
  assert.equal(fields[0].options[0], 'First Year');
  assert.equal(fields[0].section, sections[0].name);
});
