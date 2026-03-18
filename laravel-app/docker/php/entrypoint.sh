#!/bin/sh
set -e

cd /var/www/html

rm -f bootstrap/cache/*.php >/dev/null 2>&1 || true

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

if [ -n "${APP_KEY:-}" ] && [ -f .env ]; then
  if grep -q "^APP_KEY=" .env; then
    sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env
  else
    printf "\nAPP_KEY=%s\n" "${APP_KEY}" >> .env
  fi
fi

if [ -z "${APP_KEY:-}" ] && [ -f .env ] && grep -q "^APP_KEY=$" .env; then
  php artisan key:generate --force
fi

php artisan config:clear >/dev/null 2>&1 || true

if [ -n "${APP_KEY:-}" ]; then
  php artisan config:cache
  php artisan route:cache || true
  php artisan view:cache || true
fi

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
