<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Buat user admin dummy untuk relasi created_by
        $adminId = DB::table('users')->insertGetId([
            'role' => 'admin',
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('schedules')->insert([
            [
                'title' => 'Morning Maintenance',
                'description' => 'Routine power system check.',
                'period_start' => Carbon::now()->addDay()->setTime(8, 0),
                'period_end' => Carbon::now()->addDay()->setTime(10, 0),
                'status' => 'available',
                'assigned_to' => null,
                'created_by' => $adminId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Afternoon Upgrade',
                'description' => 'Transformer upgrade in sector B.',
                'period_start' => Carbon::now()->addDays(2)->setTime(13, 0),
                'period_end' => Carbon::now()->addDays(2)->setTime(16, 30),
                'status' => 'available',
                'assigned_to' => null,
                'created_by' => $adminId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Emergency Backup Test',
                'description' => 'Testing backup generators.',
                'period_start' => Carbon::now()->addDays(3)->setTime(20, 0),
                'period_end' => Carbon::now()->addDays(3)->setTime(22, 0),
                'status' => 'available',
                'assigned_to' => null,
                'created_by' => $adminId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
