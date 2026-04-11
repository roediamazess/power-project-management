<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('health_score_surveys')) {
            return;
        }

        Schema::table('health_score_surveys', function (Blueprint $table) {
            if (! Schema::hasColumn('health_score_surveys', 'share_token')) {
                $table->string('share_token', 80)->nullable()->unique();
            }
            if (! Schema::hasColumn('health_score_surveys', 'public_enabled')) {
                $table->boolean('public_enabled')->default(true);
            }
        });
    }

    public function down(): void
    {
        // no-op
    }
};

