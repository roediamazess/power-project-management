<?php

namespace App\Http\Controllers\Arrangement;

use App\Http\Controllers\Controller;
use App\Models\ArrangementJobsheetEntry;
use App\Models\ArrangementJobsheetPeriod;
use App\Models\ArrangementSchedulePickup;
use App\Models\AuditLog;
use App\Models\Holiday;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ArrangementJobsheetController extends Controller
{
    public function index(Request $request, ?string $periodSlug = null): Response|RedirectResponse
    {
        $user = $request->user();
        $isManager = (bool) $user?->hasAnyRole(['Administrator', 'Admin Officer']);

        $defaultPeriod = ArrangementJobsheetPeriod::query()
            ->where('is_default', true)
            ->orderByDesc('start_date')
            ->orderByDesc('created_at')
            ->first();

        $periods = ArrangementJobsheetPeriod::query()
            ->with('creator:id,name')
            ->orderByDesc('start_date')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ArrangementJobsheetPeriod $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'start_date' => $p->start_date?->toDateString(),
                'end_date' => $p->end_date?->toDateString(),
                'is_default' => (bool) $p->is_default,
                'created_by' => $p->created_by,
                'created_by_name' => $p->creator?->name,
            ])
            ->values()
            ->all();

        $selectedPeriod = null;
        $selectedId = (string) $request->query('period', '');
        if ($selectedId && Str::isUuid($selectedId)) {
            $selectedPeriod = ArrangementJobsheetPeriod::query()->find($selectedId);
            if ($selectedPeriod) {
                $target = $isManager
                    ? $selectedPeriod
                    : ($defaultPeriod ?: $selectedPeriod);

                if ($target?->slug) {
                    return redirect()->route('arrangements.jobsheet.slug', ['periodSlug' => $target->slug]);
                }
            }
        }

        if (! $selectedPeriod && $periodSlug) {
            $selectedPeriod = ArrangementJobsheetPeriod::query()->where('slug', $periodSlug)->first();
        }

        if (! $isManager) {
            $selectedPeriod = $defaultPeriod ?: ArrangementJobsheetPeriod::query()
                ->orderByDesc('start_date')
                ->orderByDesc('created_at')
                ->first();

            if ($selectedPeriod?->slug && $periodSlug !== $selectedPeriod->slug) {
                return redirect()->route('arrangements.jobsheet.slug', ['periodSlug' => $selectedPeriod->slug]);
            }
        }

        if (! $selectedPeriod) {
            $selectedPeriod = $defaultPeriod ?: ArrangementJobsheetPeriod::query()
                ->orderByDesc('start_date')
                ->orderByDesc('created_at')
                ->first();
        }

        if ($isManager && ! $periodSlug && ! $selectedId && $selectedPeriod?->slug) {
            return redirect()->route('arrangements.jobsheet.slug', ['periodSlug' => $selectedPeriod->slug]);
        }

        $selectedPeriodPayload = $selectedPeriod
            ? [
                'id' => $selectedPeriod->id,
                'name' => $selectedPeriod->name,
                'slug' => $selectedPeriod->slug,
                'start_date' => $selectedPeriod->start_date?->toDateString(),
                'end_date' => $selectedPeriod->end_date?->toDateString(),
                'is_default' => (bool) $selectedPeriod->is_default,
                'created_by' => $selectedPeriod->created_by,
            ]
            : null;

        $approvedAssignments = [];
        if ($selectedPeriod?->start_date && $selectedPeriod?->end_date) {
            $approvedAssignments = ArrangementSchedulePickup::query()
                ->join('arrangement_schedules', 'arrangement_schedules.id', '=', 'arrangement_schedule_pickups.schedule_id')
                ->where('arrangement_schedules.status', 'Approved')
                ->whereDate('arrangement_schedules.start_date', '<=', $selectedPeriod->end_date)
                ->whereDate('arrangement_schedules.end_date', '>=', $selectedPeriod->start_date)
                ->orderBy('arrangement_schedule_pickups.user_id')
                ->get([
                    'arrangement_schedule_pickups.user_id',
                    'arrangement_schedules.schedule_type',
                    'arrangement_schedules.start_date',
                    'arrangement_schedules.end_date',
                ])
                ->map(fn ($r) => [
                    'user_id' => (int) $r->user_id,
                    'schedule_type' => (string) $r->schedule_type,
                    'start_date' => (string) $r->start_date,
                    'end_date' => (string) $r->end_date,
                ])
                ->values()
                ->all();
        }

        $manualEntries = [];
        if ($selectedPeriod) {
            $manualEntries = ArrangementJobsheetEntry::query()
                ->where('period_id', $selectedPeriod->id)
                ->orderBy('user_id')
                ->orderBy('work_date')
                ->get(['user_id', 'work_date', 'code'])
                ->map(fn (ArrangementJobsheetEntry $e) => [
                    'user_id' => (int) $e->user_id,
                    'work_date' => $e->work_date?->toDateString(),
                    'code' => (string) $e->code,
                ])
                ->values()
                ->all();
        }

        $pics = User::query()
            ->where('status', 'Active')
            ->where('is_internal', true)
            ->orderBy('id')
            ->get(['id', 'name'])
            ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name])
            ->values()
            ->all();

        $holidayDates = Holiday::query()
            ->orderBy('date')
            ->pluck('date')
            ->filter()
            ->map(fn ($d) => $d?->toDateString())
            ->filter()
            ->values()
            ->all();

        return Inertia::render('Arrangement/Jobsheet', [
            'isManager' => $isManager,
            'pics' => $pics,
            'holidays' => array_values(array_unique(array_filter(array_merge(config('jobsheet.holidays', []), $holidayDates)))),
            'periods' => $periods,
            'selectedPeriod' => $selectedPeriodPayload,
            'approvedAssignments' => $approvedAssignments,
            'manualEntries' => $manualEntries,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $period = ArrangementJobsheetPeriod::query()->create([
            'name' => $data['name'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'created_by' => (int) $request->user()->id,
        ]);

        return redirect()->route('arrangements.jobsheet.slug', ['periodSlug' => $period->slug]);
    }

    public function upsertEntry(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user?->hasAnyRole(['Administrator', 'Admin Officer'])) {
            abort(403);
        }

        $allowedCodes = [
            'MD', 'DT', 'D.PH', 'D.ST', 'D.SN',
            'D',
            'M.TCD', 'M.TCK', 'M.TLK', 'M.TLN',
            'I.TCD', 'I.TCK', 'I.TLK', 'I.TLN',
            'U.TCD', 'U.TCK', 'U.TLK', 'U.TLN',
            'D.SM', 'D.OKR', 'D.OT', 'D.OM', 'D.OD',
            'D.ASSESSOR', 'D.ASSESSEE',
            'B', 'B.OT',
        ];

        $data = $request->validate([
            'period_id' => ['required', 'uuid', Rule::exists('arrangement_jobsheet_periods', 'id')],
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'code' => ['required', 'string', Rule::in($allowedCodes)],
        ]);

        $period = ArrangementJobsheetPeriod::query()->findOrFail($data['period_id']);
        $rangeStart = Carbon::parse($data['start_date'])->startOfDay();
        $rangeEnd = Carbon::parse($data['end_date'])->startOfDay();

        if ($rangeStart->lt($period->start_date) || $rangeEnd->gt($period->end_date)) {
            throw ValidationException::withMessages([
                'date' => 'Tanggal yang dipilih harus berada di dalam periode Jobsheet.',
            ]);
        }

        $lockedExists = ArrangementSchedulePickup::query()
            ->join('arrangement_schedules', 'arrangement_schedules.id', '=', 'arrangement_schedule_pickups.schedule_id')
            ->where('arrangement_schedule_pickups.user_id', (int) $data['user_id'])
            ->where('arrangement_schedules.status', 'Approved')
            ->whereDate('arrangement_schedules.start_date', '<=', $rangeEnd->toDateString())
            ->whereDate('arrangement_schedules.end_date', '>=', $rangeStart->toDateString())
            ->exists();

        if ($lockedExists) {
            throw ValidationException::withMessages([
                'code' => 'Tanggal yang dipilih sudah terisi dari Arrangement (Approved) dan tidak bisa diubah manual.',
            ]);
        }

        $beforeCount = ArrangementJobsheetEntry::query()
            ->where('period_id', $period->id)
            ->where('user_id', (int) $data['user_id'])
            ->whereDate('work_date', '>=', $rangeStart->toDateString())
            ->whereDate('work_date', '<=', $rangeEnd->toDateString())
            ->count();

        $cursor = $rangeStart->copy();
        while ($cursor->lte($rangeEnd)) {
            $entry = ArrangementJobsheetEntry::query()->firstOrNew([
                'period_id' => $period->id,
                'user_id' => (int) $data['user_id'],
                'work_date' => $cursor->toDateString(),
            ]);

            if (! $entry->exists) {
                $entry->created_by = (int) $user->id;
            }

            $entry->code = $data['code'];
            $entry->updated_by = (int) $user->id;
            $entry->save();

            $cursor->addDay();
        }

        $afterCount = ArrangementJobsheetEntry::query()
            ->where('period_id', $period->id)
            ->where('user_id', (int) $data['user_id'])
            ->whereDate('work_date', '>=', $rangeStart->toDateString())
            ->whereDate('work_date', '<=', $rangeEnd->toDateString())
            ->count();

        AuditLog::record($request, 'jobsheet.manual', ArrangementJobsheetEntry::class, null, null, null, [
            'period_id' => (string) $period->id,
            'user_id' => (int) $data['user_id'],
            'start_date' => $rangeStart->toDateString(),
            'end_date' => $rangeEnd->toDateString(),
            'code' => (string) $data['code'],
            'before_count' => $beforeCount,
            'after_count' => $afterCount,
        ]);

        return back();
    }

    public function clearEntries(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user?->hasAnyRole(['Administrator', 'Admin Officer'])) {
            abort(403);
        }

        $data = $request->validate([
            'period_id' => ['required', 'uuid', Rule::exists('arrangement_jobsheet_periods', 'id')],
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $period = ArrangementJobsheetPeriod::query()->findOrFail($data['period_id']);
        $rangeStart = Carbon::parse($data['start_date'])->startOfDay();
        $rangeEnd = Carbon::parse($data['end_date'])->startOfDay();

        if ($rangeStart->lt($period->start_date) || $rangeEnd->gt($period->end_date)) {
            throw ValidationException::withMessages([
                'date' => 'Tanggal yang dipilih harus berada di dalam periode Jobsheet.',
            ]);
        }

        $lockedExists = ArrangementSchedulePickup::query()
            ->join('arrangement_schedules', 'arrangement_schedules.id', '=', 'arrangement_schedule_pickups.schedule_id')
            ->where('arrangement_schedule_pickups.user_id', (int) $data['user_id'])
            ->where('arrangement_schedules.status', 'Approved')
            ->whereDate('arrangement_schedules.start_date', '<=', $rangeEnd->toDateString())
            ->whereDate('arrangement_schedules.end_date', '>=', $rangeStart->toDateString())
            ->exists();

        if ($lockedExists) {
            throw ValidationException::withMessages([
                'date' => 'Tanggal yang dipilih memiliki data Approved dan tidak bisa di-clear.',
            ]);
        }

        $beforeCount = ArrangementJobsheetEntry::query()
            ->where('period_id', $period->id)
            ->where('user_id', (int) $data['user_id'])
            ->whereDate('work_date', '>=', $rangeStart->toDateString())
            ->whereDate('work_date', '<=', $rangeEnd->toDateString())
            ->count();

        ArrangementJobsheetEntry::query()
            ->where('period_id', $period->id)
            ->where('user_id', (int) $data['user_id'])
            ->whereDate('work_date', '>=', $rangeStart->toDateString())
            ->whereDate('work_date', '<=', $rangeEnd->toDateString())
            ->delete();

        AuditLog::record($request, 'jobsheet.clear', ArrangementJobsheetEntry::class, null, null, null, [
            'period_id' => (string) $period->id,
            'user_id' => (int) $data['user_id'],
            'start_date' => $rangeStart->toDateString(),
            'end_date' => $rangeEnd->toDateString(),
            'before_count' => $beforeCount,
        ]);

        return back();
    }

    public function setDefaultPeriod(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user?->hasAnyRole(['Administrator', 'Admin Officer'])) {
            abort(403);
        }

        $data = $request->validate([
            'period_id' => ['required', 'uuid', Rule::exists('arrangement_jobsheet_periods', 'id')],
        ]);

        $period = ArrangementJobsheetPeriod::query()->findOrFail($data['period_id']);

        $oldDefaultId = ArrangementJobsheetPeriod::query()
            ->where('is_default', true)
            ->value('id');

        ArrangementJobsheetPeriod::query()->update(['is_default' => false]);
        $period->forceFill(['is_default' => true])->save();

        AuditLog::record($request, 'jobsheet.default', ArrangementJobsheetPeriod::class, (string) $period->id, null, [
            'id' => $period->id,
            'name' => $period->name,
            'slug' => $period->slug,
            'start_date' => $period->start_date?->toDateString(),
            'end_date' => $period->end_date?->toDateString(),
        ], [
            'old_default_period_id' => $oldDefaultId,
        ]);

        return redirect()->route('arrangements.jobsheet.slug', ['periodSlug' => $period->slug]);
    }
}
