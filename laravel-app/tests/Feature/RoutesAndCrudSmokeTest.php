<?php

namespace Tests\Feature;

use App\Models\Partner;
use App\Models\TimeBoxing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoutesAndCrudSmokeTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin()
    {
        $user = User::factory()->create();
        $admin = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        $user->syncRoles([$admin]);
        $this->actingAs($user);
        return $user;
    }

    public function test_partners_crud_routes_and_db_updates(): void
    {
        $this->actingAsAdmin();

        $this->get('/partners')->assertStatus(200);

        $resp = $this->post('/partners', [
            'cnc_id' => 'CNC-SMOKE-001',
            'name' => 'Smoke Partner',
            'status' => 'Active',
        ]);
        $resp->assertRedirectToRoute('partners.index');
        $this->assertDatabaseHas('partners', ['cnc_id' => 'CNC-SMOKE-001', 'name' => 'Smoke Partner']);

        $partner = Partner::query()->where('cnc_id', 'CNC-SMOKE-001')->firstOrFail();
        $resp = $this->put("/partners/{$partner->id}", [
            'cnc_id' => 'CNC-SMOKE-001',
            'name' => 'Smoke Partner Updated',
            'status' => 'Active',
        ]);
        $resp->assertRedirectToRoute('partners.index');
        $this->assertDatabaseHas('partners', ['id' => $partner->id, 'name' => 'Smoke Partner Updated']);

        $resp = $this->delete("/partners/{$partner->id}");
        $resp->assertRedirectToRoute('partners.index');
        $this->assertDatabaseMissing('partners', ['id' => $partner->id]);
    }

    public function test_projects_crud_routes_and_db_updates(): void
    {
        $this->actingAsAdmin();

        // Seed minimal setup options
        DB::table('project_setup_options')->insert([
            ['category' => 'type', 'name' => 'Maintenance', 'status' => 'Active'],
            ['category' => 'status', 'name' => 'Scheduled', 'status' => 'Active'],
        ]);

        $this->get('/projects')->assertStatus(200);

        $resp = $this->post('/projects', [
            'project_information' => 'Submission',
            'pic_assignment' => 'Request',
            'type' => 'Maintenance',
            'status' => 'Scheduled',
        ]);
        $resp->assertRedirectToRoute('projects.index');
        $this->assertDatabaseHas('projects', ['type' => 'Maintenance', 'status' => 'Scheduled']);

        $project = DB::table('projects')->orderByDesc('id')->first();
        $resp = $this->put("/projects/{$project->id}", [
            'project_information' => 'Submission',
            'pic_assignment' => 'Request',
            'type' => 'Maintenance',
            'status' => 'Scheduled',
            'project_name' => 'Smoke Project',
        ]);
        $resp->assertRedirectToRoute('projects.index');
        $this->assertDatabaseHas('projects', ['id' => $project->id, 'project_name' => 'Smoke Project']);

        $resp = $this->delete("/projects/{$project->id}");
        $resp->assertRedirectToRoute('projects.index');
        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_time_boxing_crud_routes_and_db_updates(): void
    {
        $this->actingAsAdmin();

        // Seed minimal setup options
        DB::table('time_boxing_setup_options')->insert([
            ['category' => 'type', 'name' => 'General', 'status' => 'Active'],
        ]);

        $this->get('/time-boxing')->assertStatus(200);

        $resp = $this->post('/time-boxing', [
            'information_date' => now()->toDateString(),
            'type' => 'General',
            'priority' => 'Normal',
            'status' => 'Brain Dump',
            'description' => 'Smoke create',
        ]);
        $resp->assertStatus(302);
        $this->assertDatabaseHas('time_boxings', ['description' => 'Smoke create']);

        $tb = TimeBoxing::query()->orderByDesc('id')->firstOrFail();
        $resp = $this->put("/time-boxing/{$tb->id}", [
            'information_date' => now()->toDateString(),
            'type' => 'General',
            'priority' => 'Normal',
            'status' => 'Priority List',
            'description' => 'Smoke update',
        ]);
        $resp->assertStatus(302);
        $this->assertDatabaseHas('time_boxings', ['id' => $tb->id, 'description' => 'Smoke update', 'status' => 'Priority List']);

        $resp = $this->delete("/time-boxing/{$tb->id}");
        $resp->assertStatus(302);
        $this->assertDatabaseMissing('time_boxings', ['id' => $tb->id]);
    }

    public function test_audit_logs_route_available(): void
    {
        $this->actingAsAdmin();
        $this->get('/audit-logs')->assertStatus(200);
    }
}
