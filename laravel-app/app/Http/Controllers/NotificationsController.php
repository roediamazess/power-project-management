<?php

namespace App\Http\Controllers;

use App\Models\SiteNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationsController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $notifications = SiteNotification::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate(50)
            ->withQueryString()
            ->through(fn (SiteNotification $n) => [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'body' => $n->body,
                'url' => $n->url,
                'read_at' => $n->read_at?->toISOString(),
                'created_at' => $n->created_at?->toISOString(),
            ]);

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    public function open(Request $request, SiteNotification $notification): RedirectResponse
    {
        $user = $request->user();
        if ((int) $notification->user_id !== (int) $user->id) {
            abort(403);
        }

        if (! $notification->read_at) {
            $notification->forceFill(['read_at' => now()])->save();
        }

        return redirect()->to($notification->url ?: route('notifications.index'));
    }

    public function readAll(Request $request): RedirectResponse
    {
        $user = $request->user();
        SiteNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return back();
    }
}

