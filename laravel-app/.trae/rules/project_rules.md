
## Modal button order
- In modal footers, primary action button (Create/Update/Delete) goes on the left.
- Cancel/Close goes on the right (rightmost).
- Keep both buttons grouped on the right side of the footer.

## Skill routing
- For every request in this repo, invoke the `skills-project-router` skill first and follow it as the primary router for planning/changes, unless the user explicitly asks not to use it.

## Deployment & assets (VPS Docker)
- Treat production as Docker-first: changes are considered "applied" only after they are running inside the VPS Docker containers.
- For any UI change (Inertia/React/Vite), ensure production containers get the new build:
  - Gunakan `scripts/deploy_docker.sh` sebagai default (sudah rebuild, restart, remove `laravel-app_public_build`, dan verifikasi output build).
  - Gunakan build cache sebagai default; pakai no-cache hanya saat perlu: `DEPLOY_NO_CACHE=1 bash scripts/deploy_docker.sh`.
  - Pastikan deploy membuild dari folder repo yang benar: script deploy sekarang default build dari lokasi script-nya; override dengan `DEPLOY_PROJECT_DIR=/opt/power-project-management/laravel-app` jika dibutuhkan.
  - Alternatif manual: `docker compose -f docker-compose.prod.yml up -d --build`.
  - If assets appear unchanged, rebuild without cache and clean the `public_build` volume, then restart.
- After deploy, validate from inside the running `app` container that the expected `public/build/*` output exists (e.g., search the built `Jobsheet-*.js` for the updated markup/text).
- Saat deploy, 502 Bad Gateway bisa muncul sebentar saat container restart; anggap selesai hanya jika web sudah reachable (script deploy sekarang menunggu `http://127.0.0.1:8080/` up).
- Untuk perubahan interaksi dashboard (mis. klik chart buka drilldown), verifikasi string route sudah masuk bundle hasil build (mis. cari `dashboard.time-boxing.drilldown` di `public/build/assets/TimeBoxing-*.js`).
- Untuk perubahan KPI yang bisa diklik (Active/Overdue/Created/Completed), verifikasi bundle mengandung flag yang unik (mis. `overdue_only` di `public/build/assets/TimeBoxing-*.js`).
- Jika deploy gagal karena konflik nama container (mis. `laravel-app-db-1 is already in use`), gunakan `docker compose down --remove-orphans` dan hapus container/network yang konflik; script deploy sekarang sudah melakukan cleanup defensif sebelum `up`.
- Pola UX drilldown Dashboard Time Boxing: klik KPI/chart → popup list (drilldown) → klik row → modal edit → save → list refresh tanpa redirect.
- Saat menambah menu sidebar baru, wajib: tambah route + page Inertia yang ada (hindari 404), update posisi menu sesuai permintaan bisnis, dan pastikan permission/middleware jelas (role atau permission).
- Untuk Health Score: posisinya sebagai menu top-level di sidebar, tepat di bawah Projects dan di atas Time Boxing (bukan submenu Dashboard).
- Health Score MVP: gunakan Draft → Submit (submit = lock), header field Partner/Project/Year/Quarter, dan render pertanyaan per Category dengan input `single_select` / `date` + kolom Note + Note Instruction.
- Health Score flow: Health Score index punya tombol Create → membuat survey Draft dan menghasilkan link `/health-score/{id}` untuk pengisian; Partner+Year+Quarter mandatory, Project optional.
- Health Score public link: gunakan `/health-score/s/{token}` agar survey bisa diisi tanpa login; endpoint public POST harus CSRF-exempt untuk mendukung konsep SurveyMonkey-style.
- Saat menambah migration baru, deploy harus menjalankan `php artisan migrate --force` di container `app` (deploy script sekarang sudah include step ini).

## Inertia/Vite page loading (anti “menu/page tidak muncul”)
- Jangan pakai pola `@vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])` karena setiap page baru wajib ada entry di manifest dan sering bikin error/asset tidak update.
- Pakai single entry: `@vite(['resources/js/app.jsx'])` dan resolve page via `import.meta.glob` di `resources/js/app.jsx`.
- Setiap perubahan UI yang berdampak ke sidebar/menu atau penambahan page baru wajib diikuti rebuild Vite:
  - Jalankan `npm run build` (atau rebuild docker image yang menjalankan build).
  - Verifikasi `public/build/manifest.json` memuat page baru (mis. `resources/js/Pages/Tables/Holiday/Index.jsx`).
  - Verifikasi built chunk terkait berubah (mis. `grep -R "tables.holiday.index" public/build/assets/AuthenticatedLayout-*.js`).

## Docker volume public_build (penyebab UI “tidak berubah”)
- Di produksi, `public/build` dipersist lewat Docker named volume `laravel-app_public_build` (lihat `docker-compose.prod.yml`) dan dimount read-only ke container `web`.
- Dampaknya: rebuild image saja tidak cukup jika volume masih berisi asset lama; UI bisa tetap lama meskipun source sudah berubah.
- Jika ada kasus “menu/page tidak muncul” setelah deploy, lakukan salah satu:
  - Jalankan `scripts/deploy_docker.sh` (sudah menghapus volume `laravel-app_public_build`), atau
  - Manual: `docker compose -f docker-compose.prod.yml down` → `docker volume rm -f laravel-app_public_build` → `docker compose -f docker-compose.prod.yml up -d --build`.
- Checklist verifikasi pasca deploy:
  - Di container `web`: `public/build/manifest.json` memuat page baru.
  - Di container `web`: `public/build/assets/AuthenticatedLayout-*.js` mengandung route/menu baru.
  - Di browser: lakukan hard refresh untuk memastikan cache tidak menahan bundle lama.
- Jika `docker compose up` gagal karena konflik nama container (mis. `laravel-app-db-1 is already in use`), jalankan `docker compose -f docker-compose.prod.yml down --remove-orphans`, lalu ulangi `up -d --build`.

## Cache browser (penyebab UI “tidak berubah” padahal deploy sukses)
- Setelah deploy dan verifikasi asset sudah berubah di container `web`, UI di browser bisa tetap terlihat lama karena cache/tab SPA masih menyimpan bundle lama.
- Checklist cepat:
  - Buka ulang tab atau lakukan hard refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`).
  - Jika masih nyangkut: coba Incognito/Private window (untuk bypass cache dan service worker).
  - Verifikasi file asset yang diload sudah berganti hash (mis. `AuthenticatedLayout-*.js` yang baru).
