<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $defaultTenant = Tenant::query()->firstOrCreate(
            ['slug' => 'default'],
            ['name' => 'Default Tenant']
        );

        foreach (['super-admin', 'tenant-admin', 'member', 'external-client'] as $roleName) {
            Role::query()->firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'web'],
                ['name' => $roleName, 'guard_name' => 'web']
            );
        }

        $adminEmail = env('SEED_ADMIN_EMAIL');
        $adminPassword = env('SEED_ADMIN_PASSWORD');

        if ($adminEmail && $adminPassword) {
            $admin = User::query()->firstOrCreate(
                ['email' => $adminEmail],
                [
                    'tenant_id' => $defaultTenant->id,
                    'is_internal' => true,
                    'name' => 'Admin',
                    'password' => Hash::make($adminPassword),
                    'email_verified_at' => now(),
                ]
            );

            if (! $admin->hasRole('super-admin')) {
                $admin->assignRole('super-admin');
            }
        }
    }
}
