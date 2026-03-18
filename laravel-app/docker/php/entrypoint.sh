#!/bin/sh
set -e

cd /var/www/html

rm -f bootstrap/cache/*.php >/dev/null 2>&1 || true

if [ "${1:-}" != "php-fpm" ]; then
  exec "$@"
fi

if [ -z "${APP_KEY:-}" ]; then
  echo "APP_KEY wajib diisi untuk menjalankan php-fpm (set di .env untuk docker compose)" >&2
  exit 1
fi

php artisan config:clear >/dev/null 2>&1 || true

php artisan config:cache
php artisan route:cache || true
php artisan view:cache || true

if [ "${RUN_MIGRATIONS:-0}" = "1" ]; then
  if [ "${DB_CONNECTION:-}" = "mysql" ]; then
    i=0
    until php -r "new PDO('mysql:host=' . getenv('DB_HOST') . ';port=' . getenv('DB_PORT') . ';dbname=' . getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD'));" >/dev/null 2>&1; do
      i=$((i+1))
      if [ "$i" -ge 30 ]; then
        exit 1
      fi
      sleep 2
    done
  fi
  if [ "${DB_CONNECTION:-}" = "pgsql" ]; then
    i=0
    until php -r "new PDO('pgsql:host=' . getenv('DB_HOST') . ';port=' . getenv('DB_PORT') . ';dbname=' . getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD'));" >/dev/null 2>&1; do
      i=$((i+1))
      if [ "$i" -ge 30 ]; then
        exit 1
      fi
      sleep 2
    done
  fi
  php artisan migrate --force
fi

if [ "${RUN_SEEDERS:-0}" = "1" ]; then
  php artisan db:seed --force
fi

exec "$@"
