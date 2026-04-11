<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('health_score_questions', function (Blueprint $table) {
            if (! Schema::hasColumn('health_score_questions', 'module')) {
                $table->string('module')->nullable()->after('section_id');
            }
        });

        Schema::table('health_score_surveys', function (Blueprint $table) {
            if (! Schema::hasColumn('health_score_surveys', 'score_by_scope')) {
                $table->json('score_by_scope')->nullable()->after('score_by_category');
            }
            if (! Schema::hasColumn('health_score_surveys', 'score_by_module')) {
                $table->json('score_by_module')->nullable()->after('score_by_scope');
            }
        });
    }

    public function down(): void
    {
        Schema::table('health_score_surveys', function (Blueprint $table) {
            if (Schema::hasColumn('health_score_surveys', 'score_by_module')) {
                $table->dropColumn('score_by_module');
            }
            if (Schema::hasColumn('health_score_surveys', 'score_by_scope')) {
                $table->dropColumn('score_by_scope');
            }
        });

        Schema::table('health_score_questions', function (Blueprint $table) {
            if (Schema::hasColumn('health_score_questions', 'module')) {
                $table->dropColumn('module');
            }
        });
    }
};

