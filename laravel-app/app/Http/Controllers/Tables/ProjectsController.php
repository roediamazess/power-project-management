<?php

namespace App\Http\Controllers\Tables;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\Project;
use App\Models\AuditLog;
use App\Models\SiteNotification;
use App\Models\ProjectSetupOption;
use App\Models\ProjectPicAssignment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProjectsController extends Controller
{
    private const ASSIGNMENT_OPTIONS = [
        '',
        'Leader',
        'Assist',
    ];

    private const PROJECT_INFORMATION_OPTIONS = [
        'Request',
        'Submission',
    ];

    private const PIC_ASSIGNMENT_OPTIONS = [
        'Assignment',
        'Request',
    ];

    private const PIC_PERIOD_STATUS_OPTIONS = [
        'Tentative',
        'Scheduled',
        'Running',
        'Done',
        'Cancelled',
    ];

    private const PIC_PERIOD_STATE_OPTIONS = ['Open', 'Approved'];

    private const SETUP_CATEGORIES = [
        'type',
        'status',
    ];

    public function index(Request $request): Response
    {
        $data = $request->validate([
            'status_tab' => ['nullable', 'string', Rule::in(['all', 'running', 'planning', 'document', 'document_check', 'done', 'rejected'])],
            'partner_ids' => ['nullable', 'array'],
            'partner_ids.*' => ['integer', 'exists:partners,id'],
            'types' => ['nullable', 'array'],
            'types.*' => ['string', 'max:255', Rule::exists('project_setup_options', 'name')->where(fn ($q) => $q->where('category', 'type'))],
            'statuses' => ['nullable', 'array'],
            'statuses.*' => ['string', 'max:255', Rule::exists('project_setup_options', 'name')->where(fn ($q) => $q->where('category', 'status'))],
            'start_from' => ['nullable', 'date'],
            'start_to' => ['nullable', 'date'],
            'sort_by' => ['nullable', 'string', Rule::in(['no', 'partner', 'type', 'start_date', 'status'])],
            'sort_dir' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
        ]);

        $statusTab = $data['status_tab'] ?? 'running';
        $partnerIds = $data['partner_ids'] ?? [];
        $types = $data['types'] ?? [];
        $statuses = $data['statuses'] ?? [];
        $startFrom = $data['start_from'] ?? null;
        $startTo = $data['start_to'] ?? null;
        $sortBy = $data['sort_by'] ?? null;
        $sortDir = $data['sort_dir'] ?? 'asc';

        $query = Project::query()
            ->with(['picAssignments' => fn ($q) => $q->orderBy('start_date')->orderBy('id')]);

        if ($statusTab !== 'all') {
            $groups = [
                'running' => ['Running'],
                'planning' => ['Tentative', 'Scheduled'],
                'document' => ['Document'],
                'document_check' => ['Document Check'],
                'done' => ['Done'],
                'rejected' => ['Rejected'],
            ];
            $groupStatuses = $groups[$statusTab] ?? null;
            if ($groupStatuses) {
                $query->whereIn('status', $groupStatuses);
            }
        }

        if (is_array($partnerIds) && count($partnerIds)) {
            $query->whereIn('partner_id', array_values($partnerIds));
        }

        if (is_array($types) && count($types)) {
            $query->whereIn('type', array_values($types));
        }

        if (is_array($statuses) && count($statuses)) {
            $query->whereIn('status', array_values($statuses));
        }

        if ($startFrom) {
            $query->where('start_date', '>=', Carbon::parse($startFrom)->toDateString());
        }

        if ($startTo) {
            $query->where('start_date', '<=', Carbon::parse($startTo)->toDateString());
        }

        if ($sortBy) {
            if ($sortBy === 'partner') {
                $query->leftJoin('partners as p_sort', 'p_sort.id', '=', 'projects.partner_id')
                    ->select('projects.*')
                    ->orderBy('p_sort.cnc_id', $sortDir)
                    ->orderBy('p_sort.name', $sortDir)
                    ->orderBy('projects.no', 'asc');
            } else {
                $query->orderBy($sortBy, $sortDir);
                if ($sortBy !== 'no') {
                    $query->orderBy('no', 'asc');
                }
            }
        } else {
            $query->orderByDesc('created_at');
        }

        $projects = $query->paginate(50)->withQueryString();
        $projects = $this->mapPaginator($projects);

        $partners = Partner::query()
            ->orderBy('name')
            ->get(['id', 'cnc_id', 'name', 'status'])
            ->map(fn (Partner $p) => [
                'id' => $p->id,
                'cnc_id' => $p->cnc_id,
                'name' => $p->name,
                'status' => $p->status,
            ])
            ->values();

        $users = User::query()
            ->orderBy('name')
            ->get(['id', 'name', 'full_name', 'email', 'status', 'tier'])
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'full_name' => $u->full_name,
                'email' => $u->email,
                'status' => $u->status,
                'tier' => $u->tier,
            ])
            ->values();

        $setupOptions = ProjectSetupOption::query()
            ->whereIn('category', self::SETUP_CATEGORIES)
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category')
            ->map(fn ($items) => $items->map(fn ($o) => ['name' => $o->name, 'status' => $o->status])->values())
            ->toArray();

        $user = $request->user();
        $canReopenPicPeriod = $user ? ($user->can('projects.pic_period.reopen') || (method_exists($user, 'hasRole') && $user->hasRole('Administrator'))) : false;

        return Inertia::render('Tables/Projects/Index', [
            'projects' => $projects,
            'filters' => [
                'status_tab' => $statusTab,
                'partner_ids' => $partnerIds,
                'types' => $types,
                'statuses' => $statuses,
                'start_from' => $startFrom,
                'start_to' => $startTo,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
            'canReopenPicPeriod' => $canReopenPicPeriod,
            'partners' => $partners,
            'users' => $users,
            'setupOptions' => $setupOptions,
            'assignmentOptions' => self::ASSIGNMENT_OPTIONS,
            'projectInformationOptions' => self::PROJECT_INFORMATION_OPTIONS,
            'picAssignmentOptions' => self::PIC_ASSIGNMENT_OPTIONS,
        ]);
    }

    private function mapPaginator(LengthAwarePaginator $paginator): LengthAwarePaginator
    {
        $collection = $paginator->getCollection()->map(fn (Project $p) => [
            'id' => $p->id,
            'no' => $p->no,
            'cnc_id' => $p->cnc_id,
            'pic_user_id' => $p->pic_user_id,
            'pic_name' => $p->pic_name,
            'pic_email' => $p->pic_email,
            'pic_assignments' => $p->picAssignments->map(fn ($a) => [
                'id' => $a->id,
                'pic_user_id' => $a->pic_user_id,
                'pic_name' => $a->pic_name,
                'pic_email' => $a->pic_email,
                'start_date' => $a->start_date?->toDateString(),
                'end_date' => $a->end_date?->toDateString(),
                'assignment' => $a->assignment ?? 'Assignment',
                'status' => $a->status,
                'release_state' => $a->release_state === 'Released' ? 'Approved' : ($a->release_state ?? 'Open'),
            ])->values(),
            'pic_summary' => $p->picAssignments->pluck('pic_name')->filter()->unique()->values()->implode(', '),
            'partner_id' => $p->partner_id,
            'partner_name' => $p->partner_name,
            'project_name' => $p->project_name,
            'assignment' => $p->assignment,
            'project_information' => $p->project_information,
            'pic_assignment' => $p->pic_assignment,
            'pic_period_state' => $p->pic_period_state,
            'type' => $p->type,
            'start_date' => $p->start_date?->toDateString(),
            'end_date' => $p->end_date?->toDateString(),
            'total_days' => $p->total_days,
            'status' => $p->status,
            'handover_official_report' => $p->handover_official_report?->toDateString(),
            'handover_days' => $p->handover_days,
            'kpi2_pic' => $p->kpi2_pic,
            'check_official_report' => $p->check_official_report?->toDateString(),
            'check_days' => $p->check_days,
            'kpi2_officer' => $p->kpi2_officer,
            'point_ach' => $p->point_ach,
            'point_req' => $p->point_req,
            'percentage_of_point' => $p->percentage_of_point,
            'validation_date' => $p->validation_date?->toDateString(),
            'validation_days' => $p->validation_days,
            'kpi2_okr' => $p->kpi2_okr,
            'spreadsheet_id' => $p->spreadsheet_id,
            'spreadsheet_url' => $p->spreadsheet_url,
            'activity_sent' => $p->activity_sent?->toISOString(),
            's1_estimation_date' => $p->s1_estimation_date?->toDateString(),
            's1_over_days' => $p->s1_over_days,
            's1_count_emails_sent' => $p->s1_count_emails_sent,
            's2_email_sent' => $p->s2_email_sent,
            's3_email_sent' => $p->s3_email_sent,
        ]);

        $paginator->setCollection($collection);
        return $paginator;
    }


    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateProject($request);

        $picAssignments = $this->normalizePicAssignments($data);
        $data['pic_period_state'] = $data['pic_period_state'] ?? 'Open';
        $data['pic_assignments'] = $picAssignments;

        DB::transaction(function () use ($request, $data, $picAssignments) {
            $project = Project::query()->create($this->enrichAndCompute($data));
            $this->syncPicAssignments($project, $picAssignments, $request);

            $after = $this->projectSnapshot($project->fresh());
            AuditLog::record($request, 'create', Project::class, (string) $project->id, null, $after);

            $this->notifyProjectUpdate($project, $request->user(), 'Project Created');
        });

        return redirect()->route('projects.index');
    }

    public function update(Request $request, Project $project): RedirectResponse
    {
        $data = $this->validateProject($request, $project);

        $picAssignments = $this->normalizePicAssignments($data);
        $data['pic_period_state'] = $data['pic_period_state'] ?? ($project->pic_period_state ?? 'Open');
        $data['pic_assignments'] = $picAssignments;

        DB::transaction(function () use ($request, $project, $data, $picAssignments) {
            $before = $this->projectSnapshot($project->fresh());

            $project->update($this->enrichAndCompute($data));
            $this->syncPicAssignments($project, $picAssignments, $request);

            $after = $this->projectSnapshot($project->fresh());
            AuditLog::record($request, 'update', Project::class, (string) $project->id, $before, $after);

            $this->notifyProjectUpdate($project, $request->user(), 'Project Updated');
        });

        return redirect()->route('projects.index');
    }

    public function destroy(Request $request, Project $project): RedirectResponse
    {
        DB::transaction(function () use ($request, $project) {
            $before = $this->projectSnapshot($project->fresh());

            $assignments = $project->picAssignments()->get();
            foreach ($assignments as $a) {
                AuditLog::record($request, 'delete', ProjectPicAssignment::class, (string) $a->id, $a->toArray(), null, [
                    'project_id' => (string) $project->id,
                ]);
            }

            $projectId = (string) $project->id;
            $project->delete();
            AuditLog::record($request, 'delete', Project::class, $projectId, $before, null);

            $this->notifyProjectUpdate($project, $request->user(), 'Project Deleted');
        });

        return redirect()->route('projects.index');
    }

    private function notifyProjectUpdate(Project $project, ?User $actor, string $title): void
    {
        $actorId = $actor ? (int) $actor->id : null;
        $body = trim(($project->cnc_id ? "{$project->cnc_id} — " : '') . ($project->project_name ?? 'Project'));

        $userIds = ProjectPicAssignment::query()
            ->where('project_id', $project->id)
            ->pluck('pic_user_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($project->pic_user_id) {
            $userIds[] = (int) $project->pic_user_id;
        }

        $adminIds = User::query()
            ->whereHas('roles', fn ($q) => $q->whereIn('name', ['Administrator', 'Admin Officer']))
            ->pluck('id')
            ->values()
            ->all();

        $userIds = array_merge($userIds, $adminIds);
        $userIds = array_values(array_unique(array_map('intval', $userIds)));

        foreach ($userIds as $uid) {
            if ($actorId && $uid === $actorId) continue;
            SiteNotification::query()->create([
                'user_id' => $uid,
                'type' => 'project',
                'title' => $title,
                'body' => $body,
                'url' => route('projects.index'),
                'actor_user_id' => $actorId,
            ]);
        }
    }

    private function validateProject(Request $request, ?Project $project = null): array
    {
        $rules = [
            'cnc_id' => ['nullable', 'string', 'max:50'],
            'pic_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'project_name' => ['nullable', 'string'],
            'assignment' => ['nullable', 'string', Rule::in(self::ASSIGNMENT_OPTIONS)],
            'project_information' => ['required', 'string', Rule::in(self::PROJECT_INFORMATION_OPTIONS)],
            'pic_assignment' => ['nullable', 'string', Rule::in(self::PIC_ASSIGNMENT_OPTIONS)],
            'pic_period_state' => ['nullable', 'string', Rule::in(self::PIC_PERIOD_STATE_OPTIONS)],
            'type' => ['required', 'string', 'max:255', Rule::exists('project_setup_options', 'name')->where(fn ($q) => $q->where('category', 'type'))],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'status' => ['required', 'string', 'max:255', Rule::exists('project_setup_options', 'name')->where(fn ($q) => $q->where('category', 'status'))],
            'handover_official_report' => ['nullable', 'date'],
            'kpi2_pic' => ['nullable', 'string'],
            'check_official_report' => ['nullable', 'date'],
            'check_days' => ['nullable', 'string'],
            'kpi2_officer' => ['nullable', 'string'],
            'point_ach' => ['nullable', 'integer'],
            'point_req' => ['nullable', 'integer'],
            'validation_date' => ['nullable', 'date'],
            'kpi2_okr' => ['nullable', 'string'],
            'spreadsheet_id' => ['nullable', 'string'],
            'spreadsheet_url' => ['nullable', 'string'],
            'activity_sent' => ['nullable', 'date'],
            's1_estimation_date' => ['nullable', 'date'],
            's1_over_days' => ['nullable', 'string'],
            's1_count_emails_sent' => ['nullable', 'string'],
            's2_email_sent' => ['nullable', 'string'],
            's3_email_sent' => ['nullable', 'string'],
            'pic_assignments' => ['nullable', 'array'],
            'pic_assignments.*.id' => ['nullable', 'integer'],
            'pic_assignments.*.pic_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'pic_assignments.*.start_date' => ['nullable', 'date'],
            'pic_assignments.*.end_date' => ['nullable', 'date'],
            'pic_assignments.*.assignment' => ['nullable', 'string', Rule::in(self::PIC_ASSIGNMENT_OPTIONS)],
            'pic_assignments.*.status' => ['required', 'string', Rule::in(self::PIC_PERIOD_STATUS_OPTIONS)],
            'pic_assignments.*.release_state' => ['nullable', 'string', Rule::in(self::PIC_PERIOD_STATE_OPTIONS)],
        ];

        $validator = Validator::make($request->all(), $rules);

        $validator->after(function ($validator) use ($request, $project) {
            $data = $request->all();
            $projectStartRaw = $data['start_date'] ?? null;
            $projectEndRaw = $data['end_date'] ?? null;

            $assignments = $data['pic_assignments'] ?? [];
            if (! is_array($assignments)) {
                $assignments = [];
            }

            $hasAnyPicRow = collect($assignments)->contains(function ($r) {
                if (! is_array($r)) return false;
                return ! empty($r['pic_user_id']) || ! empty($r['start_date']) || ! empty($r['end_date']);
            });

            if ($hasAnyPicRow && (! $projectStartRaw || ! $projectEndRaw)) {
                if (! $projectStartRaw) {
                    $validator->errors()->add('start_date', 'Wajib diisi jika ada PIC periode.');
                }
                if (! $projectEndRaw) {
                    $validator->errors()->add('end_date', 'Wajib diisi jika ada PIC periode.');
                }
                return;
            }

            if (! $projectStartRaw || ! $projectEndRaw) {
                return;
            }

            try {
                $projectStart = Carbon::parse($projectStartRaw)->startOfDay();
                $projectEnd = Carbon::parse($projectEndRaw)->startOfDay();
            } catch (\Throwable $e) {
                return;
            }

            foreach ($assignments as $i => $row) {
                if (! is_array($row)) continue;

                $rowStartRaw = $row['start_date'] ?? null;
                $rowEndRaw = $row['end_date'] ?? null;
                $rowPicUserId = $row['pic_user_id'] ?? null;
                $rowStatus = $row['status'] ?? null;

                if (! empty($rowPicUserId) && ! $rowStartRaw) {
                    $validator->errors()->add("pic_assignments.{$i}.start_date", 'Wajib diisi jika PIC dipilih.');
                }

                if (! empty($rowPicUserId) && ! $rowEndRaw) {
                    $validator->errors()->add("pic_assignments.{$i}.end_date", 'Wajib diisi jika PIC dipilih.');
                }

                if (! empty($rowPicUserId) && ! $rowStatus) {
                    $validator->errors()->add("pic_assignments.{$i}.status", 'Wajib diisi jika PIC dipilih.');
                }


                $rowStart = null;
                $rowEnd = null;

                try {
                    if ($rowStartRaw) $rowStart = Carbon::parse($rowStartRaw)->startOfDay();
                    if ($rowEndRaw) $rowEnd = Carbon::parse($rowEndRaw)->startOfDay();
                } catch (\Throwable $e) {
                    continue;
                }

                if ($rowStart && ($rowStart->lt($projectStart) || $rowStart->gt($projectEnd))) {
                    $validator->errors()->add("pic_assignments.{$i}.start_date", 'Tidak boleh di luar periode project.');
                }

                if ($rowEnd && ($rowEnd->lt($projectStart) || $rowEnd->gt($projectEnd))) {
                    $validator->errors()->add("pic_assignments.{$i}.end_date", 'Tidak boleh di luar periode project.');
                }

                if ($rowStart && $rowEnd && $rowStart->gt($rowEnd)) {
                    $validator->errors()->add("pic_assignments.{$i}.end_date", 'End Date tidak boleh sebelum Start Date.');
                }
            }

            if (! $project) {
                return;
            }
            // Abaikan kunci level proyek; kunci diterapkan per-row release_state saja.

            // Selalu jalankan enforcement per-row
            {
                $user = $request->user();
                $isAdmin = $user && method_exists($user, 'hasRole') ? $user->hasRole('Administrator') : false;
                $canReopen = $user ? $user->can('projects.pic_period.reopen') : false;

                $existingById = $project->picAssignments()
                    ->orderBy('start_date')
                    ->orderBy('id')
                    ->get()
                    ->filter(fn ($a) => $a->pic_user_id !== null || $a->start_date !== null || $a->end_date !== null)
                    ->keyBy('id');

                $incoming = $this->normalizePicAssignments($data);
                $incomingById = collect($incoming)
                    ->filter(fn ($r) => ! empty($r['id']))
                    ->keyBy(fn ($r) => (int) $r['id']);

                // Approved rows cannot be removed unless reopened
                foreach ($existingById as $id => $a) {
                    $prevState = $a->release_state === 'Released' ? 'Approved' : ($a->release_state ?? 'Open');
                    if ($prevState !== 'Approved') continue;
                    if (! $incomingById->has((int) $id)) {
                        $validator->errors()->add('pic_assignments', 'Ada PIC Periode berstatus Approved yang dihapus. Reopen baris tersebut (Open) dulu untuk mengubah.');
                        break;
                    }
                }

                // Enforce per-row locking rules based on existing row state
                foreach ($incomingById as $id => $row) {
                    if (! $existingById->has($id)) continue;
                    $a = $existingById->get($id);

                    $prevState = $a->release_state === 'Released' ? 'Approved' : ($a->release_state ?? 'Open');
                    $nextState = ($row['release_state'] ?? $prevState) === 'Released' ? 'Approved' : ($row['release_state'] ?? $prevState);

                    if ($prevState === 'Approved') {
                        if ($nextState === 'Open') {
                            if (! ($isAdmin || $canReopen)) {
                                $validator->errors()->add('pic_assignments', 'Hanya Administrator yang dapat Reopen (Approved → Open) baris PIC.');
                                break;
                            }
                            continue;
                        }

                        // When Approved, PIC/Beginning/Ending cannot change; Status may change
                        $incomingPic = $row['pic_user_id'] ?? null;
                        $incomingStart = $row['start_date'] ?? null;
                        $incomingEnd = $row['end_date'] ?? null;

                        $existingPic = $a->pic_user_id;
                        $existingStart = $a->start_date?->toDateString();
                        $existingEnd = $a->end_date?->toDateString();

                        if ((string) ($incomingPic ?? '') !== (string) ($existingPic ?? '')
                            || (string) ($incomingStart ?? '') !== (string) ($existingStart ?? '')
                            || (string) ($incomingEnd ?? '') !== (string) ($existingEnd ?? '')) {
                            $validator->errors()->add('pic_assignments', 'PIC Periode berstatus Approved tidak bisa mengubah PIC/Beginning/Ending. Reopen (Open) dulu untuk mengubah.');
                            break;
                        }
                    }
                }
            }
        });

        return $validator->validate();
    }


    private function normalizePicAssignments(array $data): array
    {
        $items = $data['pic_assignments'] ?? null;

        if (is_array($items) && count($items) > 0) {
            return collect($items)
                ->filter(fn ($r) => is_array($r))
                ->map(function ($r) {
                    $state = $r['release_state'] ?? 'Open';
                    if ($state === 'Released') $state = 'Approved';
                    if ($state !== 'Approved') $state = 'Open';

                    return [
                        'id' => $r['id'] ?? null,
                        'pic_user_id' => $r['pic_user_id'] ?? null,
                        'start_date' => $r['start_date'] ?? null,
                        'end_date' => $r['end_date'] ?? null,
                        'assignment' => ($r['assignment'] ?? null) ?: 'Assignment',
                        'status' => ($r['status'] ?? null) ?: 'Scheduled',
                        'release_state' => $state,
                    ];
                })
                ->filter(function ($r) {
                    return ($r['pic_user_id'] ?? null) !== null
                        || ! empty($r['start_date'] ?? null)
                        || ! empty($r['end_date'] ?? null);
                })
                ->values()
                ->all();
        }

        if (! empty($data['pic_user_id'])) {
            return [[
                'pic_user_id' => $data['pic_user_id'],
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $data['end_date'] ?? null,
                'assignment' => 'Assignment',
                'status' => 'Scheduled',
                'release_state' => 'Open',
            ]];
        }

        return [];
    }

    private function syncPicAssignments(Project $project, array $assignments, Request $request): void
    {
        $existing = $project->picAssignments()->get()->keyBy('id');

        $incoming = collect($assignments)
            ->filter(fn ($r) => is_array($r))
            ->map(function ($r) {
                $state = $r['release_state'] ?? 'Open';
                if ($state === 'Released') $state = 'Approved';
                if ($state !== 'Approved') $state = 'Open';

                return [
                    'id' => $r['id'] ?? null,
                    'pic_user_id' => $r['pic_user_id'] ?? null,
                    'start_date' => $r['start_date'] ?? null,
                    'end_date' => $r['end_date'] ?? null,
                    'assignment' => ($r['assignment'] ?? null) ?: 'Assignment',
                    'status' => ($r['status'] ?? null) ?: 'Scheduled',
                    'release_state' => $state,
                ];
            })
            ->filter(function ($r) {
                return ($r['pic_user_id'] ?? null) !== null
                    || ! empty($r['start_date'] ?? null)
                    || ! empty($r['end_date'] ?? null);
            })
            ->values();

        $seenIds = [];

        foreach ($incoming as $row) {
            $id = $row['id'] ? (int) $row['id'] : null;

            $user = null;
            if (! empty($row['pic_user_id'])) {
                $user = User::query()->find($row['pic_user_id']);
            }

            $payload = [
                'pic_user_id' => $row['pic_user_id'] ?? null,
                'pic_name' => $user?->name,
                'pic_email' => $user?->email,
                'start_date' => $row['start_date'] ?? null,
                'end_date' => $row['end_date'] ?? null,
                'assignment' => ($row['assignment'] ?? null) ?: 'Assignment',
                'status' => ($row['status'] ?? null) ?: 'Scheduled',
                'release_state' => $row['release_state'] ?? 'Open',
            ];

            if ($id && $existing->has($id)) {
                $model = $existing->get($id);
                if ((int) $model->project_id !== (int) $project->id) {
                    continue;
                }

                $isApproved = in_array(($model->release_state ?? 'Open'), ['Approved', 'Released'], true);
                if ($isApproved) {
                    $payload['pic_user_id'] = $model->pic_user_id;
                    $payload['pic_name'] = $model->pic_name;
                    $payload['pic_email'] = $model->pic_email;
                    $payload['start_date'] = $model->start_date?->toDateString();
                    $payload['end_date'] = $model->end_date?->toDateString();
                    $payload['assignment'] = $model->assignment ?? 'Assignment';
                    $payload['release_state'] = $model->release_state === 'Released' ? 'Approved' : ($model->release_state ?? 'Approved');
                }

                $before = $model->fresh()->toArray();
                $model->fill($payload);
                $model->save();
                $after = $model->fresh()->toArray();
                AuditLog::record($request, 'update', ProjectPicAssignment::class, (string) $model->id, $before, $after, [
                    'project_id' => (string) $project->id,
                ]);

                $seenIds[] = $id;
                continue;
            }

            $created = ProjectPicAssignment::query()->create([
                'project_id' => $project->id,
                ...$payload,
            ]);
            AuditLog::record($request, 'create', ProjectPicAssignment::class, (string) $created->id, null, $created->fresh()->toArray(), [
                'project_id' => (string) $project->id,
            ]);
            $seenIds[] = (int) $created->id;
        }

        foreach ($existing as $id => $model) {
            if (in_array((int) $id, $seenIds, true)) continue;
            if (in_array(($model->release_state ?? 'Open'), ['Approved', 'Released'], true)) {
                continue;
            }
            $before = $model->toArray();
            AuditLog::record($request, 'delete', ProjectPicAssignment::class, (string) $model->id, $before, null, [
                'project_id' => (string) $project->id,
            ]);
            $model->delete();
        }

        $project->load(['picAssignments' => fn ($q) => $q->orderBy('start_date')->orderBy('id')]);
    }

    private function enrichAndCompute(array $data): array
    {
        $partnerName = null;
        if (! empty($data['partner_id'])) {
            $partner = Partner::query()->find($data['partner_id']);
            $partnerName = $partner?->name;
        }

        $picName = null;
        $picEmail = null;

        $preferredPicUserId = $data['pic_user_id'] ?? null;
        if (! $preferredPicUserId && ! empty($data['pic_assignments']) && is_array($data['pic_assignments'])) {
            $first = collect($data['pic_assignments'])->first();
            $preferredPicUserId = is_array($first) ? ($first['pic_user_id'] ?? null) : null;
        }

        if (! empty($preferredPicUserId)) {
            $user = User::query()->find($preferredPicUserId);
            $picName = $user?->name;
            $picEmail = $user?->email;
        }

        $start = ! empty($data['start_date']) ? Carbon::parse($data['start_date']) : null;
        $end = ! empty($data['end_date']) ? Carbon::parse($data['end_date']) : null;

        $totalDays = null;
        if ($start && $end) {
            $diff = $start->diffInDays($end, false);
            $totalDays = $diff >= 0 ? $diff + 1 : null;
        }

        $handoverDays = null;
        if ($end && ! empty($data['handover_official_report'])) {
            $handover = Carbon::parse($data['handover_official_report']);
            $handoverDays = $end->diffInDays($handover, false);
        }

        $validationDays = null;
        if ($end && ! empty($data['validation_date'])) {
            $validation = Carbon::parse($data['validation_date']);
            $validationDays = $end->diffInDays($validation, false);
        }

        $percentage = null;
        if (isset($data['point_ach'], $data['point_req']) && $data['point_ach'] !== null && $data['point_req'] !== null && (int) $data['point_req'] > 0) {
            $percentage = round(((float) $data['point_ach'] / (float) $data['point_req']) * 100, 2);
        }

        return [
            ...$data,
            'partner_name' => $partnerName,
            'pic_name' => $picName,
            'pic_email' => $picEmail,
            'total_days' => $totalDays,
            'handover_days' => $handoverDays,
            'validation_days' => $validationDays,
            'percentage_of_point' => $percentage,
        ];
    }


    private function projectSnapshot(Project $project): array
    {
        $project->load(['picAssignments' => fn ($q) => $q->orderBy('start_date')->orderBy('id')]);

        $base = $project->toArray();

        $base['pic_assignments'] = $project->picAssignments
            ->map(fn ($a) => [
                'id' => $a->id,
                'pic_user_id' => $a->pic_user_id,
                'pic_name' => $a->pic_name,
                'pic_email' => $a->pic_email,
                'start_date' => $a->start_date?->toDateString(),
                'end_date' => $a->end_date?->toDateString(),
                'assignment' => $a->assignment ?? 'Assignment',
                'status' => $a->status,
            ])
            ->values()
            ->all();

        return $base;
    }

}
