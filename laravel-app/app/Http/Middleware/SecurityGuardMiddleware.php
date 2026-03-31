<?php

namespace App\Http\Middleware;

use App\Services\SecurityGuardService;
use App\Services\TelegramService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class SecurityGuardMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $svc = app(SecurityGuardService::class);
        $hit = $svc->detectRequestThreat($request);
        if (is_array($hit) && ($hit['reason'] ?? null)) {
            $severity = (string) ($hit['severity'] ?? 'medium');
            $svc->record($request, (string) $hit['reason'], $severity, 'request');
            if ($severity === 'high') {
                $key = 'tg:security:' . sha1((string) $request->ip() . '|' . (string) $request->path() . '|' . (string) ($hit['reason'] ?? ''));
                if (Cache::add($key, '1', now()->addMinutes(10))) {
                    $msg = "[Guardian] SECURITY ALERT\n";
                    $msg .= (string) ($hit['reason'] ?? 'Suspicious request') . "\n";
                    $msg .= 'IP: ' . (string) $request->ip() . "\n";
                    $msg .= 'Path: /' . ltrim((string) $request->path(), '/') . "\n";
                    $qs = (string) $request->getQueryString();
                    if ($qs !== '') $msg .= 'Query: ' . $qs . "\n";
                    $ua = (string) $request->userAgent();
                    if ($ua !== '') $msg .= 'UA: ' . $ua;
                    app(TelegramService::class)->sendMessage($msg);
                }
                return response('', 404);
            }
        }

        return $next($request);
    }
}
