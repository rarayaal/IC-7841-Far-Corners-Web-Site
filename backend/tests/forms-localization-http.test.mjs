import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../dist/db.js';
import { translator } from '../dist/services/translation.service.js';

test('Existing routes keep authentication, raw editor data and SELECT-only localization', async () => {
  process.env.JWT_SECRET = 'local-http-check-only-'.repeat(8);
  const { formsRouter } = await import('../dist/routes/forms.routes.js');
  const originalQuery = pool.query;
  const originalDisplay = translator.display;
  const queries = [];
  const sections = [{ name: 'Personal information', description: null }];
  const fields = [{ id: 'field-id', form_type: 'internship', section: 'Personal information', field_key: 'year', label: 'Current year', field_type: 'select', options: ['First Year'], required: true, display_order: 1 }];
  pool.query = async sql => {
    queries.push(sql);
    assert.match(sql.trim(), /^SELECT\b/i, 'Localization must never write to the database');
    if (/SELECT\s+sections\s+FROM forms/i.test(sql)) return { rows: [{ sections }] };
    if (/FROM form_fields/i.test(sql)) return { rows: fields };
    if (/WHERE slug/i.test(sql)) return { rows: [{ slug: 'internship', title: 'Pasantía' }] };
    return { rows: [] };
  };
  translator.display = async (text, language) => ({ text: `${language}:${text}`, state: 'ready' });
  const app = express(); app.use('/api/v1/forms', formsRouter);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1/forms`;
  const token = jwt.sign({ userId: 'test-user', role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const headers = { Authorization: `Bearer ${token}` };
  try {
    const unauthenticated = await fetch(`${base}/internship/fields?lang=es`);
    assert.equal(unauthenticated.status, 401);
    assert.equal(queries.length, 0);
    const invalid = await fetch(`${base}/internship/fields?lang=fr`, { headers });
    assert.equal(invalid.status, 400);
    assert.equal(queries.length, 0);
    const raw = await (await fetch(`${base}/internship/fields`, { headers })).json();
    assert.deepEqual(raw.fields, fields);
    assert.equal(raw.localization, undefined);
    assert.equal(raw.sections[0].name, sections[0].name);
    const localized = await (await fetch(`${base}/internship/fields?lang=es`, { headers })).json();
    assert.deepEqual(localized.fields, fields);
    assert.deepEqual(localized.sections, raw.sections);
    assert.equal(localized.localization.texts['First Year'], 'es:First Year');
    assert.equal(localized.localization.language, 'es');
    assert.ok(queries.length > 0);
  } finally {
    pool.query = originalQuery;
    translator.display = originalDisplay;
    await new Promise(resolve => server.close(resolve));
    await pool.end();
  }
});
