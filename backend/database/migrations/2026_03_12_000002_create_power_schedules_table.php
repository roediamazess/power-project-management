<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('power_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('schedule_id')->nullable();
            $table->string('schedule_name');
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->dateTime('pickup_start')->nullable();
            $table->dateTime('pickup_end')->nullable();
            $table->enum('status', ['available', 'picked', 'released'])->default('available');
            $table->string('batch_id')->default('');
            $table->string('batch_name')->default('');
            $table->unsignedInteger('point_min')->default(0);
            $table->unsignedInteger('point_max')->default(0);
            $table->string('picked_by')->nullable();
            $table->dateTime('released_at')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('power_schedules');
    }
};
