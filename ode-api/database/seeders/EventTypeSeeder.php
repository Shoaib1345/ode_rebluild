<?php

namespace Database\Seeders;

use App\Models\EventType;
use Illuminate\Database\Seeder;

class EventTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            'Wedding Reception', 'Birthday Party', 'Vendor at Event',
            'Anniversary Party', 'Baby Shower', 'Bridal Shower',
            'Graduation Party', 'Corporate Event', 'Retirement Party',
            'Quinceañera', 'Bar/Bat Mitzvah', 'Engagement Party',
            'Holiday Party', 'Reunion (Family/Class)', 'Fundraiser / Charity Event',
            'Concert / Live Music', 'Festival', 'Outdoor Event',
            'Picnic / BBQ', 'Dinner Party', 'Sweet 16',
            'Prom / Homecoming', 'Sporting Event', 'Community Event',
            'Trade Show / Expo', 'Religious Ceremony', 'School Event',
            'Private Party', 'Business Meeting', 'Award Ceremony',
        ];

        foreach ($types as $type) {
            EventType::firstOrCreate(
                ['event_type' => $type],
                ['client_added' => false]
            );
        }

        $this->command->info('Seeded ' . count($types) . ' event types.');
    }
}
