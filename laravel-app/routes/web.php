<?php

use App\Http\Controllers\BackupsController;
use App\Http\Controllers\ProfileController;

Route::middleware(['auth', 'verified', 'role:Administrator'])->group(function () {
    Route::get('/backups', [BackupsController::class, 'index'])->name('backups.index');
    Route::post('/backups/manual/run', [BackupsController::class, 'run'])->name('backups.manual.run');
    Route::get('/backups/manual/status/{runId}', [BackupsController::class, 'status'])->name('backups.manual.status');
});
use App\Http\Controllers\Tables\UserManagementController;
use App\Http\Controllers\Tables\PartnersController;
use App\Http\Controllers\Tables\PartnerSetupController;
use App\Http\Controllers\Tables\ProjectsController;
use App\Http\Controllers\Tables\ProjectSetupController;
use App\Http\Controllers\Tables\AuditLogsController;
use App\Http\Controllers\Tables\TimeBoxingSetupController;
use App\Http\Controllers\Tables\TimeBoxingsController;
use App\Http\Controllers\Tables\HolidaysController;
use App\Http\Controllers\Arrangement\ArrangementController;
use App\Http\Controllers\Arrangement\ArrangementSchedulesController;
use App\Http\Controllers\Arrangement\ArrangementJobsheetController;
use App\Http\Controllers\Arrangement\ArrangementBatchesController;
use App\Http\Controllers\Arrangement\ArrangementPickupsController;
use App\Http\Controllers\MessagesController;
use App\Http\Controllers\NotificationsController;
use App\Http\Controllers\OfficeAgentController;
use App\Http\Controllers\TelegramWebhookController;
use App\Http\Controllers\DashboardPartnersController;
use App\Http\Controllers\DashboardTimeBoxingController;
use App\Http\Controllers\DashboardHealthScoreController;
use App\Http\Controllers\HealthScoreController;
use App\Support\TemplatePage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return view('landing');
});

