<?php

namespace App\Http\Middleware;

use App\Support\PermissionCatalog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Database\Seeders\ReleaseNotesSeeder;

class EnsureCorePermissions
{
    public function handle(Request $request, Closure $next)
    {
        try {
            Cache::remember('core_permissions_seeded_v2', now()->addHours(6), function () {
                if (! Schema::hasTable('permissions') || ! Schema::hasTable('roles')) {
                    return true;
                }

                foreach (PermissionCatalog::allPermissionKeys() as $name) {
                    Permission::query()->firstOrCreate(['name' => $name, 'guard_name' => 'web']);
                }

                $admin = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
                $admin->syncPermissions(PermissionCatalog::allPermissionKeys());

                return true;
            });
            Cache::remember('core_release_notes_seeded_v1', now()->addHours(6), function () {
                if (! Schema::hasTable('release_notes')) {
                    return true;
                }

                if (\App\Models\ReleaseNote::query()->exists()) {
                    return true;
                }

                (new ReleaseNotesSeeder())->run();

                return true;
            });

        } catch (\Throwable $e) {
        }

        return $next($request);
    }
}
