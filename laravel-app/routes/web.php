<?php

use App\Http\Controllers\ProfileController;
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
    Route::get('/projects', function () {
        return Inertia::render('Projects/Index', [
            'html' => TemplatePage::fragment('project-page.html'),
        ]);
    })->name('projects.index');

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
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
