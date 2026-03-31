<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('security_events', function (Blueprint $table) {
            $table->id();
            $table->string('severity', 20)->default('medium')->index();
            $table->string('category', 50)->default('request')->index();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete()->index();
            $table->string('ip', 64)->nullable()->index();
            $table->string('method', 10)->nullable();
            $table->text('path')->nullable();
            $table->text('query')->nullable();
            $table->text('user_agent')->nullable();
            $table->text('reason');
            $table->jsonb('meta')->nullable();
            $table->timestamps();

            $table->index(['created_at', 'severity']);
            $table->index(['ip', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_events');
    }
};

