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

coming soon.

## notes on fairness

- every cms returns its own default response shape, so response sizes differ (wordpress sends the most per post).
  that's part of what you get out of the box, so it's left as is.
- nobody gets tuned. no php-fpm tweaks, no node cluster mode, no redis, no cdn. this is "i installed it and shipped it".
- if you think a setup is wrong or unfair, open an issue or a pr and i'll rerun it.
