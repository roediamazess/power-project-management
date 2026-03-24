<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('release_notes')) {
            return;
        }

        $row = DB::table('release_notes')->where('version', 'v1.2603.5')->first();
        if (! $row) {
            return;
        }

        $existing = json_decode($row->data ?? '{}', true) ?: [];
        $sections = $existing['sections'] ?? [];

        $ensureSection = function (string $title) use (&$sections) {
            foreach ($sections as &$sec) {
                if (isset($sec['title']) && $sec['title'] === $title) {
                    if (! isset($sec['items']) || ! is_array($sec['items'])) $sec['items'] = [];
                    if (! isset($sec['references']) || ! is_array($sec['references'])) $sec['references'] = [];
                    return $sec;
                }
            }
            $sections[] = ['title' => $title, 'items' => [], 'references' => []];
            return $sections[array_key_last($sections)];
        };

        $addedBase = [
            'Time Boxing: header kolom bisa dibuka (popup) untuk Sort + Filter.',
            'Time Boxing: filter multi-select untuk Type, Priority, Partner, dan Status.',
            'Time Boxing: segmented status All Status | Active Status | Completed (default: Active Status).',
            'Time Boxing: picker Partner & Project berbasis popup (Partner: Active only; Project: bukan Done/Rejected).',
            'Time Boxing: dukungan filter rentang Due Date.',
            'Endpoint options Time Boxing untuk mengambil opsi filter berdasarkan tab status.',
            'Import Time Boxing dari XLSX via artisan command (lookup Partner CNC + auto-create Type).',
            'Version History: Referensi perubahan diblur untuk selain Administrator/Management.',
        ];

        $addedNew = [
            'Projects: header kolom Sort + Filter (Partner, Type, Start Date, Status) + ringkasan filter aktif.',
            'Projects: segmented status All | Running (default) | Planning (Tentative+Scheduled) | Document | Document Check | Done | Rejected.',
            'Audit Logs: header kolom Sort + Filter (Module, Action, Actor, Time) + filter range tanggal.',
            'Audit Logs: ringkasan filter aktif (Time | Module | Action | Actor) + tampilan Changed Fields (Before vs After).',
            'Routing pendek aktif untuk /partners, /projects, /time-boxing, /audit-logs (CRUD dan navigasi).',
        ];

        $fixedNew = [
            'Projects: perbaiki crash ringkasan filter karena deklarasi fungsi (hoisting).',
            'Navigasi: pastikan semua route() relative ke origin aktif agar tidak pindah domain.',
            'Time Boxing (test env): fallback penomoran no untuk non-PostgreSQL.',
        ];

        $changedNew = [
            'Projects: hapus Search (server) + tombol Apply/Reset; label End → End Date.',
            'Audit Logs: sembunyikan Meta dan blok Before/After mentah; hanya tampilkan Changed Fields; sembunyikan field attachment/file/photo/avatar.',
            'Semua form & redirect CRUD memakai route pendek (/partners, /projects, /time-boxing, /audit-logs).',
        ];

        // Merge helper
        $mergeItems = function (array &$targetItems, array $source) {
            $targetItems = array_values(array_unique(array_merge($targetItems, $source)));
        };

        // Added
        foreach ($sections as &$sec) {
            if (($sec['title'] ?? '') === 'Added') {
                $mergeItems($sec['items'], $addedBase);
                $mergeItems($sec['items'], $addedNew);
                $addedExists = true;
                break;
            }
        }
        unset($sec);
        if (empty($addedExists)) {
            $sections[] = ['title' => 'Added', 'items' => array_values(array_unique(array_merge($addedBase, $addedNew))), 'references' => []];
        }

        // Fixed
        $fixedExists = false;
        foreach ($sections as &$sec) {
            if (($sec['title'] ?? '') === 'Fixed') {
                $mergeItems($sec['items'], $fixedNew);
                $fixedExists = true;
                break;
            }
        }
        unset($sec);
        if (! $fixedExists) {
            $sections[] = ['title' => 'Fixed', 'items' => $fixedNew, 'references' => []];
        }

        // Changed
        $changedExists = false;
        foreach ($sections as &$sec) {
            if (($sec['title'] ?? '') === 'Changed') {
                $mergeItems($sec['items'], $changedNew);
                $changedExists = true;
                break;
            }
        }
        unset($sec);
        if (! $changedExists) {
            $sections[] = ['title' => 'Changed', 'items' => $changedNew, 'references' => []];
        }

        DB::table('release_notes')
            ->where('id', $row->id)
            ->update([
                'data' => json_encode(['sections' => $sections]),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // No revert
    }
};

