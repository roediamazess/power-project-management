<?php

namespace Tests\Feature;

use App\Models\ArrangementBatch;
use App\Models\ArrangementJobsheetEntry;
use App\Models\ArrangementJobsheetPeriod;
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
            'min_requirement_points' => 0,
            'max_requirement_points' => 2,
            'status' => 'Approved',
            'created_by' => 1,
        ]);

        $schedule = ArrangementSchedule::query()->create([
            'batch_id' => $batch->id,
            'schedule_type' => 'Middle',
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-05',
            'count' => 1,
            'status' => 'Batched',
            'created_by' => 1,
        ]);

        $tier3 = User::factory()->create(['tier' => 'Tier 3']);
        $this->actingAs($tier3)
            ->post("/arrangements/schedules/{$schedule->id}/pickups")
            ->assertStatus(302)
            ->assertSessionHasErrors();

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
            ->assertStatus(302)
            ->assertSessionHasErrors();

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
            ->assertStatus(302)
            ->assertSessionHasErrors();
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

    public function test_batch_approve_locks_updates_until_reopen(): void
    {
        $admin = User::factory()->create();
        $adminRole = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        $admin->syncRoles([$adminRole]);

        $batch = ArrangementBatch::query()->create([
            'name' => 'Batch Lock',
            'requirement_points' => 10,
            'min_requirement_points' => 3,
            'max_requirement_points' => 10,
            'status' => 'Open',
            'pickup_start_at' => now()->subDay(),
            'pickup_end_at' => now()->addDay(),
            'created_by' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->post("/arrangements/batches/{$batch->id}/approve")
            ->assertStatus(302);

        $this->actingAs($admin)
            ->put("/arrangements/batches/{$batch->id}", [
                'name' => 'Batch Lock Updated',
                'min_requirement_points' => 1,
                'max_requirement_points' => 10,
                'pickup_start_at' => now('Asia/Jakarta')->format('Y-m-d\\TH:i'),
                'pickup_end_at' => now('Asia/Jakarta')->addDay()->format('Y-m-d\\TH:i'),
                'schedule_ids' => [],
            ])
            ->assertStatus(302)
            ->assertSessionHasErrors();

        $this->actingAs($admin)
            ->post("/arrangements/batches/{$batch->id}/reopen")
            ->assertStatus(302);

        $this->actingAs($admin)
            ->put("/arrangements/batches/{$batch->id}", [
                'name' => 'Batch Lock Updated',
                'min_requirement_points' => 1,
                'max_requirement_points' => 10,
                'pickup_start_at' => now('Asia/Jakarta')->format('Y-m-d\\TH:i'),
                'pickup_end_at' => now('Asia/Jakarta')->addDay()->format('Y-m-d\\TH:i'),
                'schedule_ids' => [],
            ])
            ->assertStatus(302);
    }

    public function test_pickup_can_release_and_reopen_and_cancel_pickup_rules(): void
    {
        $batch = ArrangementBatch::query()->create([
            'name' => 'Batch Pickup Flow',
            'requirement_points' => 2,
            'min_requirement_points' => 0,
            'max_requirement_points' => 2,
            'status' => 'Approved',
            'pickup_start_at' => now()->subHour(),
            'pickup_end_at' => now()->addHour(),
            'created_by' => 1,
        ]);

        $schedule = ArrangementSchedule::query()->create([
            'batch_id' => $batch->id,
            'schedule_type' => 'Middle',
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-05',
            'count' => 1,
            'status' => 'Batched',
            'created_by' => 1,
        ]);

        $tier1 = User::factory()->create(['tier' => 'Tier 1']);

        $this->actingAs($tier1)
            ->post("/arrangements/schedules/{$schedule->id}/pickups")
            ->assertStatus(302);

        $pickup = ArrangementSchedulePickup::query()
            ->where('schedule_id', $schedule->id)
            ->where('user_id', $tier1->id)
            ->firstOrFail();

        $this->actingAs($tier1)
            ->post("/arrangements/pickups/{$pickup->id}/release")
            ->assertStatus(302);

        $this->assertDatabaseHas('arrangement_schedule_pickups', [
            'id' => $pickup->id,
            'status' => 'Released',
        ]);

        $this->actingAs($tier1)
            ->delete("/arrangements/pickups/{$pickup->id}")
            ->assertStatus(302)
            ->assertSessionHasErrors();

        $this->actingAs($tier1)
            ->post("/arrangements/pickups/{$pickup->id}/reopen")
            ->assertStatus(302);

        $this->assertDatabaseHas('arrangement_schedule_pickups', [
            'id' => $pickup->id,
            'status' => 'Picked',
        ]);

        $this->actingAs($tier1)
            ->delete("/arrangements/pickups/{$pickup->id}")
            ->assertStatus(302);
    }

    public function test_pickup_cannot_overlap_date_range_with_existing_pickup(): void
    {
        $batch = ArrangementBatch::query()->create([
            'name' => 'Batch Overlap',
            'requirement_points' => 10,
            'min_requirement_points' => 0,
            'max_requirement_points' => 10,
            'status' => 'Approved',
            'pickup_start_at' => now()->subHour(),
            'pickup_end_at' => now()->addHour(),
            'created_by' => 1,
        ]);

        $s1 = ArrangementSchedule::query()->create([
            'batch_id' => $batch->id,
            'schedule_type' => 'Middle',
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-08',
            'count' => 1,
            'status' => 'Batched',
            'created_by' => 1,
        ]);

        $s2 = ArrangementSchedule::query()->create([
            'batch_id' => $batch->id,
            'schedule_type' => 'Duty',
            'start_date' => '2026-04-08',
            'end_date' => '2026-04-10',
            'count' => 1,
            'status' => 'Batched',
            'created_by' => 1,
        ]);

        $user = User::factory()->create(['tier' => 'Tier 1']);

        $this->actingAs($user)
            ->post("/arrangements/schedules/{$s1->id}/pickups")
            ->assertStatus(302);

        $this->actingAs($user)
            ->post("/arrangements/schedules/{$s2->id}/pickups")
            ->assertStatus(302)
            ->assertSessionHasErrors();
    }

    public function test_admin_approve_requires_release_and_cancel_approved_unlocks_pic(): void
    {
        $admin = User::factory()->create();
        $adminRole = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        $admin->syncRoles([$adminRole]);

        $batch = ArrangementBatch::query()->create([
            'name' => 'Batch Approve Flow',
            'requirement_points' => 2,
            'min_requirement_points' => 0,
            'max_requirement_points' => 2,
            'status' => 'Approved',
            'pickup_start_at' => now()->subHour(),
            'pickup_end_at' => now()->addHour(),
            'created_by' => $admin->id,
        ]);

        $schedule = ArrangementSchedule::query()->create([
            'batch_id' => $batch->id,
            'schedule_type' => 'Middle',
            'start_date' => '2026-04-06',
            'end_date' => '2026-04-08',
            'count' => 1,
            'status' => 'Batched',
            'created_by' => $admin->id,
        ]);

        $pic = User::factory()->create(['tier' => 'Tier 1']);

        $this->actingAs($pic)
            ->post("/arrangements/schedules/{$schedule->id}/pickups")
            ->assertStatus(302);

        $schedule->refresh();
        $this->assertSame('Picked Up', $schedule->status);

        $this->actingAs($admin)
            ->post("/arrangements/schedules/{$schedule->id}/approve")
            ->assertStatus(302)
            ->assertSessionHasErrors();

        $pickup = ArrangementSchedulePickup::query()
            ->where('schedule_id', $schedule->id)
            ->where('user_id', $pic->id)
            ->firstOrFail();

        $this->actingAs($pic)
            ->post("/arrangements/pickups/{$pickup->id}/release")
            ->assertStatus(302);

        $schedule->refresh();
        $this->assertSame('Released', $schedule->status);

        $this->actingAs($admin)
            ->post("/arrangements/schedules/{$schedule->id}/approve")
            ->assertStatus(302);

        $schedule->refresh();
        $this->assertSame('Approved', $schedule->status);

        $this->actingAs($pic)
            ->post("/arrangements/pickups/{$pickup->id}/reopen")
            ->assertStatus(403);

        $this->actingAs($admin)
            ->post("/arrangements/schedules/{$schedule->id}/reopen")
            ->assertStatus(302);

        $schedule->refresh();
        $this->assertSame('Released', $schedule->status);

        $this->actingAs($pic)
            ->post("/arrangements/pickups/{$pickup->id}/reopen")
            ->assertStatus(302);
    }

    public function test_jobsheet_manual_entry_is_restricted_and_persists_to_database(): void
    {
        $admin = User::factory()->create();
        $adminRole = Role::query()->firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web']);
        $admin->syncRoles([$adminRole]);

        $pic = User::factory()->create();

        $period = ArrangementJobsheetPeriod::query()->create([
            'name' => 'Periode Test',
            'start_date' => '2026-04-01',
            'end_date' => '2026-04-07',
            'created_by' => $admin->id,
        ]);

        $payload = [
            'period_id' => $period->id,
            'user_id' => $pic->id,
            'start_date' => '2026-04-03',
            'end_date' => '2026-04-05',
            'code' => 'D.OT',
        ];

        $this->actingAs($pic)
            ->post('/arrangements/jobsheet/entries', $payload)
            ->assertStatus(403);

        $this->actingAs($admin)
            ->post('/arrangements/jobsheet/entries', $payload)
            ->assertStatus(302);

        $this->assertSame(3, ArrangementJobsheetEntry::query()->where('period_id', $period->id)->count());

        $this->actingAs($pic)
            ->post('/arrangements/jobsheet/entries/clear', [
                'period_id' => $period->id,
                'user_id' => $pic->id,
                'start_date' => '2026-04-03',
                'end_date' => '2026-04-05',
            ])
            ->assertStatus(403);

        $this->actingAs($admin)
            ->post('/arrangements/jobsheet/entries/clear', [
                'period_id' => $period->id,
                'user_id' => $pic->id,
                'start_date' => '2026-04-03',
                'end_date' => '2026-04-05',
            ])
            ->assertStatus(302);

        $this->assertSame(0, ArrangementJobsheetEntry::query()->where('period_id', $period->id)->count());
    }
}
