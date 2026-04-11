<?php

use App\Models\ArrangementJobsheetPeriod;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('arrangement_jobsheet_periods', function (Blueprint $table) {
            $table->string('slug', 200)->nullable()->after('name');
            $table->boolean('is_default')->default(false)->after('end_date');
        });

        ArrangementJobsheetPeriod::query()
            ->orderBy('start_date')
            ->orderBy('created_at')
            ->chunk(200, function ($periods) {
                foreach ($periods as $p) {
                    $start = $p->start_date?->format('Ymd') ?? '';
                    $end = $p->end_date?->format('Ymd') ?? '';
                    $base = 'periode-' . Str::slug((string) $p->name) . ($start ? "-{$start}" : '') . ($end ? "-{$end}" : '');
                    $slug = $base;

                    $i = 2;
                    while (ArrangementJobsheetPeriod::query()->where('slug', $slug)->whereKeyNot($p->id)->exists()) {
                        $slug = "{$base}-{$i}";
                        $i++;
                    }

                    $p->forceFill(['slug' => $slug])->save();
                }
            });

        Schema::table('arrangement_jobsheet_periods', function (Blueprint $table) {
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('arrangement_jobsheet_periods', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn(['slug', 'is_default']);
        });
    }
};
