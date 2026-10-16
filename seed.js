// adds the one website the load test sends pageviews to, then idles
const base = 'http://umami:3000';
const website = { id: '5d0b1f3e-7a2c-4c3b-9e1d-2f6a8b4c0d11', name: 'showdown', domain: 'showdown.test' };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function seed() {
  for (;;) {
    try {
      const login = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'umami' }),
      });
      if (login.ok) {
        const { token } = await login.json();
        const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        // a missing website is a 200 with an empty body, so look for the id
        const existing = await fetch(`${base}/api/websites/${website.id}`, { headers: auth });
        if (existing.ok && (await existing.text()).includes(website.id)) return console.log('website already there');
        const created = await fetch(`${base}/api/websites`, { method: 'POST', headers: auth, body: JSON.stringify(website) });
        if (created.ok) return console.log('website added');
        console.log('create failed', created.status, await created.text());
      }
    } catch {
      // umami is still starting
    }
    await wait(3000);
  }
}

seed().then(() => setInterval(() => {}, 1 << 30));
