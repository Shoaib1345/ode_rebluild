<?php

namespace Database\Factories;

use App\Models\EventType;
use App\Models\Lead;
use App\Models\UsState;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    protected $model = Lead::class;

    public function definition(): array
    {
        return [
            'affiliate_string'         => null,
            'referral_string'          => null,
            'referred_by_affiliate_id' => null,
            'referred_by_planner_id'   => null,
            'referred_by_customer_id'  => null,
            'user_id'                  => null,
            'event_type_id'            => null,
            'event_type_label'         => $this->faker->words(2, true),
            'event_date'               => $this->faker->dateTimeBetween('+1 month', '+1 year')->format('Y-m-d'),
            'event_state'              => $this->faker->randomElement(['CA', 'TX', 'NY', 'FL', 'IL']),
            'event_name'               => $this->faker->words(3, true),
            'no_of_people'             => $this->faker->numberBetween(10, 300),
            'carrier'                  => $this->faker->randomElement(['ASI', 'FDEAN', 'IH']),
            'coverage_limit'           => '1/2',
            'email'                    => $this->faker->unique()->safeEmail(),
            'phone'                    => $this->faker->phoneNumber(),
            'first_name'               => $this->faker->firstName(),
            'last_name'                => $this->faker->lastName(),
            'ins_first_name'           => $this->faker->firstName(),
            'ins_last_name'            => $this->faker->lastName(),
            'ins_street'               => $this->faker->streetAddress(),
            'ins_city'                 => $this->faker->city(),
            'ins_state'                => 'CA',
            'ins_zip'                  => '90210',
            'venue_name'               => $this->faker->company(),
            'venue_address'            => $this->faker->streetAddress(),
            'venue_state'              => 'CA',
            'venue_zip'                => '90210',
            'submission_status'        => 'payment_received',
            'payment_status'           => 1,
            'bound'                    => false,
            'status'                   => 1,
            'lead_offered_plans'       => [
                'rate_id'        => 1,
                'carrier'        => 'ASI',
                'premium'        => 75.00,
                'broker_fee'     => 20.00,
                'processing_fee' => 3.33,
                'extra_charge'   => 0,
                'total'          => 98.33,
                'min_limit'      => 1,
                'max_limit'      => 2,
            ],
        ];
    }
}
