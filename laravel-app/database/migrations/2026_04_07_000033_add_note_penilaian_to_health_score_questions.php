<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('health_score_questions')) {
            return;
        }

        Schema::table('health_score_questions', function (Blueprint $table) {
            if (! Schema::hasColumn('health_score_questions', 'note_penilaian')) {
                $table->text('note_penilaian')->nullable();
            }
        });
    }

    public function down(): void
    {
        // no-op
    }
};

