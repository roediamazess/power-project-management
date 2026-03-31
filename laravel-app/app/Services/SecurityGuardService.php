<?php

namespace App\Services;

use App\Models\SecurityEvent;
use Illuminate\Http\Request;

class SecurityGuardService
{
    public function record(Request $request, string $reason, string $severity = 'medium', string $category = 'request', array $meta = []): void
    {
        try {
            SecurityEvent::query()->create([
                'severity' => $severity,
                'category' => $category,
                'user_id' => $request->user()?->id,
                'ip' => $request->ip(),
                'method' => $request->method(),
                'path' => '/' . ltrim($request->path(), '/'),
                'query' => $request->getQueryString(),
                'user_agent' => $request->userAgent(),
                'reason' => $reason,
                'meta' => $meta,
            ]);
        } catch (\Throwable) {
        }
    }

    public function detectRequestThreat(Request $request): ?array
    {
        $path = '/' . ltrim($request->path(), '/');
        $lowerPath = strtolower($path);
        $qs = (string) $request->getQueryString();
        $lower = strtolower($lowerPath . ' ' . $qs);

        $highPaths = [
            '/.env',
            '/wp-admin',
            '/wp-login.php',
            '/xmlrpc.php',
            '/vendor/phpunit',
            '/phpmyadmin',
            '/pma',
            '/adminer.php',
        ];

        foreach ($highPaths as $p) {
            if ($lowerPath === $p || str_starts_with($lowerPath, $p . '/')) {
                return ['severity' => 'high', 'reason' => 'Suspicious path access: ' . $path];
            }
        }

        $needles = [
            'union select',
            'sleep(',
            'benchmark(',
            '../../',
            '../',
            '<script',
            'onerror=',
            'onload=',
            'or 1=1',
            "' or '1'='1",
            'information_schema',
        ];

        foreach ($needles as $n) {
            if ($n !== '' && str_contains($lower, $n)) {
                return ['severity' => 'medium', 'reason' => 'Suspicious query pattern detected'];
            }
        }

        return null;
    }
}

