<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('projects')) {
            return;
        }

        Schema::table('projects', function (Blueprint $table) {
            if (! Schema::hasColumn('projects', 'no')) {
                $table->unsignedBigInteger('no')->nullable()->unique();
            }
        });

        DB::statement("CREATE SEQUENCE IF NOT EXISTS projects_no_seq START 1 INCREMENT 1");

        DB::statement("UPDATE projects p SET no = s.rn FROM (SELECT id, row_number() OVER (ORDER BY created_at, id) rn FROM projects) s WHERE p.id = s.id AND p.no IS NULL");

        Schema::table('projects', function (Blueprint $table) {
            $table->unsignedBigInteger('no')->nullable(false)->change();
        });

        DB::statement("ALTER TABLE projects ALTER COLUMN no SET DEFAULT nextval('projects_no_seq')");
    }

    public function down(): void
    {
        if (! Schema::hasTable('projects')) {
            return;
        }

        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'no')) {
                $table->dropUnique(['no']);
                $table->dropColumn('no');
            }
        });

        DB::statement('DROP SEQUENCE IF EXISTS projects_no_seq');
    }
};
