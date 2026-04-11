<?php

namespace App\Http\Controllers\Tables;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Holiday;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class HolidaysController extends Controller
{
    public function index(Request $request): Response
    {
        $holidays = Holiday::query()
            ->orderBy('date')
            ->get()
            ->map(fn (Holiday $h) => [
                'id' => $h->id,
                'date' => $h->date?->toDateString(),
                'description' => $h->description,
            ])
            ->values();

        return Inertia::render('Tables/Holiday/Index', [
            'holidays' => $holidays,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        return DB::transaction(function () use ($request) {
            $data = $request->validate([
                'date' => ['required', 'date', Rule::unique('holidays', 'date')],
                'description' => ['required', 'string', 'max:255'],
            ]);

            $holiday = Holiday::query()->create([
                'date' => $data['date'],
                'description' => $data['description'],
            ]);

            AuditLog::record($request, 'create', Holiday::class, (string) $holiday->id, null, $holiday->fresh()->toArray());

            return redirect()->route('tables.holiday.index');
        });
    }

    public function update(Request $request, Holiday $holiday): RedirectResponse
    {
        return DB::transaction(function () use ($request, $holiday) {
            $data = $request->validate([
                'date' => ['required', 'date', Rule::unique('holidays', 'date')->ignore($holiday->id)],
                'description' => ['required', 'string', 'max:255'],
            ]);

            $before = $holiday->fresh()->toArray();

            $holiday->update([
                'date' => $data['date'],
                'description' => $data['description'],
            ]);

            $after = $holiday->fresh()->toArray();
            AuditLog::record($request, 'update', Holiday::class, (string) $holiday->id, $before, $after);

            return redirect()->route('tables.holiday.index');
        });
    }

    public function destroy(Request $request, Holiday $holiday): RedirectResponse
    {
        return DB::transaction(function () use ($request, $holiday) {
            $before = $holiday->fresh()->toArray();
            $id = (string) $holiday->id;
            $holiday->delete();
            AuditLog::record($request, 'delete', Holiday::class, $id, $before, null);

            return redirect()->route('tables.holiday.index');
        });
    }
}
