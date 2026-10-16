#!/bin/sh
# clicks through matomo's web installer with the defaults (there is no cli installer),
# which creates the tables, a super user and the first website (idsite 1), then idles.
B=http://matomo/index.php
J="-s -c /tmp/jar -b /tmp/jar"
until curl -sf -o /dev/null "$B?action=databaseSetup"; do sleep 3; done
curl $J -o /dev/null "$B?action=databaseSetup"
curl $J -o /dev/null -X POST "$B?action=databaseSetup" \
  -d host=db -d username=matomo -d password=matomo -d dbname=matomo -d tables_prefix=matomo_ \
  --data-urlencode 'adapter=PDO\MYSQL' -d schema=Mariadb -d submit=Next
curl $J -o /dev/null "$B?action=tablesCreation&module=Installation"
curl $J -o /dev/null -X POST "$B?action=setupSuperUser&module=Installation" \
  -d login=showdown -d password=showdown-password-1 -d password_bis=showdown-password-1 \
  --data-urlencode email=showdown@showdown.test -d submit=Next
curl $J -o /dev/null -X POST "$B?action=firstWebsiteSetup&module=Installation" \
  -d siteName=showdown --data-urlencode url=http://showdown.test -d timezone=UTC -d ecommerce=0 -d submit=Next
curl $J -o /dev/null "$B?action=trackingCode&module=Installation&site_idSite=1&site_name=showdown"
curl $J -o /dev/null -X POST "$B?action=finished&module=Installation&site_idSite=1&site_name=showdown" \
  -d setup_geoip2=1 -d anonymise_ip=1 -d submit=Continue
echo "matomo installed"
exec sleep infinity
