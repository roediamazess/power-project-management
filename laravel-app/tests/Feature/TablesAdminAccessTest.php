<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TablesAdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_all_tables_pages(): void
    {
        $user = User::factory()->create();
        $admin = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        $user->syncRoles([$admin]);
        $this->actingAs($user);

        $this->get('/tables/user-management')->assertStatus(200);
        $this->get('/tables/partners')->assertStatus(200);
        $this->get('/tables/partner-setup')->assertStatus(200);
        $this->get('/tables/projects')->assertStatus(200);
        $this->get('/tables/project-setup')->assertStatus(200);
        $this->get('/tables/time-boxing')->assertStatus(200);
        $this->get('/tables/time-boxing-setup')->assertStatus(200);
        $this->get('/tables/audit-logs')->assertStatus(200);
    }
}

