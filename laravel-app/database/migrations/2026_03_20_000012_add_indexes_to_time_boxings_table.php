<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('time_boxings')) {
            return;
        }

        Schema::table('time_boxings', function (Blueprint $table) {
            $table->index('information_date');
            $table->index('status');
            $table->index('priority');
            $table->index('type');
            $table->index('due_date');
            $table->index(['status', 'priority', 'type']);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('time_boxings')) {
            return;
        }

        Schema::table('time_boxings', function (Blueprint $table) {
            $table->dropIndex(['information_date']);
            $table->dropIndex(['status']);
            $table->dropIndex(['priority']);
            $table->dropIndex(['type']);
            $table->dropIndex(['due_date']);
            $table->dropIndex(['status', 'priority', 'type']);
        });
    }
};
