<?php

namespace App\Http\Controllers;

use App\Models\PowerUser;
use App\Models\PowerSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ScheduleArrangementController extends Controller
{
    /**
     * GET /api/schedule-arrangement/data
     * Returns all users and schedules for the Schedule Arrangement (Power Management) app.
     */
    public function data(): JsonResponse
    {
        if (PowerUser::count() === 0) {
            (new \Database\Seeders\PowerUserSeeder())->run();
        }

        $users = PowerUser::orderBy('username')->get()->map(function (PowerUser $u) {
            return [
                '__backendId' => (string) $u->id,
                'type' => 'user',
                'username' => $u->username,
                'password' => $u->password,
                'role' => $u->role,
                'tier' => $u->tier,
                'point' => (int) $u->point,
                'schedule_id' => '',
                'schedule_name' => '',
                'description' => '',
                'start_date' => '',
                'end_date' => '',
                'batch_id' => '',
                'batch_name' => '',
                'point_min' => 0,
                'point_max' => 0,
                'status' => '',
                'picked_by' => '',
                'released_at' => '',
                'created_by' => '',
                'created_at' => $u->created_at?->toIso8601String() ?? '',
            ];
        });

        $schedules = PowerSchedule::orderBy('created_at')->get()->map(function (PowerSchedule $s) {
            return [
                '__backendId' => (string) $s->id,
                'type' => 'schedule',
                'schedule_id' => $s->schedule_id ?? '',
                'schedule_name' => $s->schedule_name,
                'description' => $s->description ?? '',
                'start_date' => $s->start_date->format('Y-m-d'),
                'end_date' => $s->end_date->format('Y-m-d'),
                'pickup_start' => $s->pickup_start ? $s->pickup_start->format('Y-m-d\TH:i') : null,
                'pickup_end' => $s->pickup_end ? $s->pickup_end->format('Y-m-d\TH:i') : null,
                'status' => $s->status,
                'batch_id' => $s->batch_id ?? '',
                'batch_name' => $s->batch_name ?? '',
                'point_min' => (int) $s->point_min,
                'point_max' => (int) $s->point_max,
                'picked_by' => $s->picked_by ?? '',
                'released_at' => $s->released_at ? $s->released_at->toIso8601String() : '',
                'created_by' => $s->created_by ?? '',
                'created_at' => $s->created_at?->toIso8601String() ?? '',
            ];
        });

        return response()->json([
            'users' => $users,
            'schedules' => $schedules,
        ]);
    }

    /**
     * POST /api/schedule-arrangement/users
     */
    public function storeUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|max:255|unique:power_users,username',
            'password' => 'required|string|max:255',
            'role' => 'required|in:admin,team',
            'tier' => 'nullable|in:admin,new_born,tier_1,tier_2,tier_3',
            'point' => 'nullable|integer|min:0',
        ]);

        $user = PowerUser::create([
            'username' => $validated['username'],
            'password' => $validated['password'],
            'role' => $validated['role'],
            'tier' => $validated['tier'] ?? ($validated['role'] === 'admin' ? 'admin' : 'new_born'),
            'point' => $validated['point'] ?? 1,
        ]);

        return response()->json($this->userToRecord($user), 201);
    }

    /**
     * PUT /api/schedule-arrangement/users/{id}
     */
    public function updateUser(Request $request, string $id): JsonResponse
    {
        $user = PowerUser::find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $validated = $request->validate([
            'username' => 'sometimes|string|max:255|unique:power_users,username,' . $id,
            'password' => 'sometimes|string|max:255',
            'role' => 'sometimes|in:admin,team',
            'tier' => 'sometimes|in:admin,new_born,tier_1,tier_2,tier_3',
            'point' => 'sometimes|integer|min:0',
        ]);

        $user->fill($validated);
        $user->save();

        return response()->json($this->userToRecord($user));
    }

    /**
     * POST /api/schedule-arrangement/schedules
     */
    public function storeSchedule(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'schedule_id' => 'nullable|string|max:255',
            'schedule_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'pickup_start' => 'nullable|date',
            'pickup_end' => 'nullable|date',
            'status' => 'nullable|in:available,picked,released',
            'batch_id' => 'nullable|string|max:255',
            'batch_name' => 'nullable|string|max:255',
            'point_min' => 'nullable|integer|min:0',
            'point_max' => 'nullable|integer|min:0',
            'picked_by' => 'nullable|string|max:255',
            'released_at' => 'nullable|date',
            'created_by' => 'nullable|string|max:255',
        ]);

        $schedule = PowerSchedule::create([
            'schedule_id' => $validated['schedule_id'] ?? null,
            'schedule_name' => $validated['schedule_name'],
            'description' => $validated['description'] ?? null,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'pickup_start' => isset($validated['pickup_start']) ? $validated['pickup_start'] : null,
            'pickup_end' => isset($validated['pickup_end']) ? $validated['pickup_end'] : null,
            'status' => $validated['status'] ?? 'available',
            'batch_id' => $validated['batch_id'] ?? '',
            'batch_name' => $validated['batch_name'] ?? '',
            'point_min' => $validated['point_min'] ?? 0,
            'point_max' => $validated['point_max'] ?? 0,
            'picked_by' => $validated['picked_by'] ?? null,
            'released_at' => isset($validated['released_at']) ? $validated['released_at'] : null,
            'created_by' => $validated['created_by'] ?? null,
        ]);

        return response()->json($this->scheduleToRecord($schedule), 201);
    }

    /**
     * PUT /api/schedule-arrangement/schedules/{id}
     */
    public function updateSchedule(Request $request, string $id): JsonResponse
    {
        $schedule = PowerSchedule::find($id);
        if (!$schedule) {
            return response()->json(['message' => 'Schedule not found'], 404);
        }

        $validated = $request->validate([
            'schedule_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date',
            'pickup_start' => 'nullable|date',
            'pickup_end' => 'nullable|date',
            'status' => 'sometimes|in:available,picked,released',
            'batch_id' => 'nullable|string|max:255',
            'batch_name' => 'nullable|string|max:255',
            'point_min' => 'sometimes|integer|min:0',
            'point_max' => 'sometimes|integer|min:0',
            'picked_by' => 'nullable|string|max:255',
            'released_at' => 'nullable|date',
            'created_by' => 'nullable|string|max:255',
        ]);

        $schedule->fill($validated);
        $schedule->save();

        return response()->json($this->scheduleToRecord($schedule));
    }

    /**
     * POST /api/schedule-arrangement/schedules/{id}/claim
     * Atomic pickup: only one user can claim a schedule when status is 'available'.
     * Safe for many users (e.g. 50) picking at the same time.
     */
    public function claimSchedule(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|max:255',
        ]);
        $username = $validated['username'];

        $schedule = DB::transaction(function () use ($id, $username) {
            $row = PowerSchedule::where('id', $id)->lockForUpdate()->first();
            if (!$row) {
                return null;
            }
            if ($row->status !== 'available') {
                return ['conflict' => $row->picked_by ?? 'someone'];
            }
            $row->status = 'picked';
            $row->picked_by = $username;
            $row->save();
            return $row;
        });

        if ($schedule === null) {
            return response()->json(['message' => 'Schedule not found'], 404);
        }
        if (is_array($schedule) && isset($schedule['conflict'])) {
            return response()->json([
                'message' => 'already_taken',
                'picked_by' => $schedule['conflict'],
            ], 409);
        }

        return response()->json($this->scheduleToRecord($schedule));
    }

    /**
     * POST /api/schedule-arrangement/schedules/{id}/reopen
     * Hanya pemilik jadwal (picked_by) atau admin yang boleh reopen. Aman untuk akses bersamaan.
     */
    public function reopenSchedule(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|max:255',
            'is_admin' => 'required|boolean',
        ]);
        $username = $validated['username'];
        $isAdmin = $validated['is_admin'];

        $schedule = DB::transaction(function () use ($id, $username, $isAdmin) {
            $row = PowerSchedule::where('id', $id)->lockForUpdate()->first();
            if (!$row) {
                return null;
            }
            if (!in_array($row->status, ['picked', 'released'], true)) {
                return ['error' => 'invalid_status'];
            }
            if (!$isAdmin && ($row->picked_by !== $username)) {
                return ['error' => 'forbidden'];
            }
            $row->status = 'available';
            $row->picked_by = null;
            $row->released_at = null;
            $row->save();
            return $row;
        });

        if ($schedule === null) {
            return response()->json(['message' => 'Schedule not found'], 404);
        }
        if (is_array($schedule)) {
            if (($schedule['error'] ?? '') === 'forbidden') {
                return response()->json(['message' => 'Only the assignee or admin can reopen'], 403);
            }
            return response()->json(['message' => 'Schedule cannot be reopened in current status'], 400);
        }

        return response()->json($this->scheduleToRecord($schedule));
    }

    /**
     * POST /api/schedule-arrangement/schedules/{id}/release
     * Hanya pemilik jadwal (picked_by) atau admin yang boleh release. Aman untuk akses bersamaan.
     */
    public function releaseSchedule(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'username' => 'required|string|max:255',
            'is_admin' => 'required|boolean',
        ]);
        $username = $validated['username'];
        $isAdmin = $validated['is_admin'];

        $schedule = DB::transaction(function () use ($id, $username, $isAdmin) {
            $row = PowerSchedule::where('id', $id)->lockForUpdate()->first();
            if (!$row) {
                return null;
            }
            if ($row->status !== 'picked') {
                return ['error' => 'invalid_status'];
            }
            if (!$isAdmin && ($row->picked_by !== $username)) {
                return ['error' => 'forbidden'];
            }
            $row->status = 'released';
            $row->released_at = now();
            $row->save();
            return $row;
        });

        if ($schedule === null) {
            return response()->json(['message' => 'Schedule not found'], 404);
        }
        if (is_array($schedule)) {
            if (($schedule['error'] ?? '') === 'forbidden') {
                return response()->json(['message' => 'Only the assignee or admin can release'], 403);
            }
            return response()->json(['message' => 'Schedule must be picked before release'], 400);
        }

        return response()->json($this->scheduleToRecord($schedule));
    }

    /**
     * DELETE /api/schedule-arrangement/schedules/{id}
     */
    public function destroySchedule(string $id): JsonResponse
    {
        $schedule = PowerSchedule::find($id);
        if (!$schedule) {
            return response()->json(['message' => 'Schedule not found'], 404);
        }
        $schedule->delete();
        return response()->json(['ok' => true]);
    }

    private function userToRecord(PowerUser $u): array
    {
        return [
            '__backendId' => (string) $u->id,
            'type' => 'user',
            'username' => $u->username,
            'password' => $u->password,
            'role' => $u->role,
            'tier' => $u->tier,
            'point' => (int) $u->point,
            'schedule_id' => '',
            'schedule_name' => '',
            'description' => '',
            'start_date' => '',
            'end_date' => '',
            'batch_id' => '',
            'batch_name' => '',
            'point_min' => 0,
            'point_max' => 0,
            'status' => '',
            'picked_by' => '',
            'released_at' => '',
            'created_by' => '',
            'created_at' => $u->created_at?->toIso8601String() ?? '',
        ];
    }

    private function scheduleToRecord(PowerSchedule $s): array
    {
        return [
            '__backendId' => (string) $s->id,
            'type' => 'schedule',
            'schedule_id' => $s->schedule_id ?? '',
            'schedule_name' => $s->schedule_name,
            'description' => $s->description ?? '',
            'start_date' => $s->start_date->format('Y-m-d'),
            'end_date' => $s->end_date->format('Y-m-d'),
            'pickup_start' => $s->pickup_start ? $s->pickup_start->format('Y-m-d\TH:i') : null,
            'pickup_end' => $s->pickup_end ? $s->pickup_end->format('Y-m-d\TH:i') : null,
            'status' => $s->status,
            'batch_id' => $s->batch_id ?? '',
            'batch_name' => $s->batch_name ?? '',
            'point_min' => (int) $s->point_min,
            'point_max' => (int) $s->point_max,
            'picked_by' => $s->picked_by ?? '',
            'released_at' => $s->released_at ? $s->released_at->toIso8601String() : '',
            'created_by' => $s->created_by ?? '',
            'created_at' => $s->created_at?->toIso8601String() ?? '',
        ];
    }
}
