<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserRolesSeeder::class,
            UsStatesSeeder::class,
            EmailTemplateSeeder::class,
            // Event types + carrier rates + per-rate state coverage (legacy import).
            // Supersedes EventTypeSeeder (which only seeded a handful of types).
            EventPricingSeeder::class,
        ]);
    }
}
