<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('time_boxings', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('priority')->constrained('users')->nullOnDelete()->index();
        });
    }

    public function down(): void
    {
        Schema::table('time_boxings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};

