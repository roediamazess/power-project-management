<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\AuthController;

// Route home/welcome
Route::get('/', [ScheduleController::class, 'indexPage']);

// Auth routes (simple login/logout)
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

// Public route: Get all schedules (JSON API)
Route::get('/schedules', [ScheduleController::class, 'index']);

// Protected routes (web auth)
Route::middleware('auth')->group(function () {
    // Admin creates schedule via web form
    Route::post('/schedules', [ScheduleController::class, 'storeWeb'])->name('schedules.store.web');

    // pickup, release, re-open
    Route::post('/schedules/{id}/pickup', [ScheduleController::class, 'pickup'])->name('schedules.pickup');
    Route::post('/schedules/{id}/release', [ScheduleController::class, 'release'])->name('schedules.release');
    Route::post('/schedules/{id}/re-open', [ScheduleController::class, 'reOpen'])->name('schedules.reopen');
});