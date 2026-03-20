<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partner_setup_options', function (Blueprint $table) {
            if (! Schema::hasColumn('partner_setup_options', 'parent_name')) {
                $table->string('parent_name', 255)->nullable()->after('category');
                $table->index(['category', 'parent_name']);
            }
        });

        Schema::table('partner_setup_options', function (Blueprint $table) {
            if (Schema::hasColumn('partner_setup_options', 'category')) {
                $table->dropUnique('partner_setup_options_category_name_unique');
            }
        });

        DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS partner_setup_options_category_name_unique_non_sub_area ON partner_setup_options(category, name) WHERE category <> 'sub_area'");
        DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS partner_setup_options_sub_area_unique ON partner_setup_options(category, parent_name, name) WHERE category = 'sub_area'");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS partner_setup_options_sub_area_unique');
        DB::statement('DROP INDEX IF EXISTS partner_setup_options_category_name_unique_non_sub_area');

        Schema::table('partner_setup_options', function (Blueprint $table) {
            $table->unique(['category', 'name'], 'partner_setup_options_category_name_unique');
        });

        Schema::table('partner_setup_options', function (Blueprint $table) {
            if (Schema::hasColumn('partner_setup_options', 'parent_name')) {
                $table->dropIndex(['category', 'parent_name']);
                $table->dropColumn('parent_name');
            }
        });
    }
};
