<?php

namespace Database\Factories;

use App\Models\Commission;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Commission>
 */
class CommissionFactory extends Factory
{
    protected $model = Commission::class;

    public function definition(): array
    {
        return [
            'user_id'     => User::factory(),
            'lead_id'     => Lead::factory(),
            'amount'      => $this->faker->randomFloat(2, 5, 150),
            'type'        => $this->faker->randomElement(['affiliate', 'agent', 'planner', 'customer']),
            'status'      => 'accrued',
            'accrued_at'  => now(),
            'paid_at'     => null,
            'paid_method' => null,
            'paid_note'   => null,
        ];
    }

    /** Convenience state: already-paid commission. */
    public function paid(): static
    {
        return $this->state([
            'status'      => 'paid',
            'paid_at'     => now(),
            'paid_method' => 'Zelle',
            'paid_note'   => 'Test payment.',
        ]);
    }

    /** Pin the commission type. */
    public function ofType(string $type): static
    {
        return $this->state(['type' => $type]);
    }
}
