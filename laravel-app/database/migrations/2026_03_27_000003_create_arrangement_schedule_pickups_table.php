<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('arrangement_schedule_pickups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('schedule_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedTinyInteger('points')->default(1);
            $table->timestamps();

            $table->unique(['schedule_id', 'user_id']);
            $table->index('schedule_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('arrangement_schedule_pickups');
    }
};
