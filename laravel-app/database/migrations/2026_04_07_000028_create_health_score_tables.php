<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_score_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('status')->default('Active');
            $table->unsignedInteger('version')->default(1);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });

        Schema::create('health_score_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('template_id');
            $table->string('name');
            $table->decimal('weight', 8, 2)->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('template_id')->references('id')->on('health_score_templates')->cascadeOnDelete();
        });

        Schema::create('health_score_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('section_id');
            $table->text('question_text');
            $table->string('answer_type');
            $table->string('scoring_rule')->nullable();
            $table->decimal('weight', 8, 2)->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('required')->default(true);
            $table->text('note_instruction')->nullable();
            $table->timestamps();

            $table->foreign('section_id')->references('id')->on('health_score_sections')->cascadeOnDelete();
        });

        Schema::create('health_score_question_options', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('question_id');
            $table->string('label');
            $table->decimal('score_value', 8, 2)->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('question_id')->references('id')->on('health_score_questions')->cascadeOnDelete();
        });

        Schema::create('health_score_surveys', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('template_id');
            $table->unsignedInteger('template_version')->default(1);
            $table->unsignedBigInteger('partner_id')->nullable();
            $table->uuid('project_id')->nullable();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('quarter');
            $table->string('status')->default('Draft');
            $table->decimal('score_total', 8, 2)->nullable();
            $table->json('score_by_category')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->foreign('template_id')->references('id')->on('health_score_templates')->restrictOnDelete();
            $table->unique(['partner_id', 'project_id', 'year', 'quarter']);
        });

        Schema::create('health_score_answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('survey_id');
            $table->uuid('question_id');
            $table->uuid('selected_option_id')->nullable();
            $table->date('value_date')->nullable();
            $table->text('value_text')->nullable();
            $table->text('note')->nullable();
            $table->decimal('score_value', 8, 2)->nullable();
            $table->timestamps();

            $table->foreign('survey_id')->references('id')->on('health_score_surveys')->cascadeOnDelete();
            $table->foreign('question_id')->references('id')->on('health_score_questions')->restrictOnDelete();
            $table->foreign('selected_option_id')->references('id')->on('health_score_question_options')->nullOnDelete();
            $table->unique(['survey_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_score_answers');
        Schema::dropIfExists('health_score_surveys');
        Schema::dropIfExists('health_score_question_options');
        Schema::dropIfExists('health_score_questions');
        Schema::dropIfExists('health_score_sections');
        Schema::dropIfExists('health_score_templates');
    }
};
