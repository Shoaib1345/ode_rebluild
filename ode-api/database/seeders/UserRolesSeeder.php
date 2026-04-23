<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserRolesSeeder extends Seeder
{
    /**
     * Maps to legacy access_level values:
     *   0 = super_admin, 1 = admin, 2 = staff,
     *   5 = customer, 6 = affiliate, 7 = agent, 8 = planner/venue
     */
    public function run(): void
    {
        $roles = [
            ['id' => 1, 'role_name' => 'Super Admin',   'access_level' => 0],
            ['id' => 2, 'role_name' => 'Admin',         'access_level' => 1],
            ['id' => 3, 'role_name' => 'Staff',         'access_level' => 2],
            ['id' => 4, 'role_name' => 'Customer',      'access_level' => 5],
            ['id' => 5, 'role_name' => 'Affiliate',     'access_level' => 6],
            ['id' => 6, 'role_name' => 'Agent',         'access_level' => 7],
            ['id' => 7, 'role_name' => 'Planner/Venue', 'access_level' => 8],
        ];

        $now = now();
        foreach ($roles as &$role) {
            $role['created_at'] = $now;
            $role['updated_at'] = $now;
        }

        DB::table('user_roles')->insertOrIgnore($roles);
    }
}
