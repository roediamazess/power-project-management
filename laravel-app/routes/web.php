<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\BackupsController;
use App\Http\Controllers\Tables\UserManagementController;
use App\Http\Controllers\Tables\PartnersController;
use App\Http\Controllers\Tables\PartnerSetupController;
use App\Http\Controllers\Tables\ProjectsController;
use App\Http\Controllers\Tables\ProjectSetupController;
use App\Http\Controllers\Tables\AuditLogsController;
use App\Http\Controllers\Tables\TimeBoxingSetupController;
use App\Http\Controllers\Tables\TimeBoxingsController;
use App\Support\TemplatePage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
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

    Route::get('/messages', function () {
        return Inertia::render('Messages/Index', [
            'html' => TemplatePage::fragment('message.html'),
        ]);
    })->name('messages.index');

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

Route::middleware(['auth'])->group(function () {
    Route::get('/backups', [App\Http\Controllers\BackupsController::class, 'index'])->name('backups.index');
});
