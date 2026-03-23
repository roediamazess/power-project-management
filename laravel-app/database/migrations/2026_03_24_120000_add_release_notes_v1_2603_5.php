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
                        'Time Boxing: header kolom bisa dibuka (popup) untuk Sort + Filter.',
                        'Time Boxing: filter multi-select untuk `Type`, `Priority`, `Partner`, dan `Status`.',
                        'Time Boxing: segmented status `All Status | Active Status | Completed` (default: Active Status).',
                        'Time Boxing: picker Partner & Project berbasis popup (Partner: Active only; Project: bukan Done/Rejected).',
                        'Time Boxing: dukungan filter rentang `Due Date`.',
                        'Endpoint options Time Boxing untuk mengambil opsi filter berdasarkan tab status.',
                        'Import Time Boxing dari XLSX via artisan command (lookup Partner CNC + auto-create Type).',
                        'Version History: Referensi perubahan diblur untuk selain Administrator/Management.',
                    ],
                    'references' => [
                        'Time Boxing UI: `resources/js/Pages/Tables/TimeBoxing/Index.jsx`',
                        'Time Boxing query: `app/Http/Controllers/Tables/TimeBoxingsController.php`',
                        'Time Boxing options route: `routes/web.php`',
                        'Import command: `routes/console.php`',
                        'Import service: `app/Services/TimeBoxingXlsxImportService.php`, `app/Support/XlsxReader.php`',
                        'Version history blur: `resources/js/Layouts/AuthenticatedLayout.jsx`, `app/Http/Middleware/HandleInertiaRequests.php`',
                        'Projects partner picker: `resources/js/Pages/Tables/Projects/Index.jsx`',
                    ],
                ],
                [
                    'title' => 'Fixed',
                    'items' => [
                        'Time Boxing: popup header tidak lagi tertutup saat memilih tanggal; Apply baru menutup popup.',
                        'Time Boxing: perbaiki posisi popup agar tidak terpotong di sisi kanan layar.',
                        'Import Time Boxing: parsing `Completed Date` lebih toleran pada format GMT.',
                        'Import Time Boxing: baris yang `Partner CNC`/`Type` kosong tidak lagi ter-skip (default: CNC 3, Type General).',
                    ],
                    'references' => [
                        'Popup behavior: `resources/js/Pages/Tables/TimeBoxing/Index.jsx`',
                        'Import parsing: `app/Services/TimeBoxingXlsxImportService.php`',
                    ],
                ],
                [
                    'title' => 'Changed',
                    'items' => [
                        'Time Boxing: panel filter lama dihapus, diganti menu header per kolom.',
                        'Time Boxing: default sorting berdasarkan ID (asc) dan sorting berjalan server-side.',
                        'Time Boxing: tampilan tabel dirapikan (kolom yang ditampilkan disesuaikan kebutuhan).',
                        'Inertia props: auth roles dibagikan ke frontend untuk kebutuhan gating UI.',
                    ],
                    'references' => [
                        'Time Boxing UI: `resources/js/Pages/Tables/TimeBoxing/Index.jsx`',
                        'Time Boxing controller: `app/Http/Controllers/Tables/TimeBoxingsController.php`',
                        'Auth props: `app/Http/Middleware/HandleInertiaRequests.php`',
                    ],
                ],
            ],
        ];

        $now = now();
        $existing = DB::table('release_notes')->where('version', 'v1.2603.5')->first();

        if ($existing) {
            DB::table('release_notes')->where('version', 'v1.2603.5')->update([
                'released_on' => '2026-03-24',
                'data' => json_encode($data),
                'updated_at' => $now,
            ]);
        } else {
            DB::table('release_notes')->insert([
                'version' => 'v1.2603.5',
                'released_on' => '2026-03-24',
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

