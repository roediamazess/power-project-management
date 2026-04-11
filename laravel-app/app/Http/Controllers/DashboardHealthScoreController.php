<?php

namespace App\Http\Controllers;

use App\Models\HealthScoreAnswer;
use App\Models\HealthScoreQuestion;
use App\Models\HealthScoreQuestionOption;
use App\Models\HealthScoreSection;
use App\Models\HealthScoreSurvey;
use App\Models\HealthScoreTemplate;
use App\Models\Partner;
use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardHealthScoreController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::location(route('health-score.index'));
    }

    public function storeDraft(Request $request): RedirectResponse
    {
        return $this->save($request, false);
    }

    public function submit(Request $request): RedirectResponse
    {
        return $this->save($request, true);
    }

    private function save(Request $request, bool $isSubmit): RedirectResponse
    {
        $user = $request->user();

        $template = HealthScoreTemplate::query()
            ->where('status', 'Active')
            ->orderByDesc('version')
            ->first();

        if (! $template) {
            $template = $this->createDefaultTemplate((int) ($user?->id ?? 0));
        }

        $template->load([
            'sections' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions.options' => fn ($q) => $q->orderBy('sort_order'),
        ]);

        $data = $request->validate([
            'partner_id' => ['required', 'integer', 'exists:partners,id'],
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'quarter' => ['required', 'integer', 'min:1', 'max:4'],
            'answers' => ['required', 'array'],
        ]);

        $partnerId = (int) $data['partner_id'];
        $projectId = (int) $data['project_id'];
        $year = (int) $data['year'];
        $quarter = (int) $data['quarter'];
        $answers = $data['answers'];

        $questionIds = [];
        $questionsById = [];
        foreach ($template->sections as $section) {
            foreach ($section->questions as $q) {
                $questionIds[] = $q->id;
                $questionsById[$q->id] = $q;
            }
        }

        foreach (array_keys($answers) as $qid) {
            if (! in_array($qid, $questionIds, true)) {
                abort(422);
            }
        }

        if ($isSubmit) {
            foreach ($questionsById as $qid => $q) {
                $a = $answers[$qid] ?? null;
                if (! $q->required) {
                    continue;
                }
                if (! is_array($a)) {
                    abort(422);
                }
                if ($q->answer_type === 'single_select' && empty($a['selected_option_id'])) {
                    abort(422);
                }
                if ($q->answer_type === 'date' && empty($a['value_date'])) {
                    abort(422);
                }
            }
        }

        $now = Carbon::now('Asia/Jakarta');

        $result = DB::transaction(function () use ($template, $partnerId, $projectId, $year, $quarter, $answers, $questionsById, $isSubmit, $now, $user) {
            $survey = HealthScoreSurvey::query()->firstOrNew([
                'partner_id' => $partnerId,
                'project_id' => $projectId,
                'year' => $year,
                'quarter' => $quarter,
            ]);

            if ($survey->exists && $survey->status === 'Submitted') {
                abort(422);
            }

            $survey->template_id = $template->id;
            $survey->template_version = (int) $template->version;
            $survey->created_by = (int) ($user?->id ?? 0);
            $survey->status = $isSubmit ? 'Submitted' : 'Draft';
            $survey->submitted_at = $isSubmit ? $now : null;
            $survey->save();

            $scoreContext = $this->computeScores($template, $survey->id, $answers, $questionsById, $now);

            if ($isSubmit) {
                $survey->score_total = $scoreContext['score_total'];
                $survey->score_by_category = $scoreContext['score_by_scope'];
                $survey->score_by_scope = $scoreContext['score_by_scope'];
                $survey->score_by_module = $scoreContext['score_by_module'];
            } else {
                $survey->score_total = null;
                $survey->score_by_category = null;
                $survey->score_by_scope = null;
                $survey->score_by_module = null;
            }
            $survey->save();

            return $survey;
        });

        return redirect()
            ->route('dashboard.health-score', [
                'partner_id' => $partnerId,
                'project_id' => $projectId,
                'year' => $year,
                'quarter' => $quarter,
            ]);
    }

    private function computeScores(HealthScoreTemplate $template, string $surveyId, array $answers, array $questionsById, Carbon $now): array
    {
        $sectionScoreNumerator = [];
        $sectionQuestionWeightSum = [];

        foreach ($template->sections as $section) {
            $sectionScoreNumerator[$section->id] = 0.0;
            $sectionQuestionWeightSum[$section->id] = 0.0;
        }

        $moduleScoreNumerator = [];
        $moduleQuestionWeightSum = [];
        $globalNumerator = 0.0;
        $globalDenominator = 0.0;

        foreach ($questionsById as $qid => $q) {
            $a = $answers[$qid] ?? [];
            $selectedOptionId = isset($a['selected_option_id']) && $a['selected_option_id'] !== '' ? (string) $a['selected_option_id'] : null;
            $valueDate = isset($a['value_date']) && $a['value_date'] ? Carbon::parse($a['value_date'], 'Asia/Jakarta')->toDateString() : null;
            $valueText = isset($a['value_text']) ? (string) $a['value_text'] : null;
            $note = isset($a['note']) ? (string) $a['note'] : null;

            $scoreRaw = null;

            if ($q->answer_type === 'single_select' && $selectedOptionId) {
                $opt = HealthScoreQuestionOption::query()
                    ->where('id', $selectedOptionId)
                    ->where('question_id', $qid)
                    ->first();
                if ($opt) {
                    $scoreRaw = (float) $opt->score_value;
                }
            } elseif ($q->answer_type === 'date' && $valueDate) {
                $scoreRaw = (float) $this->scoreDate($q->scoring_rule, $valueDate, $now);
            }

            $scorePercent = $scoreRaw !== null ? ($scoreRaw / 5.0) * 100.0 : null;
            $qWeight = (float) $q->weight;
            $sectionId = $q->section_id;
            $moduleName = $q->module ? trim((string) $q->module) : null;

            if ($scorePercent !== null) {
                $sectionScoreNumerator[$sectionId] = ($sectionScoreNumerator[$sectionId] ?? 0.0) + ($scorePercent * $qWeight);
                $sectionQuestionWeightSum[$sectionId] = ($sectionQuestionWeightSum[$sectionId] ?? 0.0) + $qWeight;
                $globalNumerator += $scorePercent * $qWeight;
                $globalDenominator += $qWeight;

                if ($moduleName !== null && $moduleName !== '') {
                    $moduleScoreNumerator[$moduleName] = ($moduleScoreNumerator[$moduleName] ?? 0.0) + ($scorePercent * $qWeight);
                    $moduleQuestionWeightSum[$moduleName] = ($moduleQuestionWeightSum[$moduleName] ?? 0.0) + $qWeight;
                }
            }

            HealthScoreAnswer::query()->updateOrCreate(
                ['survey_id' => $surveyId, 'question_id' => $qid],
                [
                    'selected_option_id' => $selectedOptionId,
                    'value_date' => $valueDate,
                    'value_text' => $valueText,
                    'note' => $note,
                    'score_value' => $scoreRaw,
                ]
            );
        }

        $scoreByScope = [];

        foreach ($template->sections as $section) {
            $sid = $section->id;
            $den = (float) ($sectionQuestionWeightSum[$sid] ?? 0.0);
            $score = null;
            if ($den > 0) {
                $score = round(((float) $sectionScoreNumerator[$sid]) / $den, 2);
            }
            $scoreByScope[$section->name] = $score;
        }

        $scoreByModule = [];
        foreach ($moduleQuestionWeightSum as $module => $den) {
            $den = (float) $den;
            $score = null;
            if ($den > 0) {
                $score = round(((float) ($moduleScoreNumerator[$module] ?? 0.0)) / $den, 2);
            }
            $scoreByModule[$module] = $score;
        }

        $scoreTotal = $globalDenominator > 0 ? round($globalNumerator / $globalDenominator, 2) : null;

        return [
            'score_by_scope' => $scoreByScope,
            'score_by_module' => $scoreByModule,
            'score_total' => $scoreTotal,
        ];
    }

    private function scoreDate(?string $rule, string $valueDate, Carbon $now): int
    {
        $d = Carbon::parse($valueDate, 'Asia/Jakarta')->startOfDay();
        $days = (int) $d->diffInDays($now->copy()->startOfDay());
        $r = $rule ?: 'recency_30_90';

        if ($r === 'recency_30_90') {
            if ($days <= 30) {
                return 5;
            }
            if ($days <= 90) {
                return 3;
            }
            return 1;
        }

        return 1;
    }

    private function createDefaultTemplate(int $createdBy): HealthScoreTemplate
    {
        return DB::transaction(function () use ($createdBy) {
            $template = HealthScoreTemplate::query()->create([
                'name' => 'Health Score Template',
                'status' => 'Active',
                'version' => 1,
                'created_by' => $createdBy ?: null,
            ]);

            $sections = [
                'Database Key Check' => 1,
                'PowerFO Key Check' => 2,
                'Account Receivable Key Check' => 3,
                'Account Payable Key Check' => 4,
                'Inventory Control Key Check' => 5,
                'General Ledger Key Check' => 6,
            ];

            $yesNoOptions = [
                ['label' => 'YES', 'score' => 5],
                ['label' => 'NO', 'score' => 1],
            ];

            $balanceOptions = [
                ['label' => 'BALANCE', 'score' => 5],
                ['label' => 'NOT BALANCE', 'score' => 1],
            ];

            $balanceWithKnownFixOptions = [
                ['label' => 'NOT BALANCE (Unknown)', 'score' => 1],
                ['label' => 'NOT BALANCE (Known action)', 'score' => 3],
                ['label' => 'BALANCE', 'score' => 5],
            ];

            $dsrVsStatBrowserOptions = [
                ['label' => 'TODAY, MTD, YTD BALANCE', 'score' => 5],
                ['label' => 'TODAY, MTD BALANCE', 'score' => 3],
                ['label' => 'NOT BALANCE', 'score' => 1],
            ];

            foreach ($sections as $sectionName => $sort) {
                $section = HealthScoreSection::query()->create([
                    'template_id' => $template->id,
                    'name' => $sectionName,
                    'weight' => 1,
                    'sort_order' => $sort,
                ]);

                $qSort = 1;

                $addSelect = function (string $text, array $options, ?string $noteInstruction = null) use ($section, &$qSort) {
                    $q = HealthScoreQuestion::query()->create([
                        'section_id' => $section->id,
                        'question_text' => $text,
                        'answer_type' => 'single_select',
                        'scoring_rule' => null,
                        'weight' => 1,
                        'sort_order' => $qSort++,
                        'required' => true,
                        'note_instruction' => $noteInstruction,
                    ]);

                    $oSort = 1;
                    foreach ($options as $opt) {
                        HealthScoreQuestionOption::query()->create([
                            'question_id' => $q->id,
                            'label' => $opt['label'],
                            'score_value' => $opt['score'],
                            'sort_order' => $oSort++,
                        ]);
                    }
                };

                $addDate = function (string $text, ?string $noteInstruction = null) use ($section, &$qSort) {
                    HealthScoreQuestion::query()->create([
                        'section_id' => $section->id,
                        'question_text' => $text,
                        'answer_type' => 'date',
                        'scoring_rule' => 'recency_30_90',
                        'weight' => 1,
                        'sort_order' => $qSort++,
                        'required' => true,
                        'note_instruction' => $noteInstruction,
                    ]);
                };

                if ($sectionName === 'Database Key Check') {
                    $addSelect(
                        'Apakah Daily Backup berjalan dengan baik?',
                        $yesNoOptions,
                        "1. akan dibuatkan video oleh Jaja untuk cara cek nya\n2. Status akan menentukan Skor, otomoatis dari status\n3. backup disini bisa menggunakan DBCloud atau ZBackup"
                    );
                    $addSelect(
                        'Apakah Database Backup bisa di Restore semua Database?',
                        $yesNoOptions,
                        "1. ini dilakukan oleh IT untuk cek restore\n2. perbaikan tetap dari tim Powerpro jika ada error\n3. status akan menentukan skor\n4. jika salah satu database error, dianggap sebagai keseluruhan"
                    );
                    $addSelect(
                        'Apakah database backup diletakan di beda device',
                        $yesNoOptions,
                        "1. akan ada penambahan note di BA untuk menekankan simpan di beda device\n2. status akan menentukan skor"
                    );
                    $addDate(
                        'Kapan terakhir melakukan Backup Restore?',
                        "1. Status berdasarkan periode terakhir backup restore\n(documentasi pickup database)"
                    );
                }

                if ($sectionName === 'PowerFO Key Check') {
                    $addSelect(
                        'Bagaimana kondisi Income Guest Ledger vs Register Audit?',
                        $balanceWithKnownFixOptions,
                        "1 = jika tidak balance\n3 = jika tidak balance namun dari sisi accounting sudah tahu apa yang harus dilakukan atas not balance\n5 = balance"
                    );
                    $addSelect(
                        'Bagaimana kondisi DSR TODAY, MTD, YTD (Guest Ledger)?',
                        $balanceOptions,
                        "1. TODAY BALANCE tanggal terakhir menjadi acuan"
                    );
                    $addDate(
                        'Bagaimana Status Contigency Report?',
                        '-'
                    );
                    $addSelect(
                        'Bagaimana kondisi DSR vs Room Statistic?',
                        $balanceOptions,
                        "1. Room Revenue yang menjadi acuan VS"
                    );
                    $addSelect(
                        'Bagaimana kondisi Room Statistic vs Statistic browser?',
                        $balanceOptions,
                        "1. Room Revenue dan Room Night yang menjadi acuan VS"
                    );
                    $addSelect(
                        'Bagaimana kondisi DSR vs Statistic browser',
                        $dsrVsStatBrowserOptions,
                        "1. Room Revenue yang menjadi acuan VS"
                    );
                    $addSelect(
                        'Bagaimana kondisi Guest Ledger vs General Leder?',
                        $balanceOptions,
                        'FO vs GL'
                    );
                }

                if ($sectionName === 'Account Receivable Key Check') {
                    $addDate('Informasi Periode Account Receivable', '-');
                    $addSelect(
                        'Bagaimana kondisi A/R City ledger?',
                        $balanceOptions,
                        "Selisih AR dan GL bisa cek di Discrepancy Dashboard\n(Tim Pelaksana melakukan Update COA apa saja)"
                    );
                    $addSelect(
                        'Bagaimana kondisi A/R Deposit?',
                        $balanceOptions,
                        "Selisih AR dan GL bisa cek di Ledger\n(Tim Pelaksana melakukan Update COA apa saja)"
                    );
                    $addSelect(
                        'Bagaimana kondisi A/R Credit Card?',
                        $balanceOptions,
                        "Selisih AR dan GL bisa cek di Discrepancy Dashboard\n(Tim Pelaksana melakukan Update COA apa saja)"
                    );
                }

                if ($sectionName === 'Account Payable Key Check') {
                    $addDate('Informasi Periode Account Payable', '-');
                    $addSelect(
                        'Bgaimana kondisi A/P Trade',
                        $balanceOptions,
                        "Selisih AP dan GL bisa cek di Discrepancy Dashboard\n(Tim Pelaksana melakukan Update COA apa saja)"
                    );
                    $addSelect(
                        'Bagaimana kondisi A/P Deposit?',
                        $balanceOptions,
                        "Selisih AP dan GL bisa cek di Ledger\n(Tim Pelaksana melakukan Update COA apa saja)"
                    );
                }

                if ($sectionName === 'Inventory Control Key Check') {
                    $addDate('Informasi Periode Inventory Control', null);
                    $addSelect(
                        'Bagaimana kondisi On Hand Stock?',
                        $balanceOptions,
                        "Selisih INV dan GL bisa cek di Discrepancy Dashboard\n(Tim Pelaksana melakukan Update COA apa saja)"
                    );
                }

                if ($sectionName === 'General Ledger Key Check') {
                    $addDate('Informasi Periode General Ledger', '-');
                    $addSelect(
                        'Bagaimana kondisi A/R Clearance?',
                        $balanceOptions,
                        'Selisih bisa cek di Ledger GL jika tidak 0'
                    );
                    $addSelect(
                        'Bagaimana kondisi A/P Clearance?',
                        $balanceOptions,
                        'Selisih bisa cek di Ledger GL jika tidak 0'
                    );
                    $addSelect(
                        'Bagaimana kondisi F/A Transient?',
                        $balanceOptions,
                        'Selisih bisa cek di Ledger GL jika tidak 0'
                    );
                    $addSelect(
                        'Bagaimana kondisi Bank Book?',
                        $balanceOptions,
                        'Selisih bisa di cek dengan cara klik kanan Bank Book Calender (Bank Book vs G/L Discrepancy)'
                    );
                    $addSelect(
                        'Bagaimana kondisi Bank Clearance?',
                        $balanceOptions,
                        'Selisih bisa cek di Ledger GL jika tidak 0'
                    );
                    $addSelect(
                        'Bagaimana kondisi Activa vs Pasiva?',
                        $balanceOptions,
                        'bisa cek dengan cara klik kanan summary di Ledger'
                    );
                }
            }

            return $template;
        });
    }
}
