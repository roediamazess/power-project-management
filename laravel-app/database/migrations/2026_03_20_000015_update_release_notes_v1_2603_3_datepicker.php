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

        $row = DB::table('release_notes')->where('version', 'v1.2603.3')->first();
        if (! $row) {
            return;
        }

        $data = json_decode((string) $row->data, true);
        if (! is_array($data) || ! isset($data['sections']) || ! is_array($data['sections'])) {
            return;
        }

        $fixedLine = 'Time Boxing: perbaiki format datepicker agar tidak menghilangkan tahun pada input.';
        $changedLines = [
            'UI Time Boxing: filter Info Date From/To memakai calendar picker (tidak perlu ketik manual).',
            'UI Time Boxing: tampilan tanggal picker distandarkan `dd Mmm yy` (tahun tidak hilang).',
        ];

        foreach ($data['sections'] as $i => $section) {
            if (! is_array($section)) {
                continue;
            }

            $title = $section['title'] ?? null;
            $items = $section['items'] ?? [];
            if (! is_array($items)) {
                $items = [];
            }

            if ($title === 'Fixed') {
                if (! in_array($fixedLine, $items, true)) {
                    $items[] = $fixedLine;
                }
            }

            if ($title === 'Changed') {
                foreach ($changedLines as $line) {
                    if (! in_array($line, $items, true)) {
                        $items[] = $line;
                    }
                }
            }

            $data['sections'][$i]['items'] = $items;
        }

        DB::table('release_notes')->where('version', 'v1.2603.3')->update([
            'data' => json_encode($data),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        // no-op
    }
};
