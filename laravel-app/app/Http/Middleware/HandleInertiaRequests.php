<?php

namespace App\Http\Middleware;

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
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
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
                'user' => $request->user(),
            ],
        ];
    }
}
