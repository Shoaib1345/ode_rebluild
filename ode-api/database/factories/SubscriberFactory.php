<?php

namespace Database\Factories;

use App\Models\Subscriber;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subscriber>
 */
class SubscriberFactory extends Factory
{
    protected $model = Subscriber::class;

    public function definition(): array
    {
        return [
            'email'           => $this->faker->unique()->safeEmail(),
            'name'            => $this->faker->name(),
            'is_active'       => true,
            'subscribed_at'   => now(),
            'unsubscribed_at' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state([
            'is_active'       => false,
            'unsubscribed_at' => now()->subDays(7),
        ]);
    }
}
