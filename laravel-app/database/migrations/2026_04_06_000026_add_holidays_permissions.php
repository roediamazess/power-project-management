<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('permissions') || ! Schema::hasTable('roles')) {
            return;
        }

        $keys = [
            'holidays.view',
            'holidays.create',
            'holidays.update',
            'holidays.delete',
        ];

        $perms = [];
        foreach ($keys as $key) {
            $perms[] = Permission::query()->firstOrCreate(['name' => $key, 'guard_name' => 'web']);
        }

        $admin = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        foreach ($perms as $perm) {
            if (! $admin->hasPermissionTo($perm)) {
                $admin->givePermissionTo($perm);
            }
        }
    }

    public function down(): void
    {
        // no-op
    }
};
