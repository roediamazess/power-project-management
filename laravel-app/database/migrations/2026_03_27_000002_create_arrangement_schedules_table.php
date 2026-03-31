<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('arrangement_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('batch_id')->nullable();
            $table->string('schedule_type');
            $table->text('note')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedTinyInteger('count')->default(1);
            $table->string('status')->default('Open');
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->index('batch_id');
            $table->index('status');
            $table->index(['start_date', 'end_date']);
            $table->index('created_by');
            $table->index('approved_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('arrangement_schedules');
    }
};