Route::get('/health', function () {
    return response()->json([
        'ok' => true,
        'time' => now()->toISOString(),
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/dashboard/partners', [DashboardPartnersController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.partners');

Route::get('/dashboard/partners/drilldown', [DashboardPartnersController::class, 'drilldown'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard.partners.drilldown');

Route::get('/dashboard/time-boxing', [DashboardTimeBoxingController::class, 'index'])
    ->middleware(['auth', 'verified', 'role_or_permission:Administrator|time_boxing.view'])
    ->name('dashboard.time-boxing');

Route::get('/dashboard/time-boxing/drilldown', [DashboardTimeBoxingController::class, 'drilldown'])
    ->middleware(['auth', 'verified', 'role_or_permission:Administrator|time_boxing.view'])
    ->name('dashboard.time-boxing.drilldown');

Route::put('/dashboard/time-boxing/{timeBoxing}', [DashboardTimeBoxingController::class, 'updateTimeBoxing'])
    ->middleware(['auth', 'verified', 'role_or_permission:Administrator|time_boxing.update'])
    ->name('dashboard.time-boxing.update');

Route::get('/dashboard/health-score', [DashboardHealthScoreController::class, 'index'])
    ->middleware(['auth', 'verified', 'role:Administrator|Admin Officer'])
    ->name('dashboard.health-score');

Route::post('/dashboard/health-score', [DashboardHealthScoreController::class, 'storeDraft'])
    ->middleware(['auth', 'verified', 'role:Administrator|Admin Officer'])
    ->name('dashboard.health-score.store');

Route::post('/dashboard/health-score/submit', [DashboardHealthScoreController::class, 'submit'])
    ->middleware(['auth', 'verified', 'role:Administrator|Admin Officer'])
    ->name('dashboard.health-score.submit');

Route::get('/health-score', [HealthScoreController::class, 'index'])
    ->middleware(['auth', 'verified', 'role:Administrator|Admin Officer'])
    ->name('health-score.index');

Route::get('/health-score/create', [HealthScoreController::class, 'create'])
    ->middleware(['auth', 'verified', 'role:Administrator|Admin Officer'])
    ->name('health-score.create');

Route::post('/health-score', [HealthScoreController::class, 'store'])
    ->middleware(['auth', 'verified', 'role:Administrator|Admin Officer'])
    ->name('health-score.store');

Route::get('/health-score/{survey}', [HealthScoreController::class, 'show'])
    ->middleware(['auth', 'verified', 'role:Administrator|Admin Officer'])
    ->name('health-score.show');

Route::post('/health-score/{survey}', [HealthScoreController::class, 'storeDraft'])
    ->middleware(['auth', 'verified', 'role:Administrator|Admin Officer'])
    ->name('health-score.surveys.store');

Route::post('/health-score/{survey}/submit', [HealthScoreController::class, 'submit'])
    ->middleware(['auth', 'verified', 'role:Administrator|Admin Officer'])
    ->name('health-score.surveys.submit');

Route::get('/health-score/s/{token}', [HealthScoreController::class, 'publicShow'])
    ->name('health-score.public.show');

Route::post('/health-score/s/{token}', [HealthScoreController::class, 'publicStoreDraft'])
    ->name('health-score.public.store');

Route::post('/health-score/s/{token}/submit', [HealthScoreController::class, 'publicSubmit'])
    ->name('health-score.public.submit');

Route::post('/telegram/webhook', [TelegramWebhookController::class, 'handle'])->name('telegram.webhook');

Route::middleware('auth')->group(function () {
    Route::get('/office-agent', [OfficeAgentController::class, 'index'])->name('office-agent.index');
    Route::post('/office-agent/runs', [OfficeAgentController::class, 'storeRun'])->name('office-agent.runs.store');
    Route::get('/office-agent/runs/{runId}/stream', [OfficeAgentController::class, 'streamRun'])->name('office-agent.runs.stream');
    Route::get('/office-agent/activity', [OfficeAgentController::class, 'activity'])->name('office-agent.activity');
    Route::get('/office-agent/logger/events', [OfficeAgentController::class, 'loggerEvents'])->middleware('role_or_permission:Administrator|audit_logs.view')->name('office-agent.logger.events');
    Route::get('/office-agent/security/events', [OfficeAgentController::class, 'securityEvents'])->middleware('role_or_permission:Administrator|audit_logs.view')->name('office-agent.security.events');
    Route::post('/office-agent/sprites/sheet', [OfficeAgentController::class, 'uploadSpriteSheet'])->middleware('role_or_permission:Administrator|audit_logs.view')->name('office-agent.sprites.sheet.upload');

    Route::get('/tables/user-management', [UserManagementController::class, 'index'])->middleware('role_or_permission:Administrator|user_management.view')->name('tables.user-management.index');
    Route::post('/tables/user-management', [UserManagementController::class, 'store'])->middleware('role_or_permission:Administrator|user_management.create')->name('tables.user-management.store');
    Route::put('/tables/user-management/{user}', [UserManagementController::class, 'update'])->middleware('role_or_permission:Administrator|user_management.update')->name('tables.user-management.update');
    Route::delete('/tables/user-management/{user}', [UserManagementController::class, 'destroy'])->middleware('role_or_permission:Administrator|user_management.delete')->name('tables.user-management.destroy');
    Route::post('/tables/user-management/permissions', [UserManagementController::class, 'updateRolePermissions'])->middleware('role_or_permission:Administrator|access_control.manage')->name('tables.user-management.permissions');
    Route::get('/tables/partners', [PartnersController::class, 'index'])->middleware('role_or_permission:Administrator|partners.view')->name('tables.partners.index');
    Route::post('/tables/partners', [PartnersController::class, 'store'])->middleware('role_or_permission:Administrator|partners.create')->name('tables.partners.store');
    Route::put('/tables/partners/{partner}', [PartnersController::class, 'update'])->middleware('role_or_permission:Administrator|partners.update')->name('tables.partners.update');
    Route::delete('/tables/partners/{partner}', [PartnersController::class, 'destroy'])->middleware('role_or_permission:Administrator|partners.delete')->name('tables.partners.destroy');
    Route::get('/tables/partner-setup', [PartnerSetupController::class, 'index'])->middleware('role_or_permission:Administrator|partner_setup.view')->name('tables.partner-setup.index');
    Route::post('/tables/partner-setup', [PartnerSetupController::class, 'store'])->middleware('role_or_permission:Administrator|partner_setup.create')->name('tables.partner-setup.store');
    Route::put('/tables/partner-setup/{option}', [PartnerSetupController::class, 'update'])->middleware('role_or_permission:Administrator|partner_setup.update')->name('tables.partner-setup.update');
    Route::delete('/tables/partner-setup/{option}', [PartnerSetupController::class, 'destroy'])->middleware('role_or_permission:Administrator|partner_setup.delete')->name('tables.partner-setup.destroy');
    Route::get('/tables/projects', [ProjectsController::class, 'index'])->middleware('role_or_permission:Administrator|projects.view')->name('tables.projects.index');
    Route::post('/tables/projects', [ProjectsController::class, 'store'])->middleware('role_or_permission:Administrator|projects.create')->name('tables.projects.store');
    Route::put('/tables/projects/{project}', [ProjectsController::class, 'update'])->middleware('role_or_permission:Administrator|projects.update')->name('tables.projects.update');
    Route::delete('/tables/projects/{project}', [ProjectsController::class, 'destroy'])->middleware('role_or_permission:Administrator|projects.delete')->name('tables.projects.destroy');
    Route::get('/tables/project-setup', [ProjectSetupController::class, 'index'])->middleware('role_or_permission:Administrator|project_setup.view')->name('tables.project-setup.index');
    Route::post('/tables/project-setup', [ProjectSetupController::class, 'store'])->middleware('role_or_permission:Administrator|project_setup.create')->name('tables.project-setup.store');
    Route::put('/tables/project-setup/{option}', [ProjectSetupController::class, 'update'])->middleware('role_or_permission:Administrator|project_setup.update')->name('tables.project-setup.update');
    Route::delete('/tables/project-setup/{option}', [ProjectSetupController::class, 'destroy'])->middleware('role_or_permission:Administrator|project_setup.delete')->name('tables.project-setup.destroy');
    Route::get('/tables/time-boxing', [TimeBoxingsController::class, 'index'])->middleware('role_or_permission:Administrator|time_boxing.view')->name('tables.time-boxing.index');
    Route::get('/tables/time-boxing/options', [TimeBoxingsController::class, 'options'])->middleware('role_or_permission:Administrator|time_boxing.view')->name('tables.time-boxing.options');
    Route::post('/tables/time-boxing', [TimeBoxingsController::class, 'store'])->middleware('role_or_permission:Administrator|time_boxing.create')->name('tables.time-boxing.store');
    Route::put('/tables/time-boxing/{timeBoxing}', [TimeBoxingsController::class, 'update'])->middleware('role_or_permission:Administrator|time_boxing.update')->name('tables.time-boxing.update');
    Route::delete('/tables/time-boxing/{timeBoxing}', [TimeBoxingsController::class, 'destroy'])->middleware('role_or_permission:Administrator|time_boxing.delete')->name('tables.time-boxing.destroy');

    Route::get('/tables/time-boxing-setup', [TimeBoxingSetupController::class, 'index'])->middleware('role_or_permission:Administrator|time_boxing_setup.view')->name('tables.time-boxing-setup.index');
    Route::post('/tables/time-boxing-setup', [TimeBoxingSetupController::class, 'store'])->middleware('role_or_permission:Administrator|time_boxing_setup.create')->name('tables.time-boxing-setup.store');
    Route::put('/tables/time-boxing-setup/{option}', [TimeBoxingSetupController::class, 'update'])->middleware('role_or_permission:Administrator|time_boxing_setup.update')->name('tables.time-boxing-setup.update');
    Route::delete('/tables/time-boxing-setup/{option}', [TimeBoxingSetupController::class, 'destroy'])->middleware('role_or_permission:Administrator|time_boxing_setup.delete')->name('tables.time-boxing-setup.destroy');

    Route::get('/tables/holiday', [HolidaysController::class, 'index'])->middleware('role_or_permission:Administrator|holidays.view')->name('tables.holiday.index');
    Route::post('/tables/holiday', [HolidaysController::class, 'store'])->middleware('role_or_permission:Administrator|holidays.create')->name('tables.holiday.store');
    Route::put('/tables/holiday/{holiday}', [HolidaysController::class, 'update'])->middleware('role_or_permission:Administrator|holidays.update')->name('tables.holiday.update');
    Route::delete('/tables/holiday/{holiday}', [HolidaysController::class, 'destroy'])->middleware('role_or_permission:Administrator|holidays.delete')->name('tables.holiday.destroy');

    Route::get('/tables/audit-logs', [AuditLogsController::class, 'index'])->middleware('role_or_permission:Administrator|audit_logs.view')->name('tables.audit-logs.index');
    Route::get('/tables/audit-logs/{auditLog}', [AuditLogsController::class, 'show'])->middleware('role_or_permission:Administrator|audit_logs.view')->name('tables.audit-logs.show');

    Route::get('/audit-logs', [AuditLogsController::class, 'index'])->middleware('role_or_permission:Administrator|audit_logs.view')->name('audit-logs.index');
    Route::get('/audit-logs/{auditLog}', [AuditLogsController::class, 'show'])->middleware('role_or_permission:Administrator|audit_logs.view')->name('audit-logs.show');

    Route::get('/projects', [ProjectsController::class, 'index'])->middleware('role_or_permission:Administrator|projects.view')->name('projects.index');
    Route::post('/projects', [ProjectsController::class, 'store'])->middleware('role_or_permission:Administrator|projects.create')->name('projects.store');
    Route::put('/projects/{project}', [ProjectsController::class, 'update'])->middleware('role_or_permission:Administrator|projects.update')->name('projects.update');
    Route::delete('/projects/{project}', [ProjectsController::class, 'destroy'])->middleware('role_or_permission:Administrator|projects.delete')->name('projects.destroy');

    Route::get('/partners', [PartnersController::class, 'index'])->middleware('role_or_permission:Administrator|partners.view')->name('partners.index');
    Route::post('/partners', [PartnersController::class, 'store'])->middleware('role_or_permission:Administrator|partners.create')->name('partners.store');
    Route::put('/partners/{partner}', [PartnersController::class, 'update'])->middleware('role_or_permission:Administrator|partners.update')->name('partners.update');
    Route::delete('/partners/{partner}', [PartnersController::class, 'destroy'])->middleware('role_or_permission:Administrator|partners.delete')->name('partners.destroy');

    Route::get('/arrangements', [ArrangementController::class, 'index'])->name('arrangements.index');
    Route::get('/arrangements/jobsheet', [ArrangementJobsheetController::class, 'index'])->name('arrangements.jobsheet');
    Route::get('/arrangements/jobsheet/{periodSlug}', [ArrangementJobsheetController::class, 'index'])
        ->where('periodSlug', '^periode-[a-z0-9-]+$')
        ->name('arrangements.jobsheet.slug');
    Route::post('/arrangements/jobsheet', [ArrangementJobsheetController::class, 'store'])->name('arrangements.jobsheet.store');
    Route::post('/arrangements/jobsheet/entries', [ArrangementJobsheetController::class, 'upsertEntry'])
        ->middleware('role:Administrator|Admin Officer')
        ->name('arrangements.jobsheet.entries.upsert');
    Route::post('/arrangements/jobsheet/entries/clear', [ArrangementJobsheetController::class, 'clearEntries'])
        ->middleware('role:Administrator|Admin Officer')
        ->name('arrangements.jobsheet.entries.clear');
    Route::post('/arrangements/jobsheet/default', [ArrangementJobsheetController::class, 'setDefaultPeriod'])
        ->middleware('role:Administrator|Admin Officer')
        ->name('arrangements.jobsheet.default');
    Route::post('/arrangements/schedules/{schedule}/pickups', [ArrangementPickupsController::class, 'store'])->name('arrangements.pickups.store');
    Route::delete('/arrangements/pickups/{pickup}', [ArrangementPickupsController::class, 'destroy'])->name('arrangements.pickups.destroy');
    Route::post('/arrangements/pickups/{pickup}/release', [ArrangementPickupsController::class, 'release'])->name('arrangements.pickups.release');
    Route::post('/arrangements/pickups/{pickup}/reopen', [ArrangementPickupsController::class, 'reopen'])->name('arrangements.pickups.reopen');

    Route::middleware('role:Administrator|Admin Officer')->group(function () {
        Route::get('/arrangements/schedules', [ArrangementSchedulesController::class, 'index'])->name('arrangements.schedules.index');
        Route::post('/arrangements/schedules', [ArrangementSchedulesController::class, 'store'])->name('arrangements.schedules.store');
        Route::put('/arrangements/schedules/{schedule}', [ArrangementSchedulesController::class, 'update'])->name('arrangements.schedules.update');
        Route::post('/arrangements/schedules/{schedule}/approve', [ArrangementSchedulesController::class, 'approve'])->name('arrangements.schedules.approve');
        Route::post('/arrangements/schedules/{schedule}/reopen', [ArrangementSchedulesController::class, 'reopen'])->name('arrangements.schedules.reopen');
        Route::delete('/arrangements/schedules/{schedule}', [ArrangementSchedulesController::class, 'destroy'])->name('arrangements.schedules.destroy');

        Route::get('/arrangements/batches', [ArrangementBatchesController::class, 'index'])->name('arrangements.batches.index');
        Route::post('/arrangements/batches', [ArrangementBatchesController::class, 'store'])->name('arrangements.batches.store');
        Route::put('/arrangements/batches/{batch}', [ArrangementBatchesController::class, 'update'])->name('arrangements.batches.update');
        Route::post('/arrangements/batches/{batch}/approve', [ArrangementBatchesController::class, 'approve'])->name('arrangements.batches.approve');
        Route::post('/arrangements/batches/{batch}/reopen', [ArrangementBatchesController::class, 'reopen'])->name('arrangements.batches.reopen');
    });

    Route::get('/time-boxing', [TimeBoxingsController::class, 'index'])->middleware('role_or_permission:Administrator|time_boxing.view')->name('time-boxing.index');
    Route::get('/time-boxing/options', [TimeBoxingsController::class, 'options'])->middleware('role_or_permission:Administrator|time_boxing.view')->name('time-boxing.options');
    Route::post('/time-boxing', [TimeBoxingsController::class, 'store'])->middleware('role_or_permission:Administrator|time_boxing.create')->name('time-boxing.store');
    Route::put('/time-boxing/{timeBoxing}', [TimeBoxingsController::class, 'update'])->middleware('role_or_permission:Administrator|time_boxing.update')->name('time-boxing.update');
    Route::delete('/time-boxing/{timeBoxing}', [TimeBoxingsController::class, 'destroy'])->middleware('role_or_permission:Administrator|time_boxing.delete')->name('time-boxing.destroy');

    Route::get('/projects-old', function () {
        return Inertia::render('Projects/Index', [
            'html' => TemplatePage::fragment('project-page.html'),
        ]);
    })->name('projects-old.index');

    Route::get('/contacts', function () {
        return Inertia::render('Contacts/Index', [
            'html' => TemplatePage::fragment('contacts.html'),
        ]);
    })->name('contacts.index');

    Route::get('/kanban', function () {
        return Inertia::render('Kanban/Index', [
            'html' => TemplatePage::fragment('kanban.html'),
        ]);
    })->name('kanban.index');

    Route::get('/calendar', function () {
        return Inertia::render('Calendar/Index', [
            'html' => TemplatePage::fragment('calendar-page.html'),
        ]);
    })->name('calendar.index');

    Route::get('/notifications', [NotificationsController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/{notification}', [NotificationsController::class, 'open'])->name('notifications.open');
    Route::post('/notifications/read-all', [NotificationsController::class, 'readAll'])->name('notifications.read_all');

    Route::get('/messages', [MessagesController::class, 'index'])->name('messages.index');
    Route::get('/messages/{otherUser}', [MessagesController::class, 'show'])->name('messages.show');
    Route::post('/messages', [MessagesController::class, 'store'])->name('messages.store');

    Route::get('/template/{page}', function (string $page) {
        if (! preg_match('/^[a-z0-9-]+$/', $page)) {
            abort(404);
        }

        $file = $page . '.html';
        $html = TemplatePage::fragment($file);

        if ($html === '') {
            abort(404);
        }

        return Inertia::render('Template/Show', [
            'title' => Str::of($page)->replace('-', ' ')->title()->toString(),
            'html' => $html,
            'assets' => TemplatePage::assets($file),
        ]);
    })->name('template.show');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->middleware(['role:Administrator'])->name('profile.update');
    Route::post('/profile/photo', [ProfileController::class, 'updatePhoto'])->name('profile.photo.update');
    Route::delete('/profile/photo', [ProfileController::class, 'destroyPhoto'])->name('profile.photo.destroy');
    Route::get('/profile/photo/{user}', [ProfileController::class, 'photo'])->name('profile.photo');
    Route::delete('/profile', fn () => abort(404))->name('profile.destroy');
});


require __DIR__.'/auth.php';
