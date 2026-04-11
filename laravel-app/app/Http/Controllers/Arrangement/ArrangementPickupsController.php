<?php

namespace App\Http\Controllers\Arrangement;

use App\Http\Controllers\Controller;
use App\Models\ArrangementBatch;
use App\Models\ArrangementSchedule;
use App\Models\ArrangementSchedulePickup;
use App\Models\SiteNotification;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;


class ArrangementPickupsController extends Controller
{
    public function store(Request $request, ArrangementSchedule $schedule): RedirectResponse
    {
        $user = $request->user();

        try {
            DB::transaction(function () use ($schedule, $user) {
                $lockedSchedule = ArrangementSchedule::query()
                    ->whereKey($schedule->getKey())
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($lockedSchedule->status !== 'Batched') {
                    throw ValidationException::withMessages([
                        'schedule' => 'Schedule tidak tersedia untuk diambil.',
                    ]);
                }

                if ($lockedSchedule->batch_id) {
                    $lockedBatch = ArrangementBatch::query()
                        ->whereKey($lockedSchedule->batch_id)
                        ->lockForUpdate()
                        ->first();

                    if ($lockedBatch?->status !== 'Approved') {
                        throw ValidationException::withMessages([
                            'batch' => 'Batch belum Approved. Pick Up belum dibuka.',
                        ]);
                    }

                    if ($lockedBatch?->pickup_start_at && $lockedBatch?->pickup_end_at) {
                        $tz = 'Asia/Jakarta';
                        $now = now($tz);
                        $start = $lockedBatch->pickup_start_at->setTimezone($tz)->startOfMinute();
                        $end = $lockedBatch->pickup_end_at->setTimezone($tz)->endOfMinute();
                        if ($now->lt($start) || $now->gt($end)) {
                            throw ValidationException::withMessages([
                                'pickup_window' => "Pick Up hanya bisa pada periode {$start->format('d M y')} jam {$start->format('H:i:s')} - {$end->format('d M y')} jam {$lockedBatch->pickup_end_at->setTimezone($tz)->format('H:i:s')} WIB.",
                            ]);
                        }
                    }
                }

                $currentCount = ArrangementSchedulePickup::query()
                    ->where('schedule_id', $lockedSchedule->id)
                    ->count();

                if ($currentCount >= (int) $lockedSchedule->count) {
                    throw ValidationException::withMessages([
                        'schedule' => 'Schedule sudah diambil.',
                    ]);
                }

                DB::table('users')
                    ->where('id', $user->id)
                    ->lockForUpdate()
                    ->first();

                $hasOverlap = ArrangementSchedulePickup::query()
                    ->join('arrangement_schedules', 'arrangement_schedules.id', '=', 'arrangement_schedule_pickups.schedule_id')
                    ->where('arrangement_schedule_pickups.user_id', $user->id)
                    ->whereIn('arrangement_schedule_pickups.status', ['Picked', 'Released'])
                    ->whereDate('arrangement_schedules.start_date', '<=', $lockedSchedule->end_date)
                    ->whereDate('arrangement_schedules.end_date', '>=', $lockedSchedule->start_date)
                    ->exists();

                if ($hasOverlap) {
                    throw ValidationException::withMessages([
                        'schedule' => 'Periode schedule bentrok dengan schedule lain yang sudah Anda Pick Up.',
                    ]);
                }

                $points = ArrangementController::tierPoints($user->tier);

                if ($lockedSchedule->batch_id) {
                    $batch = ArrangementBatch::query()->find($lockedSchedule->batch_id);
                    if ($batch) {
                        $batchCurrentPoints = ArrangementSchedulePickup::query()
                            ->join('arrangement_schedules', 'arrangement_schedules.id', '=', 'arrangement_schedule_pickups.schedule_id')
                            ->where('arrangement_schedules.batch_id', $lockedSchedule->batch_id)
                            ->sum('arrangement_schedule_pickups.points');

                        $maxPoints = (int) ($batch->max_requirement_points ?: ($batch->requirement_points ?: 0));
                        if ($batchCurrentPoints + $points > $maxPoints) {
                            throw ValidationException::withMessages([
                                'schedule' => 'Poin batch sudah penuh.',
                            ]);
                        }
                    }
                }

                ArrangementSchedulePickup::query()->create([
                    'schedule_id' => $lockedSchedule->id,
                    'user_id' => $user->id,
                    'points' => $points,
                    'status' => 'Picked',
                ]);

                $newCount = ArrangementSchedulePickup::query()
                    ->where('schedule_id', $lockedSchedule->id)
                    ->count();

                if ($newCount >= (int) $lockedSchedule->count) {
                    $lockedSchedule->update(['status' => 'Picked Up']);
                }
            });
        } catch (QueryException $e) {
            $sqlState = (string) ($e->errorInfo[0] ?? '');
            if ($sqlState === '23P01') {
                throw ValidationException::withMessages([
                    'schedule' => 'Periode schedule bentrok dengan schedule lain yang sudah Anda Pick Up.',
                ]);
            }
            abort(422);
        }

        return back();
    }

