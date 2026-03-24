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
                        'Projects: header kolom Sort + Filter untuk Partner, Type, Start Date, Status.',
                        'Projects: segmented status All | Running (default) | Planning (Tentative+Scheduled) | Document | Document Check | Done | Rejected.',
                        'Projects: ringkasan filter aktif di header (sesuai urutan header).',
                        'Audit Logs: header kolom Sort + Filter untuk Module, Action, Actor, Time (range tanggal).',
                        'Audit Logs: ringkasan filter aktif di header dengan urutan Time | Module | Action | Actor.',
                        'Audit Logs: tampilan “Changed Fields” (Before vs After) termasuk diff PIC Assignment per item.',
                        'Routing pendek: /partners, /projects, /time-boxing, /audit-logs (CRUD sesuai).',
                    ],
                    'references' => [
                        'Projects UI: resources/js/Pages/Tables/Projects/Index.jsx',
                        'Projects controller: app/Http/Controllers/Tables/ProjectsController.php',
                        'Audit Logs UI: resources/js/Pages/Tables/AuditLogs/Index.jsx',
                        'Audit Logs controller: app/Http/Controllers/Tables/AuditLogsController.php',
                        'Routing: routes/web.php',
                    ],
                ],
                [
                    'title' => 'Fixed',
                    'items' => [
                        'Projects: perbaikan crash ringkasan filter (hoisting function) ketika halaman dibuka langsung.',
                        'Ziggy/base URL: pastikan semua route() relative ke origin aktif agar tidak “nyasar” domain.',
                        'Time Boxing: fallback penomoran no untuk lingkungan non-PostgreSQL (khusus test).',
                    ],
                    'references' => [
                        'Projects UI: resources/js/Pages/Tables/Projects/Index.jsx',
                        'app.jsx (Ziggy origin): resources/js/app.jsx',
                        'TimeBoxing controller: app/Http/Controllers/Tables/TimeBoxingsController.php',
                    ],
                ],
                [
                    'title' => 'Changed',
                    'items' => [
                        'Projects: hapus Search (server) + tombol Apply/Reset; seluruh filter via header.',
                        'Projects: label “End” diganti “End Date”.',
                        'Audit Logs: sembunyikan Meta + blok Before/After mentah, hanya tampilkan Changed Fields; sembunyikan field sensitif attachment/file/photo/avatar.',
                        'Audit Logs: urutan ringkasan filter mengikuti header Time | Module | Action | Actor.',
                        'Semua form & redirect CRUD diarahkan ke route pendek (/partners, /projects, /time-boxing, /audit-logs).',
                    ],
                    'references' => [
                        'Projects UI: resources/js/Pages/Tables/Projects/Index.jsx',
                        'Audit Logs UI: resources/js/Pages/Tables/AuditLogs/Index.jsx',
                        'Layouts: resources/js/Layouts/AuthenticatedLayout.jsx',
                        'Routing: routes/web.php',
                    ],
                ],
            ],
        ];

        DB::table('release_notes')
            ->where('version', 'v1.2603.5')
            ->update([
                'released_on' => '2026-03-24',
                'data' => json_encode($data),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // no-op
    }
};

