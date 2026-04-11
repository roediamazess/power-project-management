<?php

use App\Models\HealthScoreQuestion;
use App\Models\HealthScoreQuestionOption;
use App\Models\HealthScoreSurvey;
use App\Models\HealthScoreTemplate;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            $template = HealthScoreTemplate::query()
                ->where('status', 'Active')
                ->orderByDesc('version')
                ->first();

            if (! $template || (int) $template->version < 3) {
                return;
            }

            $questions = HealthScoreQuestion::query()
                ->whereIn('section_id', function ($q) use ($template) {
                    $q->select('id')->from('health_score_sections')->where('template_id', $template->id);
                })
                ->where('answer_type', 'single_select')
                ->get();

            foreach ($questions as $question) {
                $opts = HealthScoreQuestionOption::query()
                    ->where('question_id', $question->id)
                    ->orderBy('sort_order')
                    ->get();

                $labels = $opts->map(fn ($o) => strtoupper(trim((string) $o->label)))->values()->all();

                $isBalance = count($labels) === 2 && in_array('BALANCE', $labels, true) && in_array('NOT BALANCE', $labels, true);
                $isRunning = count($labels) === 2 && in_array('RUNNING', $labels, true) && in_array('NOT RUNNING', $labels, true);

                if ($isBalance || $isRunning) {
                    foreach ($opts as $opt) {
                        $l = strtoupper(trim((string) $opt->label));
                        if ($l === 'BALANCE' || $l === 'RUNNING') {
                            $opt->label = 'YES';
                            $opt->save();
                        } elseif ($l === 'NOT BALANCE' || $l === 'NOT RUNNING') {
                            $opt->label = 'NO';
                            $opt->save();
                        }
                    }

                    if (is_string($question->note_penilaian) && preg_match('/BALANCE|RUNNING|NOT BALANCE|NOT RUNNING/i', $question->note_penilaian)) {
                        $question->note_penilaian = "5 = YES\n1 = NO";
                        $question->save();
                    }
                }

                if (trim((string) $question->question_text) === 'Income Guest Ledger vs Register Audit Balance?') {
                    $yesOpt = $opts->first(fn ($o) => (float) $o->score_value >= 4.0);
                    $noOpt = $opts->first(fn ($o) => (float) $o->score_value <= 2.0);

                    if (! $yesOpt || ! $noOpt) {
                        $opts->each->delete();
                        $yesOpt = HealthScoreQuestionOption::query()->create([
                            'question_id' => $question->id,
                            'label' => 'YES',
                            'score_value' => 5,
                            'sort_order' => 1,
                        ]);
                        $noOpt = HealthScoreQuestionOption::query()->create([
                            'question_id' => $question->id,
                            'label' => 'NO',
                            'score_value' => 1,
                            'sort_order' => 2,
                        ]);
                    } else {
                        $opts->each->delete();
                        $yesOpt = HealthScoreQuestionOption::query()->create([
                            'question_id' => $question->id,
                            'label' => 'YES',
                            'score_value' => 5,
                            'sort_order' => 1,
                        ]);
                        $noOpt = HealthScoreQuestionOption::query()->create([
                            'question_id' => $question->id,
                            'label' => 'NO',
                            'score_value' => 1,
                            'sort_order' => 2,
                        ]);
                    }

                    $question->note_penilaian = "5 = YES\n1 = NO";
                    $question->save();

                    $surveyIds = HealthScoreSurvey::query()
                        ->where('template_id', $template->id)
                        ->pluck('id')
                        ->all();

                    if (! empty($surveyIds)) {
                        $answers = DB::table('health_score_answers')
                            ->whereIn('survey_id', $surveyIds)
                            ->where('question_id', $question->id)
                            ->get(['id', 'selected_option_id', 'score_value']);

                        foreach ($answers as $a) {
                            $score = is_numeric($a->score_value) ? (float) $a->score_value : null;
                            $targetOptionId = ($score !== null && $score >= 4.0) ? $yesOpt->id : $noOpt->id;
                            $targetScore = ($score !== null && $score >= 4.0) ? 5 : 1;
                            DB::table('health_score_answers')
                                ->where('id', $a->id)
                                ->update([
                                    'selected_option_id' => $targetOptionId,
                                    'score_value' => $targetScore,
                                ]);
                        }
                    }
                }
            }
        });
    }

    public function down(): void
    {
    }
};

