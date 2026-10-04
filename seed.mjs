// creates the posts collection, adds the same 10 posts every other cms gets
// and gives the public role read access. safe to run again.
const API = 'http://directus:8055';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BODY = '<p>This is one of ten identical test posts. Every CMS in the showdown gets the same ten posts, so the only thing that changes between runs is the CMS itself.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>';

let token;
while (!token) {
  try {
    const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'showdown-admin' }) });
    if (res.ok) token = (await res.json()).data.access_token;
  } catch {}
  if (!token) await sleep(2000);
}

const call = async (path, method = 'GET', body) => {
  const res = await fetch(API + path, { method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  if (!res.ok) throw new Error(`${method} ${path} ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
};

const exists = await fetch(`${API}/collections/posts`, { headers: { authorization: `Bearer ${token}` } });
if (!exists.ok) {
  await call('/collections', 'POST', {
    collection: 'posts',
    schema: {},
    meta: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true }, schema: { is_primary_key: true, has_auto_increment: true } },
      { field: 'title', type: 'string' },
      { field: 'body', type: 'text' },
      { field: 'date_created', type: 'timestamp', meta: { special: ['date-created'] } },
    ],
  });
  for (let i = 1; i <= 10; i++) await call('/items/posts', 'POST', { title: `Test post ${i}`, body: BODY });

  // the built in public policy
  const { data } = await call('/policies?filter[name][_eq]=$t:public_label&fields=id');
  await call('/permissions', 'POST', { policy: data[0].id, collection: 'posts', action: 'read', fields: ['*'], permissions: {} });
}

console.log('seed done');
setInterval(() => {}, 1 << 30);
