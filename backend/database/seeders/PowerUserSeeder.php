<?php

namespace Database\Seeders;

use App\Models\PowerUser;
use Illuminate\Database\Seeder;

class PowerUserSeeder extends Seeder
{
    public function run(): void
    {
        $seeds = [
            ['username' => 'admin', 'password' => 'admin123', 'role' => 'admin', 'tier' => 'admin', 'point' => 0],
            ['username' => 'Komeng', 'password' => 'pass123', 'role' => 'admin', 'tier' => 'admin', 'point' => 0],
            ['username' => 'Akbar', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Aldi', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_2', 'point' => 2],
            ['username' => 'Andreas', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_1', 'point' => 1],
            ['username' => 'Apip', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Apri', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Arbi', 'password' => 'pass123', 'role' => 'team', 'tier' => 'new_born', 'point' => 1],
            ['username' => 'Aris', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_2', 'point' => 2],
            ['username' => 'Basir', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Bowo', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Danang', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Dhani', 'password' => 'pass123', 'role' => 'team', 'tier' => 'new_born', 'point' => 1],
            ['username' => 'Dhika', 'password' => 'pass123', 'role' => 'team', 'tier' => 'new_born', 'point' => 1],
            ['username' => 'Fachri', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Farhan', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_1', 'point' => 1],
            ['username' => 'Hanip', 'password' => 'pass123', 'role' => 'team', 'tier' => 'new_born', 'point' => 1],
            ['username' => 'Hasbi', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Ichsan', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Ichwan', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Ilham', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Imam', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Indra', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Iqhtiar', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_1', 'point' => 1],
            ['username' => 'Ivan', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Jaja', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Lifi', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_1', 'point' => 1],
            ['username' => 'Mamat', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Mulya', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Naufal', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_2', 'point' => 2],
            ['username' => 'Prad', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_1', 'point' => 1],
            ['username' => 'Rafly', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_1', 'point' => 1],
            ['username' => 'Rama', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Rey', 'password' => 'pass123', 'role' => 'team', 'tier' => 'new_born', 'point' => 1],
            ['username' => 'Ridho', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_1', 'point' => 1],
            ['username' => 'Ridwan', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Rizky', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_2', 'point' => 2],
            ['username' => 'Robi', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Sahrul', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Sodik', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Vincent', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Wahyudi', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_1', 'point' => 1],
            ['username' => 'Widi', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Yosa', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
            ['username' => 'Yudi', 'password' => 'pass123', 'role' => 'team', 'tier' => 'tier_3', 'point' => 3],
        ];

        foreach ($seeds as $row) {
            PowerUser::firstOrCreate(
                ['username' => $row['username']],
                $row
            );
        }
    }
}
