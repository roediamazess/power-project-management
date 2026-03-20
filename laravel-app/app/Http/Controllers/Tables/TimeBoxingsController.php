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
            'status' => ['nullable', 'string', Rule::in(array_merge(['all'], self::STATUSES))],
            'priority' => ['nullable', 'string', Rule::in(array_merge(['all'], self::PRIORITIES))],
            'type' => ['nullable', 'string', 'max:255'],
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'project_id' => ['nullable', 'string', 'exists:projects,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $status = $data['status'] ?? 'all';
        $priority = $data['priority'] ?? 'all';
        $type = trim((string) ($data['type'] ?? ''));
        $partnerId = $data['partner_id'] ?? null;
        $projectId = $data['project_id'] ?? null;
        $dateFrom = $data['date_from'] ?? null;
        $dateTo = $data['date_to'] ?? null;

        $query = TimeBoxing::query()
            ->with([
                'partner:id,cnc_id,name',
                'project:id,cnc_id,project_name',
            ])
            ->orderByDesc('no');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($priority !== 'all') {
            $query->where('priority', $priority);
        }

        if ($type !== '') {
            $query->where('type', $type);
        }

        if ($partnerId) {
            $query->where('partner_id', $partnerId);
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
            ->get(['id', 'cnc_id', 'name'])
            ->map(fn (Partner $p) => [
                'id' => $p->id,
                'cnc_id' => $p->cnc_id,
                'name' => $p->name,
            ]);

        $projects = Project::query()
            ->orderBy('cnc_id')
            ->get(['id', 'cnc_id', 'project_name'])
            ->map(fn (Project $p) => [
                'id' => $p->id,
                'cnc_id' => $p->cnc_id,
                'project_name' => $p->project_name,
            ]);

        return Inertia::render('Tables/TimeBoxing/Index', [
            'items' => $items,
            'filters' => [
                'status' => $status,
                'priority' => $priority,
                'type' => $type,
                'partner_id' => $partnerId,
                'project_id' => $projectId,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'typeOptions' => $typeOptions,
            'priorityOptions' => self::PRIORITIES,
            'statusOptions' => self::STATUSES,
            'partners' => $partners,
            'projects' => $projects,
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
