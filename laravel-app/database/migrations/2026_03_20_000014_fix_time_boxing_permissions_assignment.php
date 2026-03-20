<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('permissions') || ! Schema::hasTable('roles')) {
            return;
        }

        $perms = [
            'time_boxing.view',
            'time_boxing.create',
            'time_boxing.update',
            'time_boxing.delete',
            'time_boxing_setup.view',
            'time_boxing_setup.create',
            'time_boxing_setup.update',
            'time_boxing_setup.delete',
        ];

        foreach ($perms as $name) {
            Permission::query()->firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $admin = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        $admin->givePermissionTo(...$perms);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // no-op
    }
};
