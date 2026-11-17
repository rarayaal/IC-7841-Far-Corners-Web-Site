import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

process.env.MYMEMORY_ENABLED = 'false';
process.env.MYMEMORY_CACHE_FILE = `/tmp/farcorners-public-test-${process.pid}.json`;
const { pool } = await import('../dist/db.js');
const { projectsRouter } = await import('../dist/routes/projects.routes.js');
const { institutionalRouter } = await import('../dist/routes/institutional.routes.js');
const { contactChannelsRouter } = await import('../dist/routes/contactChannels.routes.js');
const { searchRouter } = await import('../dist/routes/search.routes.js');
const { communitiesRouter } = await import('../dist/routes/communities.routes.js');

test('localized GETs are read-only, opt-in, validated and leave admin reads unchanged', async () => {
  const queries = [];
  const originalQuery = pool.query;
  const project = { id: 'p1', title: 'Proyecto original', description: 'Teatro comunitario', is_published: true };
  pool.query = async (sql, values) => {
    queries.push({ sql, values });
    assert.match(sql.trim(), /^SELECT/i);
    if (sql.includes('FROM institutional_content')) return { rows: [{ page_slug: 'about', title: 'Our story', content: 'Our theatre', language: 'en', display_order: 0, images: [] }] };
    if (sql.includes('FROM contact_channels')) return { rows: [{ label: 'Correo', label_en: 'Email', value: 'info@example.org', channel_type: 'email' }] };
    return { rows: [project] };
  };
  const app = express();
  app.use('/projects', projectsRouter); app.use('/institutional', institutionalRouter);
  app.use('/contacts', contactChannelsRouter); app.use('/search', searchRouter); app.use('/communities', communitiesRouter);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.deepEqual(await (await fetch(`${base}/projects`)).json(), [project]);
    const localized = await fetch(`${base}/projects?lang=en`);
    assert.ok(['ready', 'unavailable', 'limited'].includes(localized.headers.get('x-translation-state')));
    assert.equal((await localized.json())[0].localization.language, 'en');
    assert.deepEqual(await (await fetch(`${base}/projects?admin=true&lang=en`)).json(), [project]);
    assert.equal((await fetch(`${base}/projects?lang=fr`)).status, 400);
    const institution = await (await fetch(`${base}/institutional/history?lang=es`)).json();
    assert.equal(institution[0].localization.language, 'es');
    assert.ok(queries.some(q => q.sql.includes("language IN ('es', 'en')")));
    const contacts = await (await fetch(`${base}/contacts?lang=en`)).json();
    assert.equal(contacts[0].localization.values.label, 'Email');
    assert.equal(contacts[0].value, 'info@example.org');
    const search = await (await fetch(`${base}/search?q=teatro&lang=en`)).json();
    assert.equal(search.query, 'teatro');
    assert.equal(search.projects[0].localization.language, 'en');
    assert.equal((await fetch(`${base}/communities?lang=fr`)).status, 400);
  } finally {
    pool.query = originalQuery;
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await pool.end();
  }
});