    public function destroy(Request $request, ArrangementSchedulePickup $pickup): RedirectResponse
    {
        $user = $request->user();
        $pickup->load('schedule:id,status');

        if ($pickup->schedule?->status === 'Approved') {
            if (! $user->hasRole('Administrator')) {
                abort(403);
            }
            throw ValidationException::withMessages([
                'pickup' => 'Pick Up sudah Approved. Silakan Cancel Approved dulu oleh Administrator.',
            ]);
        }

        if ($pickup->status === 'Released') {
            throw ValidationException::withMessages([
                'pickup' => 'Pick Up sudah Release. Silakan Reopen dulu untuk Cancel Pick Up.',
            ]);
        }

        if (! $user->hasRole('Administrator') && $pickup->user_id !== $user->id) {
            abort(403);
        }

        $schedule = $pickup->schedule;
        try {
            DB::transaction(function () use ($pickup, $schedule) {
                $pickup->delete();

                if (! $schedule) return;

                $lockedSchedule = ArrangementSchedule::query()
                    ->whereKey($schedule->getKey())
                    ->lockForUpdate()
                    ->first();

                if (! $lockedSchedule) return;

                $remaining = ArrangementSchedulePickup::query()
                    ->where('schedule_id', $lockedSchedule->id)
                    ->count();

                if ($remaining < (int) $lockedSchedule->count) {
                    $lockedSchedule->update(['status' => 'Batched']);
                }
            });
        } catch (QueryException $e) {
            abort(422);
        }

        return back();
    }

    public function release(Request $request, ArrangementSchedulePickup $pickup): RedirectResponse
    {
        $user = $request->user();
        $pickup->load('schedule:id,status');

        if ($pickup->schedule?->status === 'Approved') {
            if (! $user->hasRole('Administrator')) {
                abort(403);
            }
            throw ValidationException::withMessages([
                'pickup' => 'Pick Up sudah Approved. Silakan Cancel Approved dulu oleh Administrator.',
            ]);
        }

        if (! $user->hasRole('Administrator') && $pickup->user_id !== $user->id) {
            abort(403);
        }

        DB::transaction(function () use ($pickup) {
            $lockedPickup = ArrangementSchedulePickup::query()
                ->whereKey($pickup->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $lockedSchedule = ArrangementSchedule::query()
                ->whereKey($lockedPickup->schedule_id)
                ->lockForUpdate()
                ->first();

            if ($lockedSchedule?->status === 'Approved') {
                throw ValidationException::withMessages([
                    'pickup' => 'Pick Up sudah Approved. Silakan Cancel Approved dulu oleh Administrator.',
                ]);
            }

            if ($lockedPickup->status !== 'Released') {
                $lockedPickup->forceFill(['status' => 'Released'])->save();
            }

            if (! $lockedSchedule || $lockedSchedule->status === 'Approved') return;

            $pickupCount = ArrangementSchedulePickup::query()
                ->where('schedule_id', $lockedSchedule->id)
                ->count();

            $releasedCount = ArrangementSchedulePickup::query()
                ->where('schedule_id', $lockedSchedule->id)
                ->where('status', 'Released')
                ->count();

            $oldStatus = (string) $lockedSchedule->status;
            $newStatus = ArrangementSchedule::statusFromPickupCounts((int) $lockedSchedule->count, $pickupCount, $releasedCount);

            if ($oldStatus !== $newStatus) {
                $lockedSchedule->update(['status' => $newStatus]);

                if ($newStatus === 'Released') {
                    $adminIds = User::query()
                        ->whereHas('roles', fn ($q) => $q->whereIn('name', ['Administrator', 'Admin Officer']))
                        ->pluck('id')
                        ->values()
                        ->all();

                    foreach ($adminIds as $adminId) {
                        SiteNotification::query()->create([
                            'user_id' => (int) $adminId,
                            'type' => 'arrangement',
                            'title' => 'Arrangement Ready for Approve',
                            'body' => "{$lockedSchedule->schedule_type} ({$lockedSchedule->start_date} – {$lockedSchedule->end_date})",
                            'url' => route('arrangements.schedules.index'),
                            'actor_user_id' => (int) $lockedPickup->user_id,
                        ]);
                    }
                }
            }
        });

        return back();
    }

    public function reopen(Request $request, ArrangementSchedulePickup $pickup): RedirectResponse
    {
        $user = $request->user();
        $pickup->load('schedule:id,status');

        if ($pickup->schedule?->status === 'Approved') {
            if (! $user->hasRole('Administrator')) {
                abort(403);
            }
            throw ValidationException::withMessages([
                'pickup' => 'Pick Up sudah Approved. Silakan Cancel Approved dulu oleh Administrator.',
            ]);
        }

        if (! $user->hasRole('Administrator') && $pickup->user_id !== $user->id) {
            abort(403);
        }

        DB::transaction(function () use ($pickup) {
            $lockedPickup = ArrangementSchedulePickup::query()
                ->whereKey($pickup->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $lockedSchedule = ArrangementSchedule::query()
                ->whereKey($lockedPickup->schedule_id)
                ->lockForUpdate()
                ->first();

            if ($lockedSchedule?->status === 'Approved') {
                throw ValidationException::withMessages([
                    'pickup' => 'Pick Up sudah Approved. Silakan Cancel Approved dulu oleh Administrator.',
                ]);
            }

            if ($lockedPickup->status !== 'Released') {
                return;
            }

            $lockedPickup->forceFill(['status' => 'Picked'])->save();

            if (! $lockedSchedule || $lockedSchedule->status === 'Approved') return;

            $pickupCount = ArrangementSchedulePickup::query()
                ->where('schedule_id', $lockedSchedule->id)
                ->count();

            $releasedCount = ArrangementSchedulePickup::query()
                ->where('schedule_id', $lockedSchedule->id)
                ->where('status', 'Released')
                ->count();

            $lockedSchedule->update([
                'status' => ArrangementSchedule::statusFromPickupCounts((int) $lockedSchedule->count, $pickupCount, $releasedCount),
            ]);
        });

        return back();
    }
}
