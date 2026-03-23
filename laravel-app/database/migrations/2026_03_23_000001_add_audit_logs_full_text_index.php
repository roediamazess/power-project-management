<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('audit_logs')) {
            return;
        }

        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("CREATE INDEX IF NOT EXISTS audit_logs_search_gin ON audit_logs USING GIN (to_tsvector('simple', coalesce(action,'') || ' ' || coalesce(model_type,'') || ' ' || coalesce(model_id,'') || ' ' || coalesce(meta::text,'') || ' ' || coalesce(before::text,'') || ' ' || coalesce(after::text,'')))");
        DB::statement('CREATE INDEX IF NOT EXISTS audit_logs_action_created_at_idx ON audit_logs (action, created_at DESC)');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS audit_logs_search_gin');
        DB::statement('DROP INDEX IF EXISTS audit_logs_action_created_at_idx');
    }
};
