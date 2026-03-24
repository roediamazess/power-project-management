<?php

namespace App\Http\Controllers\Tables;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Partner;
use App\Models\PartnerSetupOption;
use App\Models\Project;
use App\Models\ProjectPicAssignment;
use App\Models\ProjectSetupOption;
use App\Models\TimeBoxing;
use App\Models\TimeBoxingSetupOption;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogsController extends Controller
{
    private const MODULES = [
        'all',
        'partners',
        'projects',
        'time_boxing',
        'setup',
    ];

    private const ACTIONS = [
        'all',
        'create',
        'update',
        'delete',
    ];

    public function index(Request $request): Response
    {
        $data = $request->validate([
            'modules' => ['nullable', 'array'],
            'modules.*' => ['string', Rule::in(self::MODULES)],
            'actions' => ['nullable', 'array'],
            'actions.*' => ['string', Rule::in(self::ACTIONS)],
            'actor_ids' => ['nullable', 'array'],
            'actor_ids.*' => ['integer', 'exists:users,id'],
            'q' => ['nullable', 'string', 'max:200'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'sort_by' => ['nullable', 'string', Rule::in(['no', 'module', 'action', 'actor', 'time'])],
            'sort_dir' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
        ]);

        $modules = $data['modules'] ?? [];
        $actions = $data['actions'] ?? [];
        $actorIds = $data['actor_ids'] ?? [];
        $q = trim((string) ($data['q'] ?? ''));
        $dateFrom = $data['date_from'] ?? null;
        $dateTo = $data['date_to'] ?? null;
        $sortBy = $data['sort_by'] ?? null;
        $sortDir = $data['sort_dir'] ?? 'desc';

        $query = AuditLog::query()
            ->with(['actor:id,name,email'])
            ->orderByDesc('id');

        if (is_array($modules) && count($modules)) {
            $types = [];
            foreach ($modules as $m) {
                $types = array_merge($types, $this->modelTypesForModule($m));
            }
            $types = array_values(array_unique($types));
            if ($types) $query->whereIn('model_type', $types);
        }

        if (is_array($actions) && count($actions)) {
            $query->whereIn('action', $actions);
        }

        if (is_array($actorIds) && count($actorIds)) {
            $query->whereIn('actor_user_id', $actorIds);
        }

        if ($q !== '') {
            if (DB::getDriverName() === 'pgsql') {
                $query->whereRaw(
                    "to_tsvector('simple', coalesce(action,'') || ' ' || coalesce(model_type,'') || ' ' || coalesce(model_id,'') || ' ' || coalesce(meta::text,'') || ' ' || coalesce(before::text,'') || ' ' || coalesce(after::text,'')) @@ plainto_tsquery('simple', ?)",
                    [$q]
                );
            } else {
                $like = '%' . str_replace('%', '\%', $q) . '%';
                $query->where(function ($w) use ($like) {
                    $w->where('event_module', 'like', $like)
                        ->orWhere('event_action', 'like', $like)
                        ->orWhere('model_type', 'like', $like)
                        ->orWhere('model_id', 'like', $like)
                        ->orWhereRaw('before::text like ?', [$like])
                        ->orWhereRaw('after::text like ?', [$like]);
                });
            }
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', Carbon::parse($dateFrom)->toDateString());
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', Carbon::parse($dateTo)->toDateString());
        }

        if ($sortBy) {
            match ($sortBy) {
                'no' => $query->orderBy('id', $sortDir),
                'module' => $query->orderBy('model_type', $sortDir)->orderBy('id', 'desc'),
                'action' => $query->orderBy('action', $sortDir)->orderBy('id', 'desc'),
                'actor' => $query->orderBy('actor_user_id', $sortDir)->orderBy('id', 'desc'),
                'time' => $query->orderBy('created_at', $sortDir)->orderBy('id', 'desc'),
                default => null,
            };
        }

        $logs = $query->paginate(50)->withQueryString();
        $logs = $this->mapPaginator($logs);

        return Inertia::render('Tables/AuditLogs/Index', [
            'logs' => $logs,
            'filters' => [
                'modules' => $modules,
                'actions' => $actions,
                'actor_ids' => $actorIds,
                'q' => $q,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'sort_by' => $sortBy,
                'sort_dir' => $sortDir,
            ],
            'modules' => [
                ['key' => 'all', 'label' => 'All'],
                ['key' => 'partners', 'label' => 'Partners'],
                ['key' => 'projects', 'label' => 'Projects'],
                ['key' => 'time_boxing', 'label' => 'Time Boxing'],
                ['key' => 'setup', 'label' => 'Setup'],
            ],
            'actions' => [
                ['key' => 'all', 'label' => 'All'],
                ['key' => 'create', 'label' => 'Create'],
                ['key' => 'update', 'label' => 'Update'],
                ['key' => 'delete', 'label' => 'Delete'],
            ],
        ]);
    }

    public function show(Request $request, AuditLog $auditLog): JsonResponse
    {
        $auditLog->load(['actor:id,name,email']);

        return response()->json([
            'id' => $auditLog->id,
            'created_at' => $auditLog->created_at?->toISOString(),
            'action' => $auditLog->action,
            'model_type' => $auditLog->model_type,
            'model_id' => $auditLog->model_id,
            'actor' => $auditLog->actor ? [
                'id' => $auditLog->actor->id,
                'name' => $auditLog->actor->name,
                'email' => $auditLog->actor->email,
            ] : null,
            'meta' => $auditLog->meta,
            'before' => $auditLog->before,
            'after' => $auditLog->after,
        ]);
    }

    private function modelTypesForModule(string $module): array
    {
        return match ($module) {
            'partners' => [Partner::class],
            'projects' => [Project::class, ProjectPicAssignment::class],
            'time_boxing' => [TimeBoxing::class, TimeBoxingSetupOption::class],
            'setup' => [PartnerSetupOption::class, ProjectSetupOption::class],
            default => [],
        };
    }

    private function mapPaginator(LengthAwarePaginator $paginator): LengthAwarePaginator
    {
        $collection = $paginator->getCollection()->map(function (AuditLog $l) {
            $module = $this->moduleForModelType((string) $l->model_type);

            return [
                'id' => $l->id,
                'created_at' => $l->created_at?->toISOString(),
                'action' => $l->action,
                'module' => $module,
                'model_type' => $l->model_type,
                'model_type_short' => $this->shortModelType((string) $l->model_type),
                'model_id' => $l->model_id,
                'actor' => $l->actor ? [
                    'id' => $l->actor->id,
                    'name' => $l->actor->name,
                    'email' => $l->actor->email,
                ] : null,
                'meta' => $l->meta,
                'has_before' => ! empty($l->before),
                'has_after' => ! empty($l->after),
            ];
        });

        $paginator->setCollection($collection);
        return $paginator;
    }

    private function moduleForModelType(string $modelType): string
    {
        return match ($modelType) {
            Partner::class => 'partners',
            Project::class, ProjectPicAssignment::class => 'projects',
            TimeBoxing::class, TimeBoxingSetupOption::class => 'time_boxing',
            PartnerSetupOption::class, ProjectSetupOption::class => 'setup',
            default => 'other',
        };
    }

    private function shortModelType(string $modelType): string
    {
        $parts = explode('\\\\', $modelType);
        return end($parts) ?: $modelType;
    }
}
