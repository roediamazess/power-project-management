<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('health_score_surveys')) {
            return;
        }

        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        $col = DB::selectOne("
            select data_type
            from information_schema.columns
            where table_name = 'health_score_surveys' and column_name = 'project_id'
            limit 1
        ");

        $dataType = $col?->data_type ?? null;
        if ($dataType === 'uuid') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS health_score_surveys_unique_partner_period_no_project');
        DB::statement('DROP INDEX IF EXISTS health_score_surveys_unique_partner_project_period');

        DB::statement('ALTER TABLE health_score_surveys ADD COLUMN project_id_uuid uuid NULL');

        DB::statement('ALTER TABLE health_score_surveys DROP COLUMN project_id');
        DB::statement('ALTER TABLE health_score_surveys RENAME COLUMN project_id_uuid TO project_id');

        DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS health_score_surveys_unique_partner_period_no_project ON health_score_surveys (partner_id, year, quarter) WHERE project_id IS NULL');
        DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS health_score_surveys_unique_partner_project_period ON health_score_surveys (partner_id, project_id, year, quarter) WHERE project_id IS NOT NULL');
    }

    public function down(): void
    {
        // no-op
    }
};

