<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('office_agent_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->timestampTz('from_at')->nullable()->index();
            $table->timestampTz('to_at')->nullable()->index();
            $table->text('security_summary')->nullable();
            $table->text('activity_summary')->nullable();
            $table->boolean('telegram_ok')->nullable();
            $table->timestampTz('telegram_sent_at')->nullable();
            $table->text('telegram_error')->nullable();
            $table->jsonb('meta')->nullable();
            $table->timestamps();

            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('office_agent_reports');
    }
};

