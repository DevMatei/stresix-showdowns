// adds a "showdown" integration with known keys, then the same 10 posts every
// other cms gets through the admin api. safe to run again.
const mysql = require('/var/lib/ghost/current/node_modules/mysql2/promise');
const jwt = require('/var/lib/ghost/current/node_modules/jsonwebtoken');

const API = 'http://ghost:2368/ghost/api/admin';
const INTEGRATION_ID = '5h0wd0wn0000000000000001';
const ADMIN_KEY_ID = '5h0wd0wn0000000000000002';
const ADMIN_SECRET = 'a'.repeat(64);
const CONTENT_KEY_ID = '5h0wd0wn0000000000000003';
const CONTENT_KEY = 'b0b0b0b0b0b0b0b0b0b0b0b0b0'; // used in the tested url
const BODY = '<p>This is one of ten identical test posts. Every CMS in the showdown gets the same ten posts, so the only thing that changes between runs is the CMS itself.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // ghost creates its tables on first boot, wait for it
  while (true) {
    try { if ((await fetch(`${API}/site/`)).ok) break; } catch {}
    await sleep(2000);
  }

  const db = await mysql.createConnection({ host: 'db', user: 'root', password: 'ghost', database: 'ghost' });
  const [[role]] = await db.query("SELECT id FROM roles WHERE name = 'Admin Integration'");
  await db.query("INSERT IGNORE INTO integrations (id, type, name, slug, created_at) VALUES (?, 'custom', 'showdown', 'showdown', NOW())", [INTEGRATION_ID]);
  await db.query("INSERT IGNORE INTO api_keys (id, type, secret, role_id, integration_id, created_at) VALUES (?, 'admin', ?, ?, ?, NOW())", [ADMIN_KEY_ID, ADMIN_SECRET, role.id, INTEGRATION_ID]);
  await db.query("INSERT IGNORE INTO api_keys (id, type, secret, integration_id, created_at) VALUES (?, 'content', ?, ?, NOW())", [CONTENT_KEY_ID, CONTENT_KEY, INTEGRATION_ID]);
  const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM posts WHERE type = 'post' AND title LIKE 'Test post %'");
  await db.end();

  const token = jwt.sign({}, Buffer.from(ADMIN_SECRET, 'hex'), { keyid: ADMIN_KEY_ID, algorithm: 'HS256', expiresIn: '5m', audience: '/admin/' });
  for (let i = count + 1; i <= 10; i++) {
    const res = await fetch(`${API}/posts/?source=html`, {
      method: 'POST',
      headers: { authorization: `Ghost ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ posts: [{ title: `Test post ${i}`, html: BODY, status: 'published' }] }),
    });
    if (!res.ok) throw new Error(`post ${i}: ${res.status} ${await res.text()}`);
  }

  console.log('seed done');
  setInterval(() => {}, 1 << 30);
})();
