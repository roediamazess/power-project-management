<?php

namespace App\Http\Middleware;

use App\Models\SiteMessage;
use App\Models\SiteNotification;
use App\Models\ReleaseNote;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        $manifest = public_path('build/manifest.json');
        if (file_exists($manifest)) {
            return md5_file($manifest) ?: parent::version($request);
        }
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $roles = $user ? $user->roles()->pluck('name')->values()->all() : [];

        return [
            ...parent::share($request),
            'releaseNotes' => fn () => ReleaseNote::query()
                ->orderByDesc('released_on')
                ->orderByDesc('id')
                ->get()
                ->map(fn (ReleaseNote $n) => [
                    'version' => $n->version,
                    'date' => $n->released_on?->toDateString(),
                    'sections' => $n->data['sections'] ?? [],
                ])
                ->values(),
            'auth' => [
                'user' => $user,
                'roles' => $roles,
            ],
            'unreadNotificationsCount' => fn () => $user
                ? SiteNotification::query()->where('user_id', $user->id)->whereNull('read_at')->count()
                : 0,
            'headerNotifications' => fn () => $user
                ? SiteNotification::query()
                    ->where('user_id', $user->id)
                    ->orderByDesc('created_at')
                    ->limit(10)
                    ->get(['id', 'type', 'title', 'body', 'url', 'read_at', 'created_at'])
                    ->map(fn (SiteNotification $n) => [
                        'id' => $n->id,
                        'type' => $n->type,
                        'title' => $n->title,
                        'body' => $n->body,
                        'url' => $n->url,
                        'read_at' => $n->read_at?->toISOString(),
                        'created_at' => $n->created_at?->toISOString(),
                    ])
                    ->values()
                : [],
            'unreadMessagesCount' => fn () => $user
                ? SiteMessage::query()->where('recipient_id', $user->id)->whereNull('read_at')->count()
                : 0,
        ];
    }
}
