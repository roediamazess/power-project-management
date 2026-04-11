<?php

namespace App\Http\Controllers;

use App\Models\Partner;
use App\Models\Project;
use App\Models\TimeBoxing;
use App\Models\TimeBoxingSetupOption;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\JsonResponse;

class DashboardTimeBoxingController extends Controller
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
        $user = $request->user();
        $isManager = (bool) $user?->hasAnyRole(['Administrator', 'Admin Officer']);

        $data = $request->validate([
            'range' => ['nullable', 'string', Rule::in(['7d', '30d', '90d', 'ytd', 'all', 'custom'])],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $today = Carbon::now('Asia/Jakarta')->startOfDay();
        $range = $data['range'] ?? '30d';
        [$from, $to] = $this->resolveRange($range, $data['from'] ?? null, $data['to'] ?? null, $today);

        $baseQuery = TimeBoxing::query();
        if (! $isManager) {
            $baseQuery->where('time_boxings.user_id', (int) $user->id);
        }

        $rangeQuery = clone $baseQuery;
        if ($from) {
            $rangeQuery->whereDate('information_date', '>=', $from->toDateString());
        }
        if ($to) {
            $rangeQuery->whereDate('information_date', '<=', $to->toDateString());
        }

        $activeQuery = (clone $baseQuery)->where('status', '!=', 'Completed');
        $overdueQuery = (clone $baseQuery)
            ->where('status', '!=', 'Completed')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', $today->toDateString());

        $activeInRangeQuery = (clone $rangeQuery)->where('status', '!=', 'Completed');
        $overdueInRangeQuery = (clone $rangeQuery)
            ->where('status', '!=', 'Completed')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', $today->toDateString());

        $completedInRangeQuery = (clone $baseQuery)
            ->where('status', 'Completed')
            ->whereNotNull('completed_at');

        if ($from) {
            $completedInRangeQuery->whereDate('completed_at', '>=', $from->toDateString());
        }
        if ($to) {
            $completedInRangeQuery->whereDate('completed_at', '<=', $to->toDateString());
        }

        $kpi = [
            'active_in_range' => (clone $activeInRangeQuery)->count(),
            'overdue_in_range' => (clone $overdueInRangeQuery)->count(),
            'created_in_range' => (clone $rangeQuery)->count(),
            'completed_in_range' => (clone $completedInRangeQuery)->count(),
            'active_now' => (clone $activeQuery)->count(),
            'overdue_now' => (clone $overdueQuery)->count(),
        ];

        $statusBreakdown = (clone $rangeQuery)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->orderByDesc('total')
            ->pluck('total', 'status')
            ->toArray();

        $priorityBreakdown = (clone $rangeQuery)
            ->select('priority', DB::raw('count(*) as total'))
            ->groupBy('priority')
            ->orderByDesc('total')
            ->pluck('total', 'priority')
            ->toArray();

        $typeBreakdown = (clone $rangeQuery)
            ->whereNotNull('type')
            ->select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->orderByDesc('total')
            ->limit(12)
            ->get()
            ->map(fn ($r) => ['label' => (string) $r->type, 'value' => (int) $r->total])
            ->values()
            ->all();

        $dueSoon = (clone $baseQuery)
            ->where('status', '!=', 'Completed')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '>=', $today->toDateString())
            ->whereDate('due_date', '<=', $today->copy()->addDays(7)->toDateString())
            ->count();

        $kpi['due_next_7_days'] = $dueSoon;

        $leadTimeAvgDays = null;
        $leadTimeCount = 0;
        $completedForLead = (clone $completedInRangeQuery)
            ->select(['information_date', 'completed_at'])
            ->get();

        $totalDays = 0.0;
        foreach ($completedForLead as $row) {
            $info = $row->information_date instanceof \DateTimeInterface ? Carbon::instance($row->information_date)->startOfDay() : null;
            $done = $row->completed_at instanceof \DateTimeInterface ? Carbon::instance($row->completed_at)->startOfDay() : null;
            if (! $info || ! $done) {
                continue;
            }
            $totalDays += (float) $info->diffInDays($done);
            $leadTimeCount++;
        }
        if ($leadTimeCount > 0) {
            $leadTimeAvgDays = round($totalDays / $leadTimeCount, 1);
        }

        $trend = [
            'labels' => [],
            'created' => [],
            'completed' => [],
        ];

        if ($from && $to) {
            $days = [];
            $cursor = $from->copy();
            while ($cursor->lte($to)) {
                $days[] = $cursor->toDateString();
                $cursor->addDay();
                if (count($days) > 366) {
                    break;
                }
            }

            $createdByDay = (clone $baseQuery)
                ->whereDate('information_date', '>=', $from->toDateString())
                ->whereDate('information_date', '<=', $to->toDateString())
                ->select('information_date', DB::raw('count(*) as total'))
                ->groupBy('information_date')
                ->pluck('total', 'information_date')
                ->toArray();

            $completedByDay = (clone $baseQuery)
                ->where('status', 'Completed')
                ->whereNotNull('completed_at')
                ->whereDate('completed_at', '>=', $from->toDateString())
                ->whereDate('completed_at', '<=', $to->toDateString())
                ->select(DB::raw('DATE(completed_at) as day'), DB::raw('count(*) as total'))
                ->groupBy(DB::raw('DATE(completed_at)'))
                ->pluck('total', 'day')
                ->toArray();

            $trend['labels'] = $days;
            $trend['created'] = array_map(fn ($d) => (int) ($createdByDay[$d] ?? 0), $days);
            $trend['completed'] = array_map(fn ($d) => (int) ($completedByDay[$d] ?? 0), $days);
        }

        $userWorkload = [];
        if ($isManager) {
            $work = (clone $activeQuery)
                ->select('user_id', DB::raw('count(*) as total'))
                ->groupBy('user_id')
                ->orderByDesc('total')
                ->limit(12)
                ->pluck('total', 'user_id')
                ->toArray();

            $userIds = array_values(array_map('intval', array_keys($work)));
            $users = DB::table('users')->whereIn('id', $userIds)->pluck('name', 'id')->toArray();

            foreach ($userIds as $uid) {
                $userWorkload[] = [
                    'id' => $uid,
                    'label' => (string) ($users[$uid] ?? ('User #' . $uid)),
                    'value' => (int) ($work[$uid] ?? 0),
                ];
            }
        }

        $workloadTypeBreakdown = [];
        $workloadTypeTotals = (clone $activeInRangeQuery)
            ->whereNotNull('type')
            ->select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => ['label' => (string) $r->type, 'value' => (int) $r->total])
            ->values()
            ->all();

        if (count($workloadTypeTotals) > 8) {
            $top = array_slice($workloadTypeTotals, 0, 8);
            $others = array_slice($workloadTypeTotals, 8);
            $othersSum = array_sum(array_map(fn ($r) => (int) ($r['value'] ?? 0), $others));
            if ($othersSum > 0) {
                $top[] = ['label' => 'Others', 'value' => (int) $othersSum];
            }
            $workloadTypeBreakdown = $top;
        } else {
            $workloadTypeBreakdown = $workloadTypeTotals;
        }

        $topPartners = (clone $activeQuery)
            ->whereNotNull('partner_id')
            ->select('partner_id', DB::raw('count(*) as total'))
            ->groupBy('partner_id')
            ->orderByDesc('total')
            ->limit(8)
            ->pluck('total', 'partner_id')
            ->toArray();

        $topPartnerIds = array_values(array_map('intval', array_keys($topPartners)));
        $partnerRows = [];
        if (count($topPartnerIds) > 0) {
            $partners = DB::table('partners')
                ->whereIn('id', $topPartnerIds)
                ->get(['id', 'cnc_id', 'name']);

            $byId = [];
            foreach ($partners as $p) {
                $byId[(int) $p->id] = $p;
            }
            foreach ($topPartnerIds as $pid) {
                $p = $byId[$pid] ?? null;
                $partnerRows[] = [
                    'id' => $pid,
                    'cnc_id' => $p?->cnc_id,
                    'name' => $p?->name,
                    'open' => (int) ($topPartners[$pid] ?? 0),
                ];
            }
        }

        return Inertia::render('Dashboard/TimeBoxing', [
            'isManager' => $isManager,
            'filters' => [
                'range' => $range,
                'from' => $from?->toDateString(),
                'to' => $to?->toDateString(),
            ],
            'kpi' => array_merge($kpi, [
                'lead_time_avg_days' => $leadTimeAvgDays,
                'lead_time_count' => $leadTimeCount,
            ]),
            'statusBreakdown' => $statusBreakdown,
            'priorityBreakdown' => $priorityBreakdown,
            'typeBreakdown' => $typeBreakdown,
            'trend' => $trend,
            'userWorkload' => $userWorkload,
            'workloadTypeBreakdown' => $workloadTypeBreakdown,
            'topPartners' => $partnerRows,
        ]);
    }

    public function drilldown(Request $request): JsonResponse
    {
        $user = $request->user();
        $isManager = (bool) $user?->hasAnyRole(['Administrator', 'Admin Officer']);

        $data = $request->validate([
            'dimension' => ['required', 'string', Rule::in(['all', 'status', 'priority', 'type', 'partner', 'user'])],
            'value' => ['nullable', 'string', 'max:255'],
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'open_only' => ['nullable', 'boolean'],
            'overdue_only' => ['nullable', 'boolean'],
            'range' => ['nullable', 'string', Rule::in(['7d', '30d', '90d', 'ytd', 'all', 'custom'])],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $today = Carbon::now('Asia/Jakarta')->startOfDay();
        $range = $data['range'] ?? '30d';
        [$from, $to] = $this->resolveRange($range, $data['from'] ?? null, $data['to'] ?? null, $today);

        $query = TimeBoxing::query()->with([
            'partner:id,cnc_id,name',
            'project:id,cnc_id,project_name',
        ]);

        if (! $isManager) {
            $query->where('time_boxings.user_id', (int) $user->id);
        }

        if ($from) {
            $query->whereDate('information_date', '>=', $from->toDateString());
        }
        if ($to) {
            $query->whereDate('information_date', '<=', $to->toDateString());
        }

        if ((bool) ($data['open_only'] ?? false)) {
            $query->where('status', '!=', 'Completed');
        }

        if ((bool) ($data['overdue_only'] ?? false)) {
            $query
                ->whereNotNull('due_date')
                ->whereDate('due_date', '<', $today->toDateString());
        }

        $dimension = $data['dimension'];
        if ($dimension === 'all') {
            // no-op
        } elseif ($dimension === 'status') {
            $query->where('status', (string) ($data['value'] ?? ''));
        } elseif ($dimension === 'priority') {
            $query->where('priority', (string) ($data['value'] ?? ''));
        } elseif ($dimension === 'type') {
            $query->where('type', (string) ($data['value'] ?? ''));
        } elseif ($dimension === 'partner') {
            $query->where('partner_id', (int) ($data['partner_id'] ?? 0));
        } elseif ($dimension === 'user') {
            if (! $isManager) {
                abort(403);
            }
            $query->where('user_id', (int) ($data['user_id'] ?? 0));
        }

        $limit = (int) ($data['limit'] ?? 80);

        $items = $query
            ->orderByRaw('CASE WHEN due_date IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_date', 'asc')
            ->orderBy('no', 'asc')
            ->limit($limit)
            ->get()
            ->map(fn (TimeBoxing $t) => [
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
                'project_id' => $t->project_id,
                'project' => $t->project ? [
                    'id' => $t->project->id,
                    'cnc_id' => $t->project->cnc_id,
                    'project_name' => $t->project->project_name,
                ] : null,
            ])
            ->values()
            ->all();

        $typeOptions = TimeBoxingSetupOption::query()
            ->where('category', 'type')
            ->orderBy('name')
            ->get()
            ->map(fn (TimeBoxingSetupOption $o) => [
                'name' => $o->name,
                'status' => $o->status,
            ])
            ->values()
            ->all();

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

        return response()->json([
            'items' => $items,
            'options' => [
                'typeOptions' => $typeOptions,
                'priorityOptions' => self::PRIORITIES,
                'statusOptions' => self::STATUSES,
                'partners' => $partners,
                'projects' => $projects,
            ],
        ]);
    }

    public function updateTimeBoxing(Request $request, TimeBoxing $timeBoxing): RedirectResponse
    {
        if (! $request->user()->hasAnyRole(['Administrator', 'Admin Officer']) && (int) $timeBoxing->user_id !== (int) $request->user()->id) {
            abort(404);
        }

        $data = $request->validate([
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

        $data['user_id'] = $request->user()->id;

        DB::transaction(function () use ($timeBoxing, $data) {
            $timeBoxing->update($this->applyComputedFields($data, $timeBoxing));
        });

        return redirect()->back();
    }

    private function applyComputedFields(array $data, ?TimeBoxing $current): array
    {
        $next = $data;

        if (! array_key_exists('no', $next) || empty($next['no'])) {
            if (DB::getDriverName() !== 'pgsql') {
                $max = (int) (TimeBoxing::query()->max('no') ?? 0);
                $next['no'] = $max + 1;
            }
        }

        $wasCompleted = $current ? ($current->status === 'Completed') : false;
        $isCompleted = ($next['status'] ?? null) === 'Completed';

        if ($isCompleted && ! $wasCompleted) {
            $next['completed_at'] = now();
        } elseif (! $isCompleted) {
            $next['completed_at'] = null;
        }

        return $next;
    }

    private function resolveRange(string $range, ?string $from, ?string $to, Carbon $today): array
    {
        $fromDate = null;
        $toDate = null;

        if ($range === 'custom') {
            $fromDate = $from ? Carbon::parse($from, 'Asia/Jakarta')->startOfDay() : null;
            $toDate = $to ? Carbon::parse($to, 'Asia/Jakarta')->startOfDay() : null;
        } elseif ($range === '7d') {
            $fromDate = $today->copy()->subDays(6);
            $toDate = $today->copy();
        } elseif ($range === '30d') {
            $fromDate = $today->copy()->subDays(29);
            $toDate = $today->copy();
        } elseif ($range === '90d') {
            $fromDate = $today->copy()->subDays(89);
            $toDate = $today->copy();
        } elseif ($range === 'ytd') {
            $fromDate = $today->copy()->startOfYear();
            $toDate = $today->copy();
        } elseif ($range === 'all') {
            $fromDate = null;
            $toDate = null;
        }

        if ($fromDate && $toDate && $fromDate->gt($toDate)) {
            [$fromDate, $toDate] = [$toDate, $fromDate];
        }

        return [$fromDate, $toDate];
    }
}
