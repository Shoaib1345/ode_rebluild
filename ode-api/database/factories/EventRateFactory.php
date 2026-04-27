<?php

namespace Database\Factories;

use App\Models\EventType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EventRate>
 */
class EventRateFactory extends Factory
{
    public function definition(): array
    {
        return [
            'event_type_id'      => EventType::factory(),
            'carrier'            => $this->faker->randomElement(['ASI', 'FDEAN', 'IH']),
            'min_audience'       => 0,
            'max_audience'       => 50,
            'rate'               => $this->faker->randomFloat(2, 10, 200),
            'min_limit'          => 100000,
            'max_limit'          => 300000,
            'limit_type'         => 'per_occurrence',
            'host_liquor'        => false,
            'liquor'             => false,
            'noha'               => 'N/A',
            'w_o_s'              => 'N/A',
            'p_a_n_c_b'          => 'N/A',
            'e_a_i'              => 'N/A',
            'same_day_coverage'  => true,
            'weekend_coverage'   => true,
            'quote_instantly'    => true,
            'bind_instantly'     => true,
            'additional_people'  => null,
            'additional_charges' => null,
        ];
    }
}
