<?php

namespace App\Http\Controllers\Arrangement;

use App\Http\Controllers\Controller;
use App\Models\ArrangementBatch;
use App\Models\ArrangementSchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ArrangementBatchesController extends Controller
{
    public function index(): Response
    {
        $batches = ArrangementBatch::query()
            ->withCount('schedules')
            ->orderByDesc('created_at')
            ->paginate(50)
            ->withQueryString();

        $publishSchedules = ArrangementSchedule::query()
            ->where('status', 'Publish')
            ->orderBy('start_date')
            ->get(['id', 'batch_id', 'schedule_type', 'start_date', 'end_date', 'count', 'status']);

        return Inertia::render('Arrangement/Batches', [
            'batches' => $batches,
            'publishSchedules' => $publishSchedules,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'requirement_points' => ['required', 'integer', 'min:0', 'max:999'],
            'schedule_ids' => ['nullable', 'array'],
            'schedule_ids.*' => ['uuid', Rule::exists('arrangement_schedules', 'id')],
        ]);

        $batch = ArrangementBatch::query()->create([
            'name' => $data['name'],
            'requirement_points' => $data['requirement_points'],
            'created_by' => $request->user()->id,
        ]);

        if (! empty($data['schedule_ids'])) {
            ArrangementSchedule::query()
                ->whereIn('id', $data['schedule_ids'])
                ->where('status', 'Publish')
                ->update(['batch_id' => $batch->id]);
        }

        return back();
    }

    public function update(Request $request, ArrangementBatch $batch): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'requirement_points' => ['required', 'integer', 'min:0', 'max:999'],
            'schedule_ids' => ['nullable', 'array'],
            'schedule_ids.*' => ['uuid', Rule::exists('arrangement_schedules', 'id')],
        ]);

        $batch->forceFill([
            'name' => $data['name'],
            'requirement_points' => $data['requirement_points'],
        ])->save();

        if (array_key_exists('schedule_ids', $data)) {
            ArrangementSchedule::query()
                ->where('batch_id', $batch->id)
                ->update(['batch_id' => null]);

            if (! empty($data['schedule_ids'])) {
                ArrangementSchedule::query()
                    ->whereIn('id', $data['schedule_ids'])
                    ->where('status', 'Publish')
                    ->update(['batch_id' => $batch->id]);
            }
        }

        return back();
    }
}

