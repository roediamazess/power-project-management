<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('health_score_surveys')) {
            return;
        }

        Schema::table('health_score_surveys', function (Blueprint $table) {
            $table->dropUnique(['partner_id', 'project_id', 'year', 'quarter']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS health_score_surveys_unique_partner_period_no_project ON health_score_surveys (partner_id, year, quarter) WHERE project_id IS NULL');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS health_score_surveys_unique_partner_project_period ON health_score_surveys (partner_id, project_id, year, quarter) WHERE project_id IS NOT NULL');
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('health_score_surveys')) {
            return;
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS health_score_surveys_unique_partner_period_no_project');
            DB::statement('DROP INDEX IF EXISTS health_score_surveys_unique_partner_project_period');
        }

        Schema::table('health_score_surveys', function (Blueprint $table) {
            $table->unique(['partner_id', 'project_id', 'year', 'quarter']);
        });
    }
};

