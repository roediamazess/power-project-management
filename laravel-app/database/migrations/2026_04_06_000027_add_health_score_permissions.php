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
            'health_score.view',
            'health_score.create',
            'health_score.update',
            'health_score.delete',
            'health_score.submit',
            'health_score.template.manage',
        ];

        foreach ($perms as $name) {
            Permission::query()->firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $admin = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        $adminOfficer = Role::query()->firstOrCreate(['name' => 'Admin Officer', 'guard_name' => 'web']);

        $admin->givePermissionTo(...$perms);
        $adminOfficer->givePermissionTo(...$perms);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // no-op
    }
};

