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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class HealthScoreController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensureDefaultTemplate((int) ($request->user()?->id ?? 0));

        $partners = Partner::query()
            ->orderBy('id')
            ->get(['id', 'cnc_id', 'name', 'status'])
            ->map(fn (Partner $p) => [
                'id' => $p->id,
                'cnc_id' => $p->cnc_id,
                'name' => $p->name,
                'status' => $p->status,
            ])
            ->values()
            ->all();

        $projects = Project::query()
            ->orderBy('cnc_id')
            ->get(['id', 'cnc_id', 'project_name', 'status'])
            ->map(fn (Project $p) => [
                'id' => $p->id,
                'cnc_id' => $p->cnc_id,
                'project_name' => $p->project_name,
                'status' => $p->status,
            ])
            ->values()
            ->all();

        $now = Carbon::now('Asia/Jakarta');
        $years = [];
        for ($y = $now->year - 1; $y <= $now->year + 1; $y++) {
            $years[] = $y;
        }

        $surveys = HealthScoreSurvey::query()
            ->with([
                'template:id,name,version',
            ])
            ->orderByDesc('created_at')
            ->limit(25)
            ->get()
            ->map(fn (HealthScoreSurvey $s) => [
                'id' => $s->id,
                'partner_id' => $s->partner_id,
                'project_id' => $s->project_id,
                'year' => $s->year,
                'quarter' => $s->quarter,
                'status' => $s->status,
                'score_total' => $s->score_total !== null ? (float) $s->score_total : null,
                'created_at' => $s->created_at?->toISOString(),
            ])
            ->values()
            ->all();

        return Inertia::render('HealthScore/Index', [
            'partners' => $partners,
            'projects' => $projects,
            'years' => $years,
            'quarters' => [1, 2, 3, 4],
            'surveys' => $surveys,
        ]);
    }

    public function store(Request $request): SymfonyResponse
    {
        return $this->createOrReuseSurvey($request);
    }

    public function create(Request $request): SymfonyResponse
    {
        return $this->createOrReuseSurvey($request);
    }

    private function createOrReuseSurvey(Request $request): SymfonyResponse
    {
        $template = $this->ensureDefaultTemplate((int) ($request->user()?->id ?? 0));

        $request->merge([
            'project_id' => $request->input('project_id') ?: null,
        ]);

        $data = $request->validate([
            'partner_id' => ['required', 'integer', 'exists:partners,id'],
            'project_id' => ['nullable', 'string', Rule::exists('projects', 'id')],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'quarter' => ['required', 'integer', 'min:1', 'max:4'],
        ]);

        $partnerId = (int) $data['partner_id'];
        $projectId = isset($data['project_id']) && $data['project_id'] !== '' ? (string) $data['project_id'] : null;
        $year = (int) $data['year'];
        $quarter = (int) $data['quarter'];

        $survey = DB::transaction(function () use ($template, $partnerId, $projectId, $year, $quarter, $request) {
            $q = HealthScoreSurvey::query()
                ->where('partner_id', $partnerId)
                ->where('year', $year)
                ->where('quarter', $quarter);

            if ($projectId) {
                $q->where('project_id', $projectId);
            } else {
                $q->whereNull('project_id');
            }

            $existing = $q->first();
            if ($existing) {
                return $existing;
            }

            $survey = new HealthScoreSurvey();
            $survey->template_id = $template->id;
            $survey->template_version = (int) $template->version;
            $survey->partner_id = $partnerId;
            $survey->project_id = $projectId;
            $survey->year = $year;
            $survey->quarter = $quarter;
            $survey->status = 'Draft';
            $survey->share_token = (string) Str::random(40);
            $survey->public_enabled = true;
            $survey->created_by = (int) ($request->user()?->id ?? 0);
            $survey->save();

            return $survey;
        });

        if (! $survey->share_token) {
            $survey->share_token = (string) Str::random(40);
            $survey->public_enabled = true;
            $survey->save();
        }

        return Inertia::location(route('health-score.show', ['survey' => $survey->id]));
    }

    public function show(Request $request, HealthScoreSurvey $survey): Response
    {
        $template = HealthScoreTemplate::query()
            ->where('id', $survey->template_id)
            ->first();

        if (! $template) {
            $template = $this->ensureDefaultTemplate((int) ($request->user()?->id ?? 0));
        }

        $template->load([
            'sections' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions.options' => fn ($q) => $q->orderBy('sort_order'),
        ]);

        $survey->load(['answers']);

        $answersByQuestion = [];
        foreach ($survey->answers as $a) {
            $answersByQuestion[$a->question_id] = [
                'selected_option_id' => $a->selected_option_id,
                'value_date' => $a->value_date?->toDateString(),
                'value_text' => $a->value_text,
                'note' => $a->note,
            ];
        }

        $partner = $survey->partner_id ? Partner::query()->find($survey->partner_id, ['id', 'cnc_id', 'name']) : null;
        $project = $survey->project_id ? Project::query()->find($survey->project_id, ['id', 'cnc_id', 'project_name']) : null;

        if (! $survey->share_token) {
            $survey->share_token = (string) Str::random(40);
            $survey->public_enabled = true;
            $survey->save();
        }

        $historyQuery = HealthScoreSurvey::query()
            ->where('partner_id', $survey->partner_id)
            ->where('year', $survey->year);

        if ($survey->project_id) {
            $historyQuery->where('project_id', $survey->project_id);
        } else {
            $historyQuery->whereNull('project_id');
        }

        $historyRows = $historyQuery
            ->get(['quarter', 'status', 'score_total', 'score_by_category', 'score_by_scope', 'score_by_module'])
            ->keyBy('quarter');

        $history = [];
        for ($q = 1; $q <= 4; $q++) {
            $row = $historyRows->get($q);
            $history[] = [
                'quarter' => $q,
                'status' => $row?->status,
                'score_total' => $row?->score_total !== null ? (float) $row->score_total : null,
                'score_by_category' => $row?->score_by_category,
                'score_by_scope' => $row?->score_by_scope,
                'score_by_module' => $row?->score_by_module,
            ];
        }

        return Inertia::render('HealthScore/Show', [
            'template' => [
                'id' => $template->id,
                'name' => $template->name,
                'version' => $template->version,
                'sections' => $template->sections->map(function (HealthScoreSection $s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'weight' => (float) $s->weight,
                        'questions' => $s->questions->map(function (HealthScoreQuestion $q) {
                            return [
                                'id' => $q->id,
                                'module' => $q->module,
                                'question_text' => $q->question_text,
                                'answer_type' => $q->answer_type,
                                'scoring_rule' => $q->scoring_rule,
                                'weight' => (float) $q->weight,
                                'required' => (bool) $q->required,
                                'note_instruction' => $q->note_instruction,
                                'note_penilaian' => $q->note_penilaian,
                                'options' => $q->options->map(function (HealthScoreQuestionOption $o) {
                                    return [
                                        'id' => $o->id,
                                        'label' => $o->label,
                                        'score_value' => (float) $o->score_value,
                                    ];
                                })->values()->all(),
                            ];
                        })->values()->all(),
                    ];
                })->values()->all(),
            ],
            'survey' => [
                'id' => $survey->id,
                'partner' => $partner ? ['id' => $partner->id, 'cnc_id' => $partner->cnc_id, 'name' => $partner->name] : null,
                'project' => $project ? ['id' => $project->id, 'cnc_id' => $project->cnc_id, 'project_name' => $project->project_name] : null,
                'year' => (int) $survey->year,
                'quarter' => (int) $survey->quarter,
                'status' => $survey->status,
                'score_total' => $survey->score_total !== null ? (float) $survey->score_total : null,
                'score_by_category' => $survey->score_by_category,
                'score_by_scope' => $survey->score_by_scope,
                'score_by_module' => $survey->score_by_module,
                'created_at' => $survey->created_at?->toISOString(),
                'anchor_start' => $survey->created_at?->copy()->startOfMonth()->toDateString(),
                'submitted_at' => $survey->submitted_at?->toISOString(),
                'public_enabled' => (bool) $survey->public_enabled,
                'public_url' => $survey->public_enabled ? url('/health-score/s/' . $survey->share_token) : null,
            ],
            'answersByQuestion' => $answersByQuestion,
            'history' => $history,
        ]);
    }

    public function publicShow(Request $request, string $token): Response
    {
        $survey = HealthScoreSurvey::query()
            ->where('share_token', $token)
            ->where('public_enabled', true)
            ->firstOrFail();

        $template = HealthScoreTemplate::query()
            ->where('id', $survey->template_id)
            ->first();

        if (! $template) {
            $template = $this->ensureDefaultTemplate(0);
            $survey->template_id = $template->id;
            $survey->template_version = (int) $template->version;
            $survey->save();
        }

        $template->load([
            'sections' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions.options' => fn ($q) => $q->orderBy('sort_order'),
        ]);

        $survey->load(['answers']);

        $answersByQuestion = [];
        foreach ($survey->answers as $a) {
            $answersByQuestion[$a->question_id] = [
                'selected_option_id' => $a->selected_option_id,
                'value_date' => $a->value_date?->toDateString(),
                'value_text' => $a->value_text,
                'note' => $a->note,
            ];
        }

        $partner = $survey->partner_id ? Partner::query()->find($survey->partner_id, ['id', 'cnc_id', 'name']) : null;
        $project = $survey->project_id ? Project::query()->find($survey->project_id, ['id', 'cnc_id', 'project_name']) : null;

        $historyQuery = HealthScoreSurvey::query()
            ->where('partner_id', $survey->partner_id)
            ->where('year', $survey->year);

        if ($survey->project_id) {
            $historyQuery->where('project_id', $survey->project_id);
        } else {
            $historyQuery->whereNull('project_id');
        }

        $historyRows = $historyQuery
            ->get(['quarter', 'status', 'score_total', 'score_by_category', 'score_by_scope', 'score_by_module'])
            ->keyBy('quarter');

        $history = [];
        for ($q = 1; $q <= 4; $q++) {
            $row = $historyRows->get($q);
            $history[] = [
                'quarter' => $q,
                'status' => $row?->status,
                'score_total' => $row?->score_total !== null ? (float) $row->score_total : null,
                'score_by_category' => $row?->score_by_category,
                'score_by_scope' => $row?->score_by_scope,
                'score_by_module' => $row?->score_by_module,
            ];
        }

        return Inertia::render('HealthScore/PublicShow', [
            'template' => [
                'id' => $template->id,
                'name' => $template->name,
                'version' => $template->version,
                'sections' => $template->sections->map(function (HealthScoreSection $s) {
                    return [
                        'id' => $s->id,
                        'name' => $s->name,
                        'weight' => (float) $s->weight,
                        'questions' => $s->questions->map(function (HealthScoreQuestion $q) {
                            return [
                                'id' => $q->id,
                                'module' => $q->module,
                                'question_text' => $q->question_text,
                                'answer_type' => $q->answer_type,
                                'scoring_rule' => $q->scoring_rule,
                                'weight' => (float) $q->weight,
                                'required' => (bool) $q->required,
                                'note_instruction' => $q->note_instruction,
                                'note_penilaian' => $q->note_penilaian,
                                'options' => $q->options->map(function (HealthScoreQuestionOption $o) {
                                    return [
                                        'id' => $o->id,
                                        'label' => $o->label,
                                        'score_value' => (float) $o->score_value,
                                    ];
                                })->values()->all(),
                            ];
                        })->values()->all(),
                    ];
                })->values()->all(),
            ],
            'survey' => [
                'id' => $survey->id,
                'partner' => $partner ? ['id' => $partner->id, 'cnc_id' => $partner->cnc_id, 'name' => $partner->name] : null,
                'project' => $project ? ['id' => $project->id, 'cnc_id' => $project->cnc_id, 'project_name' => $project->project_name] : null,
                'year' => (int) $survey->year,
                'quarter' => (int) $survey->quarter,
                'status' => $survey->status,
                'score_total' => $survey->score_total !== null ? (float) $survey->score_total : null,
                'score_by_category' => $survey->score_by_category,
                'score_by_scope' => $survey->score_by_scope,
                'score_by_module' => $survey->score_by_module,
                'created_at' => $survey->created_at?->toISOString(),
                'anchor_start' => $survey->created_at?->copy()->startOfMonth()->toDateString(),
                'submitted_at' => $survey->submitted_at?->toISOString(),
                'public_url' => url('/health-score/s/' . $survey->share_token),
            ],
            'answersByQuestion' => $answersByQuestion,
            'token' => $token,
            'history' => $history,
        ]);
    }

    public function publicStoreDraft(Request $request, string $token): SymfonyResponse
    {
        $survey = HealthScoreSurvey::query()
            ->where('share_token', $token)
            ->where('public_enabled', true)
            ->firstOrFail();

        $this->save($request, $survey, false, true);

        return Inertia::location(url('/health-score/s/' . $token));
    }

    public function publicSubmit(Request $request, string $token): SymfonyResponse
    {
        $survey = HealthScoreSurvey::query()
            ->where('share_token', $token)
            ->where('public_enabled', true)
            ->firstOrFail();

        $this->save($request, $survey, true, true);

        return Inertia::location(url('/health-score/s/' . $token));
    }

    public function storeDraft(Request $request, HealthScoreSurvey $survey): SymfonyResponse
    {
        $this->save($request, $survey, false);

        return Inertia::location(route('health-score.show', ['survey' => $survey->id]));
    }

    public function submit(Request $request, HealthScoreSurvey $survey): SymfonyResponse
    {
        $this->save($request, $survey, true);

        return Inertia::location(route('health-score.show', ['survey' => $survey->id]));
    }

    private function save(Request $request, HealthScoreSurvey $survey, bool $isSubmit, bool $isPublic = false): void
    {
        if ($survey->status === 'Submitted') {
            throw ValidationException::withMessages([
                'survey' => 'Survey sudah submitted dan terkunci.',
            ]);
        }

        $template = HealthScoreTemplate::query()->where('id', $survey->template_id)->first();
        if (! $template) {
            $template = $this->ensureDefaultTemplate((int) ($request->user()?->id ?? 0));
            $survey->template_id = $template->id;
            $survey->template_version = (int) $template->version;
            $survey->save();
        }

        $template->load([
            'sections' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions' => fn ($q) => $q->orderBy('sort_order'),
            'sections.questions.options' => fn ($q) => $q->orderBy('sort_order'),
        ]);

        $data = $request->validate([
            'answers' => ['required', 'array'],
        ]);

        $answers = $data['answers'];

        $questionsById = [];
        foreach ($template->sections as $section) {
            foreach ($section->questions as $q) {
                $questionsById[$q->id] = $q;
            }
        }

        foreach ($questionsById as $qid => $q) {
            $a = $answers[$qid] ?? null;
            if (! is_array($a)) {
                continue;
            }

            if ($q->answer_type === 'date') {
                $raw = isset($a['value_date']) ? (string) $a['value_date'] : '';
                $normalized = $this->normalizeValueDate($raw);
                $a['value_date'] = $normalized;
                $answers[$qid] = $a;
            }
        }

        foreach (array_keys($answers) as $qid) {
            if (! array_key_exists($qid, $questionsById)) {
                throw ValidationException::withMessages([
                    'answers' => 'Invalid answers payload.',
                ]);
            }
        }

        if ($isSubmit) {
            $errors = [];
            foreach ($questionsById as $qid => $q) {
                $a = $answers[$qid] ?? null;
                if (! $q->required) {
                    continue;
                }
                if (! is_array($a)) {
                    $errors["answers.$qid"] = 'Wajib diisi.';
                    continue;
                }
                if ($q->answer_type === 'single_select' && empty($a['selected_option_id'])) {
                    $errors["answers.$qid.selected_option_id"] = 'Wajib pilih status.';
                }
                if ($q->answer_type === 'date') {
                    if (empty($a['value_date'])) {
                        $errors["answers.$qid.value_date"] = 'Wajib isi tanggal.';
                    } elseif (! preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $a['value_date'])) {
                        $errors["answers.$qid.value_date"] = 'Format tanggal tidak valid.';
                    }
                }
            }

            if (! empty($errors)) {
                throw ValidationException::withMessages($errors);
            }
        }

        $now = Carbon::now('Asia/Jakarta');
        $anchorStart = $survey->created_at
            ? Carbon::parse($survey->created_at, 'Asia/Jakarta')->startOfMonth()
            : $now->copy()->startOfMonth();

        DB::transaction(function () use ($template, $survey, $answers, $questionsById, $isSubmit, $now, $anchorStart) {
            $survey->status = $isSubmit ? 'Submitted' : 'Draft';
            $survey->submitted_at = $isSubmit ? $now : null;
            $survey->save();

            $scoreContext = $this->computeScores($template, $survey->id, $answers, $questionsById, $now, $anchorStart);

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
        });
    }

    private function normalizeValueDate(?string $value): ?string
    {
        $raw = trim((string) ($value ?? ''));
        if ($raw === '' || $raw === '-') {
            return null;
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
            return $raw;
        }

        try {
            $d = Carbon::createFromFormat('d M y', $raw, 'Asia/Jakarta');
            return $d->toDateString();
        } catch (\Throwable $e) {
        }

        try {
            $d = Carbon::createFromFormat('d M Y', $raw, 'Asia/Jakarta');
            return $d->toDateString();
        } catch (\Throwable $e) {
        }

        return null;
    }

    private function computeScores(HealthScoreTemplate $template, string $surveyId, array $answers, array $questionsById, Carbon $now, Carbon $anchorStart): array
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
                $scoreRaw = (float) $this->scoreDate($q->scoring_rule, $valueDate, $anchorStart);
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

    private function scoreDate(?string $rule, string $valueDate, Carbon $anchorStart): int
    {
        $d = Carbon::parse($valueDate, 'Asia/Jakarta')->startOfDay();
        $anchor = $anchorStart->copy()->startOfDay();
        $daysAgo = $anchor->greaterThan($d) ? (int) $d->diffInDays($anchor) : 0;
        $r = $rule ?: 'recency_anchor_month';

        if ($r === 'recency_anchor_month') {
            if ($daysAgo <= 30) return 5;
            if ($daysAgo <= 60) return 4;
            if ($daysAgo <= 90) return 3;
            if ($daysAgo <= 120) return 2;
            if ($daysAgo <= 180) return 2;
            return 1;
        }

        return 1;
    }

    private function ensureDefaultTemplate(int $createdBy): HealthScoreTemplate
    {
        $template = HealthScoreTemplate::query()
            ->where('status', 'Active')
            ->orderByDesc('version')
            ->first();

        if ($template && (int) $template->version >= 3) {
            return $template;
        }

        if ($template) {
            $template->status = 'Inactive';
            $template->save();
        }

        return $this->createDefaultTemplate($createdBy);
    }

    private function createDefaultTemplate(int $createdBy): HealthScoreTemplate
    {
        return DB::transaction(function () use ($createdBy) {
            $template = HealthScoreTemplate::query()->create([
                'name' => 'Health Score Template',
                'status' => 'Active',
                'version' => 3,
                'created_by' => $createdBy ?: null,
            ]);

            $yesNoOptions = [
                ['label' => 'YES', 'score' => 5],
                ['label' => 'NO', 'score' => 1],
            ];

            $periodeOptions = [
                ['label' => 'Current Month (In-Sync)', 'score' => 5],
                ['label' => '1 Month Behind (Late Closing)', 'score' => 3],
                ['label' => '2+ Months Behind (Backlog)', 'score' => 1],
            ];

            $dsrGuestLedgerOptions = [
                ['label' => 'TODAY, MTD, YTD BALANCE', 'score' => 5],
                ['label' => 'TODAY, MTD BALANCE', 'score' => 3],
                ['label' => 'NOT BALANCE', 'score' => 1],
            ];

            $scopes = [
                'Financial Integrity' => 1,
                'Operational Continuity' => 2,
                'Technical Resilience' => 3,
            ];

            $addSelect = function (HealthScoreSection $section, string $module, string $text, array $options, int $weight, ?string $noteInstruction = null, ?string $notePenilaian = null, int $sortOrder = 0) {
                $q = HealthScoreQuestion::query()->create([
                    'section_id' => $section->id,
                    'module' => $module,
                    'question_text' => $text,
                    'answer_type' => 'single_select',
                    'scoring_rule' => null,
                    'weight' => $weight,
                    'sort_order' => $sortOrder,
                    'required' => true,
                    'note_instruction' => $noteInstruction,
                    'note_penilaian' => $notePenilaian,
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

            foreach ($scopes as $scopeName => $scopeSort) {
                $section = HealthScoreSection::query()->create([
                    'template_id' => $template->id,
                    'name' => $scopeName,
                    'weight' => 1,
                    'sort_order' => $scopeSort,
                ]);

                $qSort = 1;

                if ($scopeName === 'Financial Integrity') {
                    $addSelect(
                        $section,
                        'Account Receivable',
                        'Periode Account Receivable',
                        $periodeOptions,
                        13,
                        null,
                        "5 = Current Month (In-Sync)\n3 = 1 Month Behind (Late Closing)\n1 = 2+ Months Behind (Backlog)",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'Account Receivable',
                        'A/R City ledger Balance?',
                        $yesNoOptions,
                        2,
                        'Selisih AR dan GL bisa cek di Discrepancy Dashboard',
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'Account Receivable',
                        'A/R Deposit Balance?',
                        $yesNoOptions,
                        2,
                        'Selisih AR dan GL bisa cek di Ledger',
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'Account Receivable',
                        'A/R Credit Card Balance?',
                        $yesNoOptions,
                        2,
                        'Selisih AR dan GL bisa cek di Discrepancy Dashboard',
                        "5 = YES\n1 = NO",
                        $qSort++
                    );

                    $addSelect(
                        $section,
                        'Account Payable',
                        'Periode Account Payable',
                        $periodeOptions,
                        14,
                        null,
                        "5 = Current Month (In-Sync)\n3 = 1 Month Behind (Late Closing)\n1 = 2+ Months Behind (Backlog)",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'Account Payable',
                        'A/P Trade Balance?',
                        $yesNoOptions,
                        2,
                        'Selisih AP dan GL bisa cek di Discrepancy Dashboard',
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'Account Payable',
                        'A/P Deposit Balance?',
                        $yesNoOptions,
                        2,
                        'Selisih AP dan GL bisa cek di Ledger',
                        "5 = YES\n1 = NO",
                        $qSort++
                    );

                    $addSelect(
                        $section,
                        'Inventory Control',
                        'Periode Inventory Control',
                        $periodeOptions,
                        15,
                        null,
                        "5 = Current Month (In-Sync)\n3 = 1 Month Behind (Late Closing)\n1 = 2+ Months Behind (Backlog)",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'Inventory Control',
                        'On Hand Stock Balance?',
                        $yesNoOptions,
                        4,
                        'Selisih INV dan GL bisa cek di Discrepancy Dashboard',
                        "5 = YES\n1 = NO",
                        $qSort++
                    );

                    $addSelect(
                        $section,
                        'General Ledger',
                        'Periode General Ledger',
                        $periodeOptions,
                        18,
                        null,
                        "5 = Current Month (In-Sync)\n3 = 1 Month Behind (Late Closing)\n1 = 2+ Months Behind (Backlog)",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'General Ledger',
                        'A/R Clearance Balance?',
                        $yesNoOptions,
                        2,
                        'Selisih bisa cek di Ledger GL jika tidak 0',
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'General Ledger',
                        'A/P Clearance Balance?',
                        $yesNoOptions,
                        2,
                        'Selisih bisa cek di Ledger GL jika tidak 0',
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'General Ledger',
                        'F/A Transient Balance?',
                        $yesNoOptions,
                        2,
                        'Selisih bisa cek di Ledger GL jika tidak 0',
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'General Ledger',
                        'Bank Book Balance?',
                        $yesNoOptions,
                        4,
                        'Selisih bisa di cek dengan cara klik kanan Bank Book Calender (Bank Book vs G/L Discrepancy)',
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'General Ledger',
                        'Bank Clearance Balance?',
                        $yesNoOptions,
                        3,
                        'Selisih bisa cek di Ledger GL jika tidak 0',
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'General Ledger',
                        'Activa vs Pasiva Balance?',
                        $yesNoOptions,
                        5,
                        'bisa cek dengan cara klik kanan summary di Ledger',
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                }

                if ($scopeName === 'Operational Continuity') {
                    $addSelect(
                        $section,
                        'Front Office',
                        'Income Guest Ledger vs Register Audit Balance?',
                        $yesNoOptions,
                        2,
                        null,
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'Front Office',
                        'DSR TODAY, MTD, YTD (Guest Ledger) Balance?',
                        $dsrGuestLedgerOptions,
                        2,
                        'TODAY BALANCE tanggal terakhir menjadi acuan',
                        "5 = TODAY, MTD, YTD BALANCE\n3 = TODAY, MTD BALANCE\n1 = NOT BALANCE",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'Front Office',
                        'Contigency Report Running?',
                        $yesNoOptions,
                        1,
                        null,
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'Front Office',
                        'DSR vs Room Statistic Balance?',
                        $yesNoOptions,
                        1,
                        'Room Revenue yang menjadi acuan VS',
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'Front Office',
                        'Room Statistic vs Statistic Browser Balance?',
                        $yesNoOptions,
                        1,
                        'Room Revenue dan Room Night yang menjadi acuan VS',
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'Front Office',
                        'DSR vs Statistic Browser Balance?',
                        $yesNoOptions,
                        1,
                        'Room Revenue yang menjadi acuan VS',
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                }

                if ($scopeName === 'Technical Resilience') {
                    $addSelect(
                        $section,
                        'Database',
                        'Daily Backup Berjalan?',
                        $yesNoOptions,
                        30,
                        "backup disini bisa menggunakan DBCloud atau ZBackup",
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'Database',
                        'Semua Database bisa di Restore?',
                        $yesNoOptions,
                        35,
                        "ini dilakukan oleh IT untuk cek restore\nperbaikan tetap dari tim Powerpro jika ada error\njika salah satu database error, dianggap sebagai keseluruhan",
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'Database',
                        'Database di backup diluar lokasi Hotel?',
                        $yesNoOptions,
                        20,
                        null,
                        "5 = YES\n1 = NO",
                        $qSort++
                    );
                    $addSelect(
                        $section,
                        'Database',
                        'Terakhir melakukan Backup Restore?',
                        [
                            ['label' => 'Less than 1 Month (Current)', 'score' => 5],
                            ['label' => '1 - 3 Months (Moderate/Attention)', 'score' => 3],
                            ['label' => 'Over 3 Months (Critical/Long-term)', 'score' => 1],
                        ],
                        15,
                        null,
                        "5 = Less than 1 Month (Current)\n3 = 1 - 3 Months (Moderate/Attention)\n1 = Over 3 Months (Critical/Long-term)",
                        $qSort++
                    );
                }
            }

            return $template;
        });
    }
}
