# stresix showdowns

head to head load tests of popular self hosted apps, run with [stresix](https://stresix.com).
every app gets the same server, the same load and the same job, so the only thing that changes is the app.

## cms showdown: wordpress vs ghost vs strapi vs payload vs directus

**the job:** serve the public "list posts" api with 10 identical posts in it.

**the setup (same for all 5):**
- one fresh hetzner cx33 (4 shared vcpu, 8 gb ram, about $8/month)
- the app plus its usual database in one docker compose stack, default production config, no caching added
- 10 identical posts, seeded on first boot
- 2,500 virtual users ramping up over 10 minutes, all hitting the endpoint below

| cms | branch | database | endpoint |
| --- | --- | --- | --- |
| wordpress 6.8 | [`wordpress`](../../tree/wordpress) | mysql 8.4 | `/?rest_route=/wp/v2/posts&per_page=10` |
| ghost 6 | [`ghost`](../../tree/ghost) | mysql 8.4 | `/ghost/api/content/posts/?key=...&limit=10` |
| strapi 5 | [`strapi`](../../tree/strapi) | postgres 17 | `/api/posts?pagination[pageSize]=10` |
| payload 3 | [`payload`](../../tree/payload) | postgres 17 | `/api/posts?limit=10` |
| directus 11 | [`directus`](../../tree/directus) | postgres 17 | `/items/posts?limit=10` |

each branch has the compose file at the root, so you can point stresix (or `docker compose up`) at it directly.
the same files are in the folders on `main` if you just want to read them.

wordpress, ghost and directus use their official images. strapi and payload don't ship one, so those are
the stock `create-strapi-app` project and payload's `with-postgres` template, built in production mode.

## results

full write up with the caveats: [stresix.com/reports/cms-load-test](https://stresix.com/reports/cms-load-test/)

| cms | held about | p95 under 100 users | errors | what ran out first |
| --- | --- | --- | --- | --- |
| payload 3 | 360 to 490 rps (peak 547) | 160 ms | none | one node thread, box ~40% busy |
| strapi 5 | 260 to 290 rps | 240 ms | none, but p95 near 10 s by the end | one node thread, box ~40% busy |
| directus 11 | 175 to 220 rps | 320 ms | fast 503s from ~1,250 users (built in pressure limiter) | one node thread, box ~35 to 40% busy |
| ghost 6 | 100 to 115 rps | 560 ms | 429s from ~3.5 min in (all load comes from one ip) | one node thread, box ~37% busy |
| wordpress 6.8 | 75 to 78 rps | 950 ms | 71% timed out after 10 s | all 4 cores at 100% from the first second |

the short version: the four node cmses each maxed out one core and left about 60% of the server idle, so a bigger
server won't help them until they run more processes. wordpress was the only one that used every core, and it was
still the slowest.

## notes on fairness

- every cms returns its own default response shape, so response sizes differ (wordpress sends the most per post).
  that's part of what you get out of the box, so it's left as is.
- nobody gets tuned. no php-fpm tweaks, no node cluster mode, no redis, no cdn. this is "i installed it and shipped it".
- if you think a setup is wrong or unfair, open an issue or a pr and i'll rerun it.
