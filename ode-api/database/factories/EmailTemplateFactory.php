<?php

namespace Database\Factories;

use App\Models\EmailTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmailTemplate>
 */
class EmailTemplateFactory extends Factory
{
    protected $model = EmailTemplate::class;

    public function definition(): array
    {
        // Generate a valid snake_case key: word + underscore + 3-digit number
        $word = preg_replace('/[^a-z]/', '', strtolower($this->faker->word()));
        $word = $word ?: 'template';

        return [
            'key'       => $word . '_' . $this->faker->unique()->numberBetween(100, 999),
            'subject'   => $this->faker->sentence(5),
            'body'      => '<p>Hi {firstName},</p><p>' . $this->faker->paragraph() . '</p>',
            'variables' => [
                ['name' => 'firstName', 'description' => 'Recipient first name'],
            ],
            'is_active' => true,
        ];
    }

    /**
     * Mark template as inactive.
     */
    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
