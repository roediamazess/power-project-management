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
        if (! is_array($data)) {
            return;
        }

        $sections = $data['sections'] ?? null;
        if (! is_array($sections)) {
            return;
        }

        foreach ($sections as $i => $section) {
            if (! is_array($section) || ($section['title'] ?? null) !== 'Changed') {
                continue;
            }

            $items = $section['items'] ?? [];
            if (! is_array($items)) {
                $items = [];
            }

            $line = 'Time Boxing: pagination + filter dijalankan server-side (lebih cepat untuk data besar).';
            if (! in_array($line, $items, true)) {
                $items[] = $line;
            }

            $sections[$i]['items'] = $items;
        }

        $data['sections'] = $sections;

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
