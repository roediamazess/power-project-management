<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('arrangement_jobsheet_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('period_id');
            $table->unsignedBigInteger('user_id');
            $table->date('work_date');
            $table->string('code', 32);
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->unique(['period_id', 'user_id', 'work_date']);
            $table->index(['user_id', 'work_date']);
            $table->index('period_id');

            $table->foreign('period_id')->references('id')->on('arrangement_jobsheet_periods')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->restrictOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('arrangement_jobsheet_entries');
    }
};

