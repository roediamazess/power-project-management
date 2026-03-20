<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('time_boxing_setup_options', function (Blueprint $table) {
            $table->id();
            $table->string('category', 50);
            $table->string('name', 255);
            $table->string('status', 20)->default('Active');
            $table->timestamps();

            $table->unique(['category', 'name']);
            $table->index(['category', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_boxing_setup_options');
    }
};
