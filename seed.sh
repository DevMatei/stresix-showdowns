#!/bin/sh
# installs wordpress and adds the same 10 posts every other cms gets.
# safe to run again, it skips work that's already done.
cd /var/www/html
until [ -f wp-config.php ] && php -r "exit(@mysqli_connect(\"db\", \"wordpress\", \"wordpress\", \"wordpress\") ? 0 : 1);"; do sleep 2; done

if ! wp core is-installed 2>/dev/null; then
  wp core install --url=http://localhost --title=showdown --admin_user=admin \
    --admin_password=showdown-admin --admin_email=admin@example.com --skip-email
  wp post delete 1 --force
fi

if [ "$(wp post list --post_type=post --format=count)" -lt 10 ]; then
  body="<p>This is one of ten identical test posts. Every CMS in the showdown gets the same ten posts, so the only thing that changes between runs is the CMS itself.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>"
  for i in 1 2 3 4 5 6 7 8 9 10; do
    wp post create --post_type=post --post_status=publish --post_title="Test post $i" --post_content="$body"
  done
fi

echo "seed done"
exec sleep infinity
