#!/bin/bash

# Level 4: Logika Prosedural - Deployment Docker (Produksi)
# Script ini digunakan untuk memastikan semua perubahan kode terbaru
# ter-deploy dengan benar ke dalam container Docker.

set -e

SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="${DEPLOY_PROJECT_DIR:-$SCRIPT_ROOT}"

cd "$PROJECT_DIR"

echo "## [DEPLOY] Memulai proses deployment di IP 43.153.211.40 ##"

# 1. Pastikan kode terbaru sudah ditarik (jika pakai git)
# git pull origin main

# 2. Rebuild image (memastikan perubahan Controller/Blade ikut terbawa)
echo "## [1/4] Rebuilding Docker Images... ##"
BUILD_FLAGS=()
if [ "${DEPLOY_NO_CACHE:-0}" = "1" ]; then
    BUILD_FLAGS+=(--no-cache)
fi
docker compose -f docker-compose.prod.yml build "${BUILD_FLAGS[@]}"

# 3. Restart container dengan image baru dan bersihkan volume build
echo "## [2/4] Restarting Containers & Cleaning Build Volumes... ##"
docker compose -f docker-compose.prod.yml down --remove-orphans || true

# Defensive cleanup for orphan/conflicting containers & network names
docker rm -f laravel-app-db-1 laravel-app-app-1 laravel-app-web-1 2>/dev/null || true
docker network rm laravel-app_default 2>/dev/null || true

docker volume rm -f laravel-app_public_build || true
docker compose -f docker-compose.prod.yml up -d

# Wait until web is reachable (avoid prolonged 502 from host nginx after deploy)
echo "## [WAIT] Waiting for web to be reachable on 127.0.0.1:8080... ##"
for i in $(seq 1 45); do
    if curl -fsS -o /dev/null http://127.0.0.1:8080/; then
        echo "## [WAIT] Web is up. ##"
        break
    fi
    sleep 2
done

# 4. Bersihkan cache di dalam container app
echo "## [3/4] Clearing Laravel Caches... ##"
docker compose -f docker-compose.prod.yml exec -T app php artisan optimize:clear

# 4b. Jalankan migration (untuk perubahan schema baru)
echo "## [3b/4] Running Laravel Migrations... ##"
docker compose -f docker-compose.prod.yml exec -T app php artisan migrate --force

# 5. Verifikasi status akhir
echo "## [4/4] Verifying Deployment... ##"
docker compose -f docker-compose.prod.yml ps

echo "## [VERIFY] Checking built assets inside web container... ##"
docker compose -f docker-compose.prod.yml exec -T web sh -lc 'test -f public/build/manifest.json'

echo "## [VERIFY] Checking sidebar menu entries exist in built AuthenticatedLayout... ##"
docker compose -f docker-compose.prod.yml exec -T web sh -lc 'grep -R -n "tables.holiday.index" public/build/assets/AuthenticatedLayout-*.js | head -n 1'
docker compose -f docker-compose.prod.yml exec -T web sh -lc 'grep -R -n "dashboard.time-boxing" public/build/assets/AuthenticatedLayout-*.js | head -n 1'

echo "## [VERIFY] Checking key pages exist in manifest... ##"
docker compose -f docker-compose.prod.yml exec -T web sh -lc 'grep -n "resources/js/Pages/Tables/Holiday/Index.jsx" public/build/manifest.json | head -n 1'
docker compose -f docker-compose.prod.yml exec -T web sh -lc 'grep -n "resources/js/Pages/Dashboard/TimeBoxing.jsx" public/build/manifest.json | head -n 1'

echo "## [VERIFY] Checking Dashboard Time Boxing KPI labels are updated... ##"
docker compose -f docker-compose.prod.yml exec -T web sh -lc 'grep -R -n "Active (Range)" public/build/assets/TimeBoxing-*.js | head -n 1'

echo "## [VERIFY] Checking Dashboard Time Boxing drilldown endpoint is referenced in built JS... ##"
docker compose -f docker-compose.prod.yml exec -T web sh -lc 'grep -R -n "dashboard.time-boxing.drilldown" public/build/assets/TimeBoxing-*.js | head -n 1'

echo "## [VERIFY] Checking Created vs Completed axis formatter is deployed... ##"
docker compose -f docker-compose.prod.yml exec -T web sh -lc 'grep -R -n "hideOverlappingLabels" public/build/assets/TimeBoxing-*.js | head -n 2'

echo "## [VERIFY] Checking KPI cards are clickable (overdue_only flag in bundle)... ##"
docker compose -f docker-compose.prod.yml exec -T web sh -lc 'grep -R -n "overdue_only" public/build/assets/TimeBoxing-*.js | head -n 1'

echo "## [SUCCESS] Deployment Selesai! ##"
