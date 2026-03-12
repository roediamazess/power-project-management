<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller; // Pastikan ini ada
use App\Models\Schedule;
use Illuminate\Http\Request;

class ScheduleController extends Controller                                                             
{
    // Halaman web utama: tampilkan daftar schedule dalam view Blade
    public function indexPage()
    {
        $schedules = Schedule::orderBy('period_start')->get();
        return view('schedules', compact('schedules'));
    }

    // 1. Mengambil semua data schedule
    public function index()                                                                         
    {
        $schedules = Schedule::all();
        return response()->json($schedules, 200);
    }

    // 2. Admin membuat jadwal baru
    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Only admin can create a schedule.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after:period_start',
        ]);

        $schedule = Schedule::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'period_start' => $validated['period_start'],
            'period_end' => $validated['period_end'],
            'status' => 'available',
            'assigned_to' => null,
            'created_by' => auth()->id(),
        ]);

        return response()->json($schedule, 201);
    }

    // 2b. Admin membuat jadwal baru via form web
    public function storeWeb(Request $request)
    {
        $user = auth()->user();
        if (!$user || $user->role !== 'admin') {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after:period_start',
        ]);

        Schedule::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'period_start' => $validated['period_start'],
            'period_end' => $validated['period_end'],
            'status' => 'available',
            'assigned_to' => null,
            'created_by' => $user->id,
        ]);

        return redirect('/')
            ->with('status', 'Schedule baru berhasil dibuat.');
    }

    // 3. User login mengambil jadwal
    public function pickup($id)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Hanya role 'team' yang boleh pickup schedule
        if ($user->role !== 'team') {
            return response()->json(['message' => 'Only team users can pickup schedules.'], 403);
        }

        $schedule = Schedule::find($id);
        if (!$schedule) {
            return response()->json(['message' => 'Schedule not found.'], 404);
        }

        if ($schedule->status === 'picked_up') {
            return response()->json(['message' => 'Schedule already picked up by someone else.'], 400);
        }

        $schedule->status = 'picked_up';
        $schedule->assigned_to = $user->id;
        $schedule->save();

        return response()->json($schedule, 200);
    }

    // 4. User yang memegang jadwal dapat release
    public function release($id)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $schedule = Schedule::find($id);
        if (!$schedule) {
            return response()->json(['message' => 'Schedule not found.'], 404);
        }

        $isAdmin = $user->role === 'admin';
        $isAssignedUser = $schedule->assigned_to === $user->id;

        // Hanya admin atau user yang sedang memegang jadwal yang boleh release
        if (!$isAdmin && !$isAssignedUser) {
            return response()->json(['message' => 'You are not allowed to release this schedule.'], 403);
        }

        $schedule->status = 'released';
        $schedule->save();

        return response()->json($schedule, 200);
    }

    // 5. Admin atau User yang assigned_to dapat reopen
    public function reOpen($id)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $schedule = Schedule::find($id);
        if (!$schedule) {
            return response()->json(['message' => 'Schedule not found.'], 404);
        }

        $isAdmin = $user->role === 'admin';
        $isAssignedUser = $schedule->assigned_to === $user->id;

        if (!$isAdmin && !$isAssignedUser) {
            return response()->json(['message' => 'Unauthorized. Only admin or assigned user can re-open this schedule.'], 403);
        }

        $schedule->status = 'picked_up';
        $schedule->assigned_to = $user->id;
        $schedule->save();

        return response()->json($schedule, 200);
    }
}
