<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('time_boxings', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->unsignedBigInteger('no')->unique();

            $table->date('information_date');
            $table->string('type', 255);
            $table->string('priority', 20)->default('Normal');
            $table->string('user_position', 255)->nullable();

            $table->unsignedBigInteger('partner_id')->nullable()->index();
            $table->text('description')->nullable();
            $table->text('action_solution')->nullable();
            $table->string('status', 30)->default('Brain Dump');

            $table->date('due_date')->nullable();
            $table->timestampTz('completed_at')->nullable();

            $table->uuid('project_id')->nullable()->index();

            $table->timestamps();

            $table->foreign('partner_id')->references('id')->on('partners')->nullOnDelete();
            $table->foreign('project_id')->references('id')->on('projects')->nullOnDelete();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("CREATE SEQUENCE IF NOT EXISTS time_boxings_no_seq START 1 INCREMENT 1");
            DB::statement("ALTER TABLE time_boxings ALTER COLUMN no SET DEFAULT nextval('time_boxings_no_seq')");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('time_boxings');
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP SEQUENCE IF EXISTS time_boxings_no_seq');
        }
    }
};
