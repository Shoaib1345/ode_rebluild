<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CarrierGlLimit>
 */
class CarrierGlLimitFactory extends Factory
{
    public function definition(): array
    {
        $minLimit = $this->faker->randomElement([100000, 200000, 300000]);
        $maxLimit = $minLimit * 3;

        return [
            'carrier'       => $this->faker->randomElement(['ASI', 'FDEAN', 'IH']),
            'min_limit'     => $minLimit,
            'max_limit'     => $maxLimit,
            'gl_limit'      => '$' . number_format($minLimit) . ' Per Occurrence',
            'gl_limit_type' => $this->faker->randomElement(['Per Occurrence', 'Aggregate', 'Medical']),
        ];
    }
}
