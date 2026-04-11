<?php

namespace App\Http\Controllers\Arrangement;

use App\Http\Controllers\Controller;
use App\Models\ArrangementBatch;
use App\Models\ArrangementSchedule;
use App\Models\ArrangementSchedulePickup;
use App\Models\SiteNotification;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ArrangementSchedulesController extends Controller
{
    public function index(): Response
    {
        $schedules = ArrangementSchedule::query()
            ->withCount('pickups')
            ->withCount([
                'pickups as released_pickups_count' => function ($q) {
                    $q->where('status', 'Released');
                },
            ])
            ->with('batch:id,name,requirement_points')
            ->orderByDesc('created_at')
            ->paginate(50)
            ->withQueryString();

        $batches = ArrangementBatch::query()
            ->orderByDesc('created_at')
            ->get(['id', 'name', 'requirement_points']);

        return Inertia::render('Arrangement/Schedules', [
            'schedules' => $schedules,
            'batches' => $batches,
            'scheduleTypes' => ['Middle', 'Duty', 'Saturday', 'Sunday', 'Public Holiday'],
            'statusOptions' => ['Open', 'Batched', 'Picked Up', 'Released', 'Approved'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $duplicateCount = (int) $data['count'];
        $duplicateCount = max(1, min(20, $duplicateCount));

        DB::transaction(function () use ($data, $request, $duplicateCount) {
            for ($i = 0; $i < $duplicateCount; $i++) {
                ArrangementSchedule::query()->create([
                    'batch_id' => null,
                    'schedule_type' => $data['schedule_type'],
                    'note' => $data['note'] ?? null,
                    'start_date' => $data['start_date'],
                    'end_date' => $data['end_date'],
                    'count' => 1,
                    'status' => 'Open',
                    'created_by' => $request->user()->id,
                ]);
            }
        });

        return back();
    }

    public function update(Request $request, ArrangementSchedule $schedule): RedirectResponse
    {
        if (! in_array($schedule->status, ['Open', 'Publish']) && ! $request->user()->hasAnyRole(['Administrator', 'Admin Officer'])) {
            abort(403, 'Hanya status Open yang dapat diubah.');
        }

        $data = $this->validated($request, $schedule);

        $schedule->forceFill([
            'schedule_type' => $data['schedule_type'],
            'note' => $data['note'] ?? null,
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
        ]);

        $schedule->save();

        return back();
    }

    public function destroy(Request $request, ArrangementSchedule $schedule): RedirectResponse
    {
        if (! in_array($schedule->status, ['Open', 'Publish']) && ! $request->user()->hasAnyRole(['Administrator', 'Admin Officer'])) {
            abort(403, 'Hanya status Open yang dapat dihapus.');
        }

        $schedule->delete();

        return back();
    }

    public function approve(Request $request, ArrangementSchedule $schedule): RedirectResponse
    {
        DB::transaction(function () use ($request, $schedule) {
            $lockedSchedule = ArrangementSchedule::query()
                ->whereKey($schedule->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedSchedule->status === 'Approved') {
                throw ValidationException::withMessages([
                    'schedule' => 'Schedule sudah Approved.',
                ]);
            }

            $totalPickups = ArrangementSchedulePickup::query()
                ->where('schedule_id', $lockedSchedule->id)
                ->count();

            if ($totalPickups < (int) $lockedSchedule->count) {
                throw ValidationException::withMessages([
                    'schedule' => 'Schedule belum penuh di Pick Up.',
                ]);
            }

            $releasedPickups = ArrangementSchedulePickup::query()
                ->where('schedule_id', $lockedSchedule->id)
                ->where('status', 'Released')
                ->count();

            if ($releasedPickups !== $totalPickups) {
                throw ValidationException::withMessages([
                    'schedule' => 'Approve hanya bisa setelah semua PIC melakukan Release.',
                ]);
            }

            if ($lockedSchedule->status !== 'Released') {
                $lockedSchedule->forceFill([
                    'status' => 'Released',
                ])->save();
            }

            $lockedSchedule->forceFill([
                'status' => 'Approved',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ])->save();
        });

        $pickupUserIds = ArrangementSchedulePickup::query()
            ->where('schedule_id', $schedule->id)
            ->pluck('user_id')
            ->unique()
            ->values()
            ->all();

        foreach ($pickupUserIds as $uid) {
            SiteNotification::query()->create([
                'user_id' => (int) $uid,
                'type' => 'arrangement',
                'title' => 'Arrangement Approved',
                'body' => "{$schedule->schedule_type} ({$schedule->start_date} – {$schedule->end_date})",
                'url' => route('arrangements.jobsheet'),
                'actor_user_id' => (int) $request->user()->id,
            ]);
        }

        return back();
    }

    public function reopen(Request $request, ArrangementSchedule $schedule): RedirectResponse
    {
        if ($schedule->status !== 'Approved') {
            abort(422);
        }

        DB::transaction(function () use ($schedule) {
            $lockedSchedule = ArrangementSchedule::query()
                ->whereKey($schedule->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $pickupCount = ArrangementSchedulePickup::query()
                ->where('schedule_id', $lockedSchedule->id)
                ->count();

            $releasedCount = ArrangementSchedulePickup::query()
                ->where('schedule_id', $lockedSchedule->id)
                ->where('status', 'Released')
                ->count();

            $lockedSchedule->forceFill([
                'status' => ArrangementSchedule::statusFromPickupCounts((int) $lockedSchedule->count, $pickupCount, $releasedCount),
                'approved_by' => null,
                'approved_at' => null,
            ])->save();
        });

        $pickupUserIds = ArrangementSchedulePickup::query()
            ->where('schedule_id', $schedule->id)
            ->pluck('user_id')
            ->unique()
            ->values()
            ->all();

        foreach ($pickupUserIds as $uid) {
            SiteNotification::query()->create([
                'user_id' => (int) $uid,
                'type' => 'arrangement',
                'title' => 'Cancel Approved',
                'body' => "{$schedule->schedule_type} ({$schedule->start_date} – {$schedule->end_date})",
                'url' => route('arrangements.index'),
                'actor_user_id' => (int) $request->user()->id,
            ]);
        }

        return back();
    }

    private function validated(Request $request, ?ArrangementSchedule $schedule = null): array
    {
        return $request->validate([
            'batch_id' => ['nullable', 'uuid', Rule::exists('arrangement_batches', 'id')],
            'schedule_type' => ['required', 'string', Rule::in(['Middle', 'Duty', 'Saturday', 'Sunday', 'Public Holiday'])],
            'note' => ['nullable', 'string'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'count' => ['required', 'integer', 'min:1', 'max:20'],
            'status' => ['nullable', 'string', Rule::in(['Open', 'Batched', 'Picked Up', 'Released', 'Approved', 'Publish'])],
        ]);
    }
}
