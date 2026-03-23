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

        $data = [
            'sections' => [
                [
                    'title' => 'Added',
                    'items' => [
                        'Upload foto profile di halaman `Profile` dan avatar tampil di header/sidebar.',
                        'Kompresi foto di browser sebelum upload (resize + JPEG) untuk ukuran kecil.',
                        'Index full-text (GIN) untuk mempercepat search di Audit Logs (PostgreSQL).',
                        'Test coverage tambahan untuk akses halaman Tables (Admin) dan upload profile photo.',
                    ],
                    'references' => [
                        'Profile UI: `resources/js/Pages/Profile/Partials/UpdateProfileInformationForm.jsx`',
                        'Layout avatar: `resources/js/Layouts/AuthenticatedLayout.jsx`',
                        'Profile endpoints: `app/Http/Controllers/ProfileController.php`, `routes/web.php`',
                        'Audit index: `database/migrations/2026_03_23_000001_add_audit_logs_full_text_index.php`',
                        'Tests: `tests/Feature/TablesAdminAccessTest.php`, `tests/Feature/ProfilePhotoTest.php`',
                    ],
                ],
                [
                    'title' => 'Fixed',
                    'items' => [
                        '403 permission untuk role Administrator pada halaman Tables (Time Boxing/Setup, Project Setup, dll).',
                        '413 Request Entity Too Large saat upload photo dengan menyesuaikan limit Nginx.',
                        'Perhitungan durasi Projects tidak lagi gagal saat input tanggal `dd Mmm yy`.',
                        'Kompatibilitas migration saat test (SQLite) untuk operasi khusus PostgreSQL (sequence).',
                    ],
                    'references' => [
                        'Routes middleware: `routes/web.php`',
                        'Permission seeding: `app/Http/Middleware/EnsureCorePermissions.php`, `app/Support/PermissionCatalog.php`',
                        'Nginx: `docker/nginx/default.conf`',
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
                    ],
                    'references' => [
                        'Date component: `resources/js/Components/DatePickerInput.jsx`',
                        'Tables pages: `resources/js/Pages/Tables/*/Index.jsx`',
                        'Routes: `routes/web.php`',
                    ],
                ],
            ],
        ];

        $now = now();

        $existing = DB::table('release_notes')->where('version', 'v1.2603.4')->first();

        if ($existing) {
            DB::table('release_notes')->where('version', 'v1.2603.4')->update([
                'released_on' => '2026-03-23',
                'data' => json_encode($data),
                'updated_at' => $now,
            ]);
        } else {
            DB::table('release_notes')->insert([
                'version' => 'v1.2603.4',
                'released_on' => '2026-03-23',
                'data' => json_encode($data),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        // no-op
    }
};

