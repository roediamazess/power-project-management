<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('release_notes')) {
            return;
        }

        $row = DB::table('release_notes')->where('version', 'v1.2603.4')->first();
        if (! $row) {
            return;
        }

        $data = json_decode((string) ($row->data ?? ''), true);
        if (! is_array($data)) {
            $data = [];
        }

        $data['sections'] = [
            [
                'title' => 'Added',
                'items' => [
                    'Upload foto profile di halaman `Profile` dan avatar tampil di header/sidebar.',
                    'Kompresi foto di browser sebelum upload (resize + JPEG) untuk ukuran kecil.',
                    'Import data Partners dari XLSX dan auto-link ke `Tables > Partner Setup` / `Project Setup`.',
                    'Segmented filter status Partners: `Active | Freeze | Inactive | All Status` (default: Active).',
                    'Index full-text (GIN) untuk mempercepat search di Audit Logs (PostgreSQL).',
                    'Test coverage tambahan untuk akses halaman Tables (Admin) dan upload profile photo.',
                ],
                'references' => [
                    'Profile UI: `resources/js/Pages/Profile/Partials/UpdateProfileInformationForm.jsx`',
                    'Layout avatar: `resources/js/Layouts/AuthenticatedLayout.jsx`',
                    'Profile endpoints: `app/Http/Controllers/ProfileController.php`, `routes/web.php`',
                    'Partners import: `routes/console.php`, `app/Services/PartnersXlsxImportService.php`, `app/Support/XlsxReader.php`',
                    'Partners status filter: `app/Http/Controllers/Tables/PartnersController.php`, `resources/js/Pages/Tables/Partners/Index.jsx`',
                    'Audit index: `database/migrations/2026_03_23_000001_add_audit_logs_full_text_index.php`',
                    'Tests: `tests/Feature/TablesAdminAccessTest.php`, `tests/Feature/ProfilePhotoTest.php`',
                ],
            ],
            [
                'title' => 'Fixed',
                'items' => [
                    '403 permission untuk role Administrator pada halaman Tables (Time Boxing/Setup, Project Setup, dll).',
                    '413 Request Entity Too Large saat upload photo dengan menyesuaikan limit Nginx.',
                    'Pencarian data Partners lintas halaman: Search di header sekarang melakukan server search (reset pagination otomatis).',
                    'Perhitungan durasi Projects tidak lagi gagal saat input tanggal `dd Mmm yy`.',
                    'Kompatibilitas migration saat test (SQLite) untuk operasi khusus PostgreSQL (sequence).',
                ],
                'references' => [
                    'Routes middleware: `routes/web.php`',
                    'Permission seeding: `app/Http/Middleware/EnsureCorePermissions.php`, `app/Support/PermissionCatalog.php`',
                    'Nginx: `docker/nginx/default.conf`',
                    'Partners search: `resources/js/Layouts/AuthenticatedLayout.jsx`, `resources/js/Pages/Tables/Partners/Index.jsx`, `app/Http/Controllers/Tables/PartnersController.php`',
                    'Projects UI: `resources/js/Pages/Tables/Projects/Index.jsx`',
                    'Migrations: `database/migrations/2026_03_20_000008_create_time_boxings_table.php`, `2026_03_20_000010_add_no_to_projects_table.php`',
                ],
            ],
            [
                'title' => 'Changed',
                'items' => [
                    'Standarisasi input tanggal diselesaikan: seluruh halaman Tables memakai komponen global `DatePickerInput` (format `dd Mmm yy`).',
                    'Filter Info Date di Time Boxing tidak lagi bergantung pada datepicker jQuery; memakai komponen global.',
                    'Pola middleware akses Tables diperkuat: Administrator dapat akses meski permission belum tersinkron.',
                    'Branding title aplikasi distandarkan menjadi `Power Project Management` (tanpa suffix `Laravel`).',
                    'Partners: hapus Search (server) + tombol Apply/Reset karena Search header sudah cukup.',
                ],
                'references' => [
                    'Date component: `resources/js/Components/DatePickerInput.jsx`',
                    'Tables pages: `resources/js/Pages/Tables/*/Index.jsx`',
                    'App title: `resources/js/app.jsx`, `resources/views/app.blade.php`',
                    'Partners UI: `resources/js/Pages/Tables/Partners/Index.jsx`',
                    'Routes: `routes/web.php`',
                ],
            ],
        ];

        DB::table('release_notes')->where('version', 'v1.2603.4')->update([
            'data' => json_encode($data),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        // no-op
    }
};

