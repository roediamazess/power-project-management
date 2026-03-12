<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\JobsheetOverrideController;
use App\Http\Controllers\ScheduleArrangementController;

// Schedule Arrangement (Power Management) — persist users & schedules in PostgreSQL
Route::get('/schedule-arrangement/data', [ScheduleArrangementController::class, 'data']);
Route::post('/schedule-arrangement/users', [ScheduleArrangementController::class, 'storeUser']);
Route::put('/schedule-arrangement/users/{id}', [ScheduleArrangementController::class, 'updateUser']);
Route::post('/schedule-arrangement/schedules', [ScheduleArrangementController::class, 'storeSchedule']);
Route::put('/schedule-arrangement/schedules/{id}', [ScheduleArrangementController::class, 'updateSchedule']);
Route::post('/schedule-arrangement/schedules/{id}/claim', [ScheduleArrangementController::class, 'claimSchedule']);
Route::post('/schedule-arrangement/schedules/{id}/reopen', [ScheduleArrangementController::class, 'reopenSchedule']);
Route::post('/schedule-arrangement/schedules/{id}/release', [ScheduleArrangementController::class, 'releaseSchedule']);
Route::delete('/schedule-arrangement/schedules/{id}', [ScheduleArrangementController::class, 'destroySchedule']);

// Jalur untuk mengambil data jadwal
Route::get('/schedules', [ScheduleController::class, 'index']);

// Jalur untuk aksi (Pickup, Release, Re-Open)
Route::post('/schedules/{id}/pickup', [ScheduleController::class, 'pickup']);
Route::post('/schedules/{id}/release', [ScheduleController::class, 'release']);
Route::post('/schedules/{id}/re-open', [ScheduleController::class, 'reOpen']);

// Jobsheet overrides (grid inline/bulk edit)
Route::get('/jobsheet-overrides', [JobsheetOverrideController::class, 'index']);
Route::post('/jobsheet-overrides', [JobsheetOverrideController::class, 'upsert']);
Route::post('/jobsheet-overrides/bulk', [JobsheetOverrideController::class, 'bulk']);