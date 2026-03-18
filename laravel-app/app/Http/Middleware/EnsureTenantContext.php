<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user && $user->tenant_id) {
            $tenant = Tenant::query()->find($user->tenant_id);
            if ($tenant) {
                app()->instance('tenant', $tenant);
            }
        }

        return $next($request);
    }
}
