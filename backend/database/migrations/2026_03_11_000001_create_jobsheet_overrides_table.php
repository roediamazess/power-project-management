<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jobsheet_overrides', function (Blueprint $table) {
            $table->id();
            $table->string('period_id')->nullable()->index();
            $table->string('username')->index();
            $table->date('date')->index();
            $table->string('value');
            $table->timestamps();

            $table->unique(['period_id', 'username', 'date'], 'jobsheet_overrides_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jobsheet_overrides');
    }
};

