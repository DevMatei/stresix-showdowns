# stresix showdowns

head to head load tests of popular self hosted apps, run with [stresix](https://stresix.com).
every app gets the same server, the same load and the same job, so the only thing that changes is the app.

## cms showdown: wordpress vs ghost vs strapi vs payload vs directus

**the job:** serve the public "list posts" api with 10 identical posts in it.

**the setup (same for all 5):**
- one fresh hetzner cx33 (4 shared vcpu, 8 gb ram, about $10/month)
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

## analytics showdown: umami vs plausible vs matomo

**the job:** take in pageviews. every request is one pageview sent to the app's own collect endpoint, the same
call its tracking script makes from a visitor's browser.

**the setup (same for all 3):**
- one fresh hetzner cx33 (4 shared vcpu, 8 gb ram, about $10/month)
- the app plus its usual databases in one docker compose stack, based on each project's own compose example, nothing tuned
- one site, created on first boot by the seed service
- 2,500 virtual users ramping up over 10 minutes, each one a separate visitor (its own browser user agent)
  sending pageviews back to back

| app | branch | databases | endpoint |
| --- | --- | --- | --- |
| umami 3.4 | [`umami`](../../tree/umami) | postgres 15 | `POST /api/send` |
| plausible ce 3.2 | [`plausible`](../../tree/plausible) | postgres 16 + clickhouse 24.12 | `POST /api/event` |
| matomo 5.14 | [`matomo`](../../tree/matomo) | mariadb 11.4 | `POST /matomo.php` |

the user agent is a normal chrome one with the virtual user's number as the major version
(`Chrome/{{vu}}.0.0.0`). all three apps build their visitor id from the ip and the browser, so this
gives one visitor per virtual user instead of one giant visitor. i checked that on a test box first: 4 new
user agents made 4 new visitors in each app, and every event landed in the database.

### analytics results

| app | held about | p95 at 100 to 300 users | errors | what ran out first |
| --- | --- | --- | --- | --- |
| plausible ce 3.2 | climbed with the load to 2,250 to 2,290 events/s | 534 ms | none at all | all 4 cores (the erlang vm spreads across them), clickhouse barely used |
| umami 3.4 | 134 to 138 events/s | 1.8 s | timeouts from ~1,350 users, 36% overall | one node thread, box ~50% busy, postgres at 0.7 cores |
| matomo 5.14 | 115 to 160 events/s | 1.7 s | timeouts from ~315 users, 37% overall | all 4 cores on apache + php, mariadb at 0.4 cores |

the short version: plausible took about 15x what the other two did and never returned an error. umami and matomo
ended up close on throughput for opposite reasons: umami stalled on one core with half the server idle, matomo used
every core and was still slow per event.

notes on this one:
- right after the seed, plausible answers `202` with an `x-plausible-dropped` header for about 30 s while it loads
  the new site, and matomo ran 10x faster in the first minute than at any point after it, which lines up with its
  install still finishing. so the first minute (under ~100 users) is left out for both. the raw stresix report for
  plausible counts that minute, so ignore the ~9,200 rps ceiling it shows.
- this only measures taking events in. dashboards and reports (matomo's archiving, umami's and plausible's queries)
  are a separate load and weren't tested.
- matomo's documented way to scale tracking is the queued tracking plugin with redis, and umami would likely do better
  with more than one node process since half the box sat idle. neither was added, same rule as above.
