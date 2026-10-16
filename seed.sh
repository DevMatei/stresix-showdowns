#!/bin/sh
# adds one user, their team and the site "showdown.test" once plausible has migrated and
# started, then idles. (plausible ce has no api for this without signing up in a browser.)
until wget -q -O /dev/null http://plausible:8000/api/health; do sleep 3; done
until psql -h plausible_db -U postgres -d plausible_db -v ON_ERROR_STOP=1 <<'SQL'
insert into users (id, email, name, inserted_at, updated_at, email_verified)
  values (1, 'showdown@showdown.test', 'showdown', now(), now(), true) on conflict do nothing;
insert into teams (id, name, inserted_at, updated_at, setup_complete)
  values (1, 'showdown', now(), now(), true) on conflict do nothing;
insert into team_memberships (id, role, user_id, team_id, inserted_at, updated_at)
  values (1, 'owner', 1, 1, now(), now()) on conflict do nothing;
insert into sites (id, domain, timezone, team_id, inserted_at, updated_at)
  values (1, 'showdown.test', 'Etc/UTC', 1, now(), now()) on conflict do nothing;
SQL
do sleep 3; done
echo "site ready"
exec sleep infinity
