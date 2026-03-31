<?php

namespace Tests\Feature;

use App\Models\ArrangementBatch;
use App\Models\ArrangementSchedule;
use App\Models\ArrangementSchedulePickup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ArrangementTest extends TestCase
{
    use RefreshDatabase;

    public function test_arrangement_manage_pages_are_restricted_to_administrator_or_admin_officer(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/arrangements')->assertStatus(200);
        $this->actingAs($user)->get('/arrangements/schedules')->assertStatus(403);
        $this->actingAs($user)->get('/arrangements/batches')->assertStatus(403);

        $admin = User::factory()->create();
        $adminRole = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        $admin->syncRoles([$adminRole]);

        $this->actingAs($admin)->get('/arrangements/schedules')->assertStatus(200);
        $this->actingAs($admin)->get('/arrangements/batches')->assertStatus(200);

        $officer = User::factory()->create();
        $officerRole = Role::query()->firstOrCreate(['name' => 'Admin Officer', 'guard_name' => 'web']);
        $officer->syncRoles([$officerRole]);

        $this->actingAs($officer)->get('/arrangements/schedules')->assertStatus(200);
        $this->actingAs($officer)->get('/arrangements/batches')->assertStatus(200);
    }

    public function test_pickup_respects_count_and_batch_requirement_points_and_release_rules(): void
    {
        $batch = ArrangementBatch::query()->create([
            'name' => 'Batch A',
            'requirement_points' => 2,
            'created_by' => 1,
        ]);

        $schedule = ArrangementSchedule::query()->create([
            'batch_id' => $batch->id,
            'schedule_type' => 'Middle',
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-05',
            'count' => 1,
            'status' => 'Publish',
            'created_by' => 1,
        ]);

        $tier3 = User::factory()->create(['tier' => 'Tier 3']);
        $this->actingAs($tier3)
            ->post("/arrangements/schedules/{$schedule->id}/pickups")
            ->assertStatus(422);

        $tier1 = User::factory()->create(['tier' => 'Tier 1']);
        $this->actingAs($tier1)
            ->post("/arrangements/schedules/{$schedule->id}/pickups")
            ->assertStatus(302);

        $this->assertDatabaseHas('arrangement_schedule_pickups', [
            'schedule_id' => $schedule->id,
            'user_id' => $tier1->id,
            'points' => 1,
        ]);

        $tier2 = User::factory()->create(['tier' => 'Tier 2']);
        $this->actingAs($tier2)
            ->post("/arrangements/schedules/{$schedule->id}/pickups")
            ->assertStatus(422);

        $pickup = ArrangementSchedulePickup::query()->where('schedule_id', $schedule->id)->where('user_id', $tier1->id)->firstOrFail();

        $schedule->forceFill(['status' => 'Approved'])->save();

        $this->actingAs($tier1)
            ->delete("/arrangements/pickups/{$pickup->id}")
            ->assertStatus(403);

        $admin = User::factory()->create();
        $adminRole = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        $admin->syncRoles([$adminRole]);

        $this->actingAs($admin)
            ->delete("/arrangements/pickups/{$pickup->id}")
            ->assertStatus(302);
    }

    public function test_create_schedule_count_creates_duplicate_schedules(): void
    {
        $admin = User::factory()->create();
        $adminRole = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        $admin->syncRoles([$adminRole]);

        $this->actingAs($admin)
            ->post('/arrangements/schedules', [
                'batch_id' => null,
                'schedule_type' => 'Middle',
                'note' => '',
                'start_date' => '2026-04-01',
                'end_date' => '2026-04-05',
                'count' => 2,
                'status' => 'Publish',
            ])
            ->assertStatus(302);

        $this->assertSame(2, ArrangementSchedule::query()
            ->where('schedule_type', 'Middle')
            ->whereDate('start_date', '2026-04-01')
            ->whereDate('end_date', '2026-04-05')
            ->count());

        $this->assertSame(2, ArrangementSchedule::query()
            ->where('schedule_type', 'Middle')
            ->whereDate('start_date', '2026-04-01')
            ->whereDate('end_date', '2026-04-05')
            ->where('count', 1)
            ->count());
    }
}
