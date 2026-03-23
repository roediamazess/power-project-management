<?php

namespace App\Http\Controllers\Tables;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Partner;
use App\Models\Project;
use App\Models\TimeBoxing;
use App\Models\TimeBoxingSetupOption;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\JsonResponse;

class TimeBoxingsController extends Controller
{
    private const PRIORITIES = [
        'Normal',
        'High',
        'Urgent',
    ];

    private const STATUSES = [
        'Brain Dump',
        'Priority List',
        'Time Boxing',
        'Completed',
    ];

    public function index(Request $request): Response
    {
        $data = $request->validate([
            'status' => ['nullable', 'string', Rule::in(array_merge(['all', 'active'], self::STATUSES))],
            'statuses' => ['nullable', 'array'],
            'statuses.*' => ['string', Rule::in(self::STATUSES)],
            'priorities' => ['nullable', 'array'],
            'priorities.*' => ['string', Rule::in(self::PRIORITIES)],
            'types' => ['nullable', 'array'],
            'types.*' => ['string', 'max:255', Rule::exists('time_boxing_setup_options', 'name')->where(fn ($q) => $q->where('category', 'type'))],
            'partner_ids' => ['nullable', 'array'],
            'partner_ids.*' => ['integer', 'exists:partners,id'],
            'project_id' => ['nullable', 'string', 'exists:projects,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'due_from' => ['nullable', 'date'],
            'due_to' => ['nullable', 'date'],
            'sort_by' => ['nullable', 'string', Rule::in(['no', 'information_date', 'type', 'priority', 'partner', 'status', 'due_date'])],
            'sort_dir' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
        ]);

        $status = $data['status'] ?? 'active';
        $statuses = $data['statuses'] ?? [];
        $priorities = $data['priorities'] ?? [];
        $types = $data['types'] ?? [];
        $partnerIds = $data['partner_ids'] ?? [];
        $projectId = $data['project_id'] ?? null;
        $dateFrom = $data['date_from'] ?? null;
        $dateTo = $data['date_to'] ?? null;
        $dueFrom = $data['due_from'] ?? null;
        $dueTo = $data['due_to'] ?? null;
        $sortBy = $data['sort_by'] ?? 'no';
        $sortDir = $data['sort_dir'] ?? 'asc';

        $query = TimeBoxing::query()
            ->with([
                'partner:id,cnc_id,name',
                'project:id,cnc_id,project_name',
            ]);

        if ($status !== 'all') {
            if ($status === 'active') {
                $activeStatuses = array_values(array_filter(self::STATUSES, fn ($s) => $s !== 'Completed'));
                $query->whereIn('status', $activeStatuses);
            } else {
                $query->where('status', $status);
            }
        }

        if (is_array($statuses) && count($statuses)) {
            $query->whereIn('status', array_values($statuses));
        }

        if (is_array($priorities) && count($priorities)) {
            $query->whereIn('priority', array_values($priorities));
        }

        if (is_array($types) && count($types)) {
            $query->whereIn('type', array_values($types));
        }

        if (is_array($partnerIds) && count($partnerIds)) {
            $query->whereIn('partner_id', array_values($partnerIds));
        }

        if ($projectId) {
            $query->where('project_id', $projectId);
        }

        if ($dateFrom) {
            $query->where('information_date', '>=', Carbon::parse($dateFrom)->toDateString());
        }

        if ($dateTo) {
            $query->where('information_date', '<=', Carbon::parse($dateTo)->toDateString());
        }

        if ($dueFrom) {
            $query->where('due_date', '>=', Carbon::parse($dueFrom)->toDateString());
        }

        if ($dueTo) {
            $query->where('due_date', '<=', Carbon::parse($dueTo)->toDateString());
        }

        if ($sortBy === 'partner') {
            $query->leftJoin('partners as p_sort', 'p_sort.id', '=', 'time_boxings.partner_id')
                ->select('time_boxings.*')
                ->orderBy('p_sort.cnc_id', $sortDir)
                ->orderBy('p_sort.name', $sortDir)
                ->orderBy('time_boxings.no', 'asc');
        } else {
            $query->orderBy($sortBy, $sortDir);
            if ($sortBy !== 'no') {
                $query->orderBy('no', 'asc');
            }
        }

        $items = $query->paginate(50)->withQueryString();
        $items = $this->mapPaginator($items);

        $typeOptions = TimeBoxingSetupOption::query()
            ->where('category', 'type')
            ->orderBy('name')
            ->get()
            ->map(fn (TimeBoxingSetupOption $o) => [
                'name' => $o->name,
                'status' => $o->status,
            ])
            ->values();

        $partners = Partner::query()
            ->orderBy('id')
            ->get(['id', 'cnc_id', 'name', 'status'])
            ->map(fn (Partner $p) => [
                'id' => $p->id,
                'cnc_id' => $p->cnc_id,
                'name' => $p->name,
                'status' => $p->status,
            ]);

        $projects = Project::query()
            ->orderBy('cnc_id')
            ->get(['id', 'cnc_id', 'project_name', 'status'])
            ->map(fn (Project $p) => [
                'id' => $p->id,
                'cnc_id' => $p->cnc_id,
                'project_name' => $p->project_name,
                'status' => $p->status,
            ]);

        return Inertia::render('Tables/TimeBoxing/Index', [
            'items' => $items,
            'filters' => [
                'status' => $status,
                'statuses' => $statuses,
                'priorities' => $priorities,
                'types' => $types,
                'partner_ids' => $partnerIds,
                'project_id' => $projectId,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'due_from' => $dueFrom,
                'due_to' => $dueTo,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
            'typeOptions' => $typeOptions,
            'priorityOptions' => self::PRIORITIES,
            'statusOptions' => self::STATUSES,
            'partners' => $partners,
            'projects' => $projects,
        ]);
    }

    public function options(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['nullable', 'string', Rule::in(array_merge(['all', 'active'], self::STATUSES))],
        ]);

        $status = $data['status'] ?? 'active';

        $query = TimeBoxing::query();

        if ($status !== 'all') {
            if ($status === 'active') {
                $activeStatuses = array_values(array_filter(self::STATUSES, fn ($s) => $s !== 'Completed'));
                $query->whereIn('status', $activeStatuses);
            } else {
                $query->where('status', $status);
            }
        }

        $informationDates = (clone $query)
            ->whereNotNull('information_date')
            ->select('information_date')
            ->distinct()
            ->orderBy('information_date', 'asc')
            ->pluck('information_date')
            ->map(fn ($d) => (string) $d)
            ->values();

        $dueDates = (clone $query)
            ->whereNotNull('due_date')
            ->select('due_date')
            ->distinct()
            ->orderBy('due_date', 'asc')
            ->pluck('due_date')
            ->map(fn ($d) => (string) $d)
            ->values();

        $types = (clone $query)
            ->whereNotNull('type')
            ->select('type')
            ->distinct()
            ->orderBy('type', 'asc')
            ->pluck('type')
            ->map(fn ($t) => (string) $t)
            ->values();

        $priorities = (clone $query)
            ->whereNotNull('priority')
            ->select('priority')
            ->distinct()
            ->orderBy('priority', 'asc')
            ->pluck('priority')
            ->map(fn ($p) => (string) $p)
            ->values();

        $partnerIds = (clone $query)
            ->whereNotNull('partner_id')
            ->select('partner_id')
            ->distinct()
            ->pluck('partner_id')
            ->map(fn ($id) => (int) $id)
            ->values();

        $partners = Partner::query()
            ->whereIn('id', $partnerIds)
            ->orderBy('cnc_id')
            ->get(['id', 'cnc_id', 'name', 'status'])
            ->map(fn (Partner $p) => [
                'id' => $p->id,
                'cnc_id' => $p->cnc_id,
                'name' => $p->name,
                'status' => $p->status,
            ])
            ->values();

        return response()->json([
            'status' => $status,
            'information_dates' => $informationDates,
            'due_dates' => $dueDates,
            'types' => $types,
            'priorities' => $priorities,
            'partners' => $partners,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateTimeBoxing($request);

        DB::transaction(function () use ($request, $data) {
            $timeBoxing = TimeBoxing::query()->create($this->applyComputedFields($data, null));
            AuditLog::record($request, 'create', TimeBoxing::class, (string) $timeBoxing->id, null, $timeBoxing->fresh()->toArray());
        });

        return redirect()->route('tables.time-boxing.index');
    }

    public function update(Request $request, TimeBoxing $timeBoxing): RedirectResponse
    {
        $data = $this->validateTimeBoxing($request);

        DB::transaction(function () use ($request, $timeBoxing, $data) {
            $before = $timeBoxing->fresh()->toArray();
            $timeBoxing->update($this->applyComputedFields($data, $timeBoxing));
            $after = $timeBoxing->fresh()->toArray();
            AuditLog::record($request, 'update', TimeBoxing::class, (string) $timeBoxing->id, $before, $after);
        });

        return redirect()->route('tables.time-boxing.index');
    }

    public function destroy(Request $request, TimeBoxing $timeBoxing): RedirectResponse
    {
        DB::transaction(function () use ($request, $timeBoxing) {
            $before = $timeBoxing->fresh()->toArray();
            $id = (string) $timeBoxing->id;
            $timeBoxing->delete();
            AuditLog::record($request, 'delete', TimeBoxing::class, $id, $before, null);
        });

        return redirect()->route('tables.time-boxing.index');
    }

    private function validateTimeBoxing(Request $request): array
    {
        return $request->validate([
            'information_date' => ['required', 'date'],
            'type' => ['required', 'string', 'max:255', Rule::exists('time_boxing_setup_options', 'name')->where(fn ($q) => $q->where('category', 'type'))],
            'priority' => ['required', 'string', Rule::in(self::PRIORITIES)],
            'user_position' => ['nullable', 'string', 'max:255'],
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'description' => ['nullable', 'string'],
            'action_solution' => ['nullable', 'string'],
            'status' => ['required', 'string', Rule::in(self::STATUSES)],
            'due_date' => ['nullable', 'date'],
            'project_id' => ['nullable', 'string', 'exists:projects,id'],
        ]);
    }

    private function applyComputedFields(array $data, ?TimeBoxing $current): array
    {
        $next = $data;

        $wasCompleted = $current ? ($current->status === 'Completed') : false;
        $isCompleted = ($next['status'] ?? null) === 'Completed';

        if ($isCompleted && ! $wasCompleted) {
            $next['completed_at'] = now();
        } elseif (! $isCompleted) {
            $next['completed_at'] = null;
        }

        return $next;
    }

    private function mapPaginator(LengthAwarePaginator $paginator): LengthAwarePaginator
    {
        $collection = $paginator->getCollection()->map(fn (TimeBoxing $t) => [
            'id' => $t->id,
            'no' => $t->no,
            'information_date' => $t->information_date?->toDateString(),
            'type' => $t->type,
            'priority' => $t->priority,
            'user_position' => $t->user_position,
            'partner_id' => $t->partner_id,
            'partner' => $t->partner ? [
                'id' => $t->partner->id,
                'cnc_id' => $t->partner->cnc_id,
                'name' => $t->partner->name,
            ] : null,
            'description' => $t->description,
            'action_solution' => $t->action_solution,
            'status' => $t->status,
            'due_date' => $t->due_date?->toDateString(),
            'completed_at' => $t->completed_at?->toISOString(),
            'project_id' => $t->project_id,
            'project' => $t->project ? [
                'id' => $t->project->id,
                'cnc_id' => $t->project->cnc_id,
                'project_name' => $t->project->project_name,
            ] : null,
        ]);

        $paginator->setCollection($collection);
        return $paginator;
    }
}
