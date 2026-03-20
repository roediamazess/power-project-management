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

        $perm = Permission::query()->firstOrCreate(['name' => 'audit_logs.view', 'guard_name' => 'web']);

        $admin = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        if (! $admin->hasPermissionTo($perm)) {
            $admin->givePermissionTo($perm);
        }
    }

    public function down(): void
    {
        // no-op
    }
};
