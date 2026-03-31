<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auth_events', function (Blueprint $table) {
            $table->id();
            $table->string('type', 30)->index();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete()->index();
            $table->string('email', 255)->nullable()->index();
            $table->string('ip', 64)->nullable()->index();
            $table->text('user_agent')->nullable();
            $table->jsonb('meta')->nullable();
            $table->timestamps();

            $table->index(['created_at', 'type']);
            $table->index(['ip', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auth_events');
    }
};

