<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TimeBoxingPermissionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_administrator_can_access_tables_pages(): void
    {
        $user = User::factory()->create();
        $adminRole = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        $user->syncRoles([$adminRole]);

        $this->actingAs($user)
            ->get('/tables/time-boxing')
            ->assertStatus(200);

        $this->actingAs($user)
            ->get('/tables/time-boxing-setup')
            ->assertStatus(200);

        $this->actingAs($user)
            ->get('/tables/project-setup')
            ->assertStatus(200);
    }
}
