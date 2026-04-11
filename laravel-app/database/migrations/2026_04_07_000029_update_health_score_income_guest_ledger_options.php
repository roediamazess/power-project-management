<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('health_score_questions') || ! Schema::hasTable('health_score_question_options')) {
            return;
        }

        $questions = DB::table('health_score_questions')
            ->where('question_text', 'Bagaimana kondisi Income Guest Ledger vs Register Audit?')
            ->get(['id']);

        foreach ($questions as $q) {
            DB::table('health_score_question_options')->where('question_id', $q->id)->delete();

            DB::table('health_score_question_options')->insert([
                [
                    'id' => (string) Str::uuid(),
                    'question_id' => $q->id,
                    'label' => 'BALANCE',
                    'score_value' => 5,
                    'sort_order' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'id' => (string) Str::uuid(),
                    'question_id' => $q->id,
                    'label' => 'NOT BALANCE',
                    'score_value' => 1,
                    'sort_order' => 2,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            DB::table('health_score_questions')->where('id', $q->id)->update([
                'note_instruction' => null,
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // no-op
    }
};

