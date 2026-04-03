<?php

namespace App\Providers;

use App\Models\AuthEvent;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\Filesystem;
use Masbug\Flysystem\GoogleDriveAdapter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        try {
            Storage::extend('google', function ($app, $config) {
                $client = new \Google\Client();
                $client->setClientId($config['clientId'] ?? '');
                $client->setClientSecret($config['clientSecret'] ?? '');
                
                // Set the refresh token if available
                if (!empty($config['refreshToken'])) {
                    $token = $client->fetchAccessTokenWithRefreshToken($config['refreshToken']);
                    if (is_array($token) && isset($token['error'])) {
                        throw new \RuntimeException('Google Drive auth error: ' . ($token['error'] ?? 'unknown'));
                    }
                }

                $service = new \Google\Service\Drive($client);
                $adapter = new GoogleDriveAdapter($service, $config['folder'] ?? '/', $config);

                return new \Illuminate\Filesystem\FilesystemAdapter(
                    new \League\Flysystem\Filesystem($adapter, $config),
                    $adapter,
                    $config
                );
            });
        } catch (\Exception $e) {
            // Silently fail if Google Client is not yet fully configured in .env
        }

        Event::listen(Login::class, function (Login $event) {
            $req = app(Request::class);
            AuthEvent::query()->create([
                'type' => 'login',
                'user_id' => $event->user?->id,
                'email' => $event->user?->email,
                'ip' => $req->ip(),
                'user_agent' => $req->userAgent(),
                'meta' => [
                    'guard' => $event->guard,
                    'remember' => (bool) $event->remember,
                ],
            ]);
        });

        Event::listen(Logout::class, function (Logout $event) {
            $req = app(Request::class);
            AuthEvent::query()->create([
                'type' => 'logout',
                'user_id' => $event->user?->id,
                'email' => $event->user?->email,
                'ip' => $req->ip(),
                'user_agent' => $req->userAgent(),
                'meta' => [
                    'guard' => $event->guard,
                ],
            ]);
        });

        Event::listen(Failed::class, function (Failed $event) {
            $req = app(Request::class);
            $user = $event->user;
            AuthEvent::query()->create([
                'type' => 'failed',
                'user_id' => $user?->id,
                'email' => $user?->email ?? (is_array($event->credentials ?? null) ? ($event->credentials['email'] ?? null) : null),
                'ip' => $req->ip(),
                'user_agent' => $req->userAgent(),
                'meta' => [
                    'guard' => $event->guard,
                ],
            ]);
        });

        Event::listen(Lockout::class, function (Lockout $event) {
            $req = app(Request::class);
            AuthEvent::query()->create([
                'type' => 'lockout',
                'user_id' => null,
                'email' => null,
                'ip' => $req->ip(),
                'user_agent' => $req->userAgent(),
                'meta' => [
                    'url' => $req->fullUrl(),
                ],
            ]);
        });
    }
}
