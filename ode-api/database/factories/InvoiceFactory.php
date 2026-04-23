<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\Lead;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $premium   = fake()->randomFloat(2, 50, 500);
        $brokerFee = 20.00;
        $procFee   = 5.00;

        return [
            'lead_id'       => Lead::factory(),
            'created_by'    => 1,   // system/admin user; override in tests when needed
            'encode_id'     => strtoupper(Str::random(8)),
            'type'          => 'single',
            'first_name'    => fake()->firstName(),
            'last_name'     => fake()->lastName(),
            'email'         => fake()->safeEmail(),
            'event_type'    => fake()->randomElement(['Wedding', 'Birthday', 'Corporate', 'Festival']),
            'carrier'       => fake()->randomElement(['ASI', 'Markel', 'Nationwide']),
            'effective_date'   => fake()->dateTimeBetween('+7 days', '+1 year')->format('Y-m-d'),
            'expiration_date'  => fake()->dateTimeBetween('+1 year', '+2 years')->format('Y-m-d'),
            'broker_fee'       => $brokerFee,
            'processing_fee'   => $procFee,
            'total_premium'    => $premium,
            'total_payable'    => $premium + $brokerFee + $procFee,
            'invoice_status'   => Invoice::STATUS_UNPAID,
        ];
    }

    public function paid(): static
    {
        return $this->state(['invoice_status' => Invoice::STATUS_PAID]);
    }
}
