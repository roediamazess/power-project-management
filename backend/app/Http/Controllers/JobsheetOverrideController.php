<?php

namespace App\Http\Controllers;

use App\Models\JobsheetOverride;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobsheetOverrideController extends Controller
{
    public function index(Request $request)
    {
        $q = JobsheetOverride::query();

        if ($request->filled('period_id')) {
            $q->where('period_id', $request->string('period_id'));
        }

        if ($request->filled('username')) {
            $q->where('username', $request->string('username'));
        }

        if ($request->filled('start')) {
            $q->where('date', '>=', $request->string('start'));
        }

        if ($request->filled('end')) {
            $q->where('date', '<=', $request->string('end'));
        }

        return response()->json($q->orderBy('date')->get(), 200);
    }

    public function upsert(Request $request)
    {
        $data = $request->validate([
            'period_id' => 'nullable|string|max:255',
            'username' => 'required|string|max:255',
            'date' => 'required|date',
            'value' => 'required|string|max:255',
        ]);

        $rec = JobsheetOverride::updateOrCreate(
            [
                'period_id' => $data['period_id'] ?? null,
                'username' => $data['username'],
                'date' => $data['date'],
            ],
            [
                'value' => $data['value'],
            ]
        );

        return response()->json($rec, 200);
    }

    public function bulk(Request $request)
    {
        $data = $request->validate([
            'period_id' => 'required|string|max:255',
            'username' => 'required|string|max:255',
            // Preferred: contiguous range
            'start' => 'nullable|date',
            'end' => 'nullable|date',
            // Fallback: CSV string or array
            'dates' => 'nullable',
            'value' => 'required|string|max:255',
        ]);

        $periodId = $data['period_id'];
        $username = $data['username'];
        // Fast path: contiguous range via generate_series (1 SQL)
        if (!empty($data['start']) && !empty($data['end'])) {
            $start = $data['start'];
            $end = $data['end'];
            if ($data['value'] === 'clear') {
                DB::statement(
                    'DELETE FROM jobsheet_overrides WHERE period_id = ? AND username = ? AND date BETWEEN ? AND ?',
                    [$periodId, $username, $start, $end]
                );
                return response()->json(['ok' => true, 'cleared_range' => true], 200);
            }

            DB::statement(
                "INSERT INTO jobsheet_overrides (period_id, username, date, value, created_at, updated_at)
                 SELECT ?, ?, gs::date, ?, NOW(), NOW()
                 FROM generate_series(?::date, ?::date, interval '1 day') gs
                 ON CONFLICT (period_id, username, date)
                 DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
                [$periodId, $username, $data['value'], $start, $end]
            );
            return response()->json(['ok' => true, 'updated_range' => true], 200);
        }

        // Fallback: dates list (still optimized with one upsert)
        $datesRaw = $data['dates'] ?? '';
        $dates = [];
        if (is_array($datesRaw)) $dates = $datesRaw;
        else if (is_string($datesRaw)) $dates = array_filter(array_map('trim', explode(',', $datesRaw)));

        $dates = array_values(array_unique(array_filter($dates, function ($d) {
            return is_string($d) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $d);
        })));
        sort($dates);
        if (count($dates) === 0) return response()->json(['ok' => false, 'message' => 'No valid dates'], 422);

        if ($data['value'] === 'clear') {
            JobsheetOverride::where('period_id', $periodId)->where('username', $username)->whereIn('date', $dates)->delete();
            return response()->json(['ok' => true, 'deleted' => count($dates)], 200);
        }

        $now = now();
        $rows = array_map(fn ($d) => [
            'period_id' => $periodId,
            'username' => $username,
            'date' => $d,
            'value' => $data['value'],
            'created_at' => $now,
            'updated_at' => $now,
        ], $dates);

        DB::table('jobsheet_overrides')->upsert($rows, ['period_id', 'username', 'date'], ['value', 'updated_at']);
        return response()->json(['ok' => true, 'updated' => count($dates)], 200);
    }
}

