<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\TimeBoxing;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TimeBoxingsApiController extends Controller
{
    private const PRIORITIES = ['Normal', 'High', 'Urgent'];
    private const STATUSES = ['Brain Dump', 'Priority List', 'Time Boxing', 'Completed'];

    public function index(Request $request): JsonResponse
    {
        $query = TimeBoxing::query()
            ->with(['partner:id,cnc_id,name', 'project:id,cnc_id,project_name']);

        if (!$request->user()->hasAnyRole(['Administrator', 'Admin Officer'])) {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->whereIn('status', array_filter(self::STATUSES, fn($s) => $s !== 'Completed'));
            } else {
                $query->where('status', $request->status);
            }
        }

        $items = $query->orderBy('no', 'desc')->paginate($request->get('limit', 50));

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateTimeBoxing($request);
        $data['user_id'] = $request->user()->id;

        $timeBoxing = DB::transaction(function () use ($request, $data) {
            $record = TimeBoxing::create($this->applyComputedFields($data, null));
            AuditLog::record($request, 'create', TimeBoxing::class, (string)$record->id, null, $record->fresh()->toArray());
            return $record;
        });

        return response()->json($timeBoxing->load(['partner', 'project']), 201);
    }

    public function show(TimeBoxing $timeBoxing): JsonResponse
    {
        $this->authorizeAccess($timeBoxing);
        return response()->json($timeBoxing->load(['partner', 'project']));
    }

    public function update(Request $request, TimeBoxing $timeBoxing): JsonResponse
    {
        $this->authorizeAccess($timeBoxing);
        
        $data = $this->validateTimeBoxing($request);
        
        $updated = DB::transaction(function () use ($request, $timeBoxing, $data) {
            $before = $timeBoxing->fresh()->toArray();
            $timeBoxing->update($this->applyComputedFields($data, $timeBoxing));
            $after = $timeBoxing->fresh()->toArray();
            AuditLog::record($request, 'update', TimeBoxing::class, (string)$timeBoxing->id, $before, $after);
            return $timeBoxing;
        });

        return response()->json($updated->load(['partner', 'project']));
    }

    public function destroy(TimeBoxing $timeBoxing): JsonResponse
    {
        $this->authorizeAccess($timeBoxing);

        DB::transaction(function () use ($timeBoxing) {
            $before = $timeBoxing->fresh()->toArray();
            AuditLog::record(null, 'delete', TimeBoxing::class, (string)$timeBoxing->id, $before, null);
            $timeBoxing->delete();
        });

        return response()->json(null, 204);
    }

    private function authorizeAccess(TimeBoxing $timeBoxing): void
    {
        if (!auth()->user()->hasAnyRole(['Administrator', 'Admin Officer']) && (int)$timeBoxing->user_id !== (int)auth()->id()) {
            abort(403);
        }
    }

    private function validateTimeBoxing(Request $request): array
    {
        return $request->validate([
            'information_date' => ['required', 'date'],
            'type' => ['required', 'string', 'max:255', Rule::exists('time_boxing_setup_options', 'name')->where(fn($q) => $q->where('category', 'type'))],
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
        if (!isset($next['no']) || empty($next['no'])) {
            $next['no'] = (int)(TimeBoxing::max('no') ?? 0) + 1;
        }

        $isCompleted = ($next['status'] ?? null) === 'Completed';
        if ($isCompleted && (!$current || $current->status !== 'Completed')) {
            $next['completed_at'] = now();
        } elseif (!$isCompleted) {
            $next['completed_at'] = null;
        }

        return $next;
    }
}
