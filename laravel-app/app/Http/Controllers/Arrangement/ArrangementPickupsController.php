<?php

namespace App\Http\Controllers\Arrangement;

use App\Http\Controllers\Controller;
use App\Models\ArrangementSchedule;
use App\Models\ArrangementSchedulePickup;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ArrangementPickupsController extends Controller
{
    public function store(Request $request, ArrangementSchedule $schedule): RedirectResponse
    {
        $user = $request->user();

        if ($schedule->status !== 'Publish') {
            abort(422);
        }

        $schedule->load(['batch:id,requirement_points', 'pickups:id,schedule_id,user_id,points']);

        if ($schedule->pickups->count() >= (int) $schedule->count) {
            abort(422);
        }

        $points = ArrangementController::tierPoints($user->tier);

        if ($schedule->batch) {
            $batchCurrentPoints = ArrangementSchedulePickup::query()
                ->join('arrangement_schedules', 'arrangement_schedules.id', '=', 'arrangement_schedule_pickups.schedule_id')
                ->where('arrangement_schedules.batch_id', $schedule->batch_id)
                ->sum('arrangement_schedule_pickups.points');

            if ($batchCurrentPoints + $points > (int) $schedule->batch->requirement_points) {
                abort(422);
            }
        }

        try {
            ArrangementSchedulePickup::query()->create([
                'schedule_id' => $schedule->id,
                'user_id' => $user->id,
                'points' => $points,
            ]);
        } catch (QueryException $e) {
            abort(422);
        }

        return back();
    }

    public function destroy(Request $request, ArrangementSchedulePickup $pickup): RedirectResponse
    {
        $user = $request->user();
        $pickup->load('schedule:id,status');

        if ($pickup->schedule?->status === 'Approved' && ! $user->hasAnyRole(['Administrator', 'Admin Officer'])) {
            abort(403);
        }

        if (! $user->hasAnyRole(['Administrator', 'Admin Officer']) && $pickup->user_id !== $user->id) {
            abort(403);
        }

        $pickup->delete();

        return back();
    }
}
