<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EventType>
 */
class EventTypeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'event_type'   => $this->faker->unique()->words(2, true),
            'client_added' => false,
        ];
    }

    public function clientAdded(): static
    {
        return $this->state(['client_added' => true]);
    }
}
