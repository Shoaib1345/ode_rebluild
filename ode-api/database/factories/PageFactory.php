<?php

namespace Database\Factories;

use App\Models\Page;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Page>
 */
class PageFactory extends Factory
{
    protected $model = Page::class;

    public function definition(): array
    {
        $title = $this->faker->unique()->words(3, true);

        return [
            'title'            => ucwords($title),
            'slug'             => Str::slug($title),
            'navbar_text'      => $this->faker->words(2, true),
            'meta_keywords'    => $this->faker->words(4, true),
            'meta_description' => $this->faker->sentence(),
            'editor_content'   => '<p>' . $this->faker->paragraph() . '</p>',
            'sort_order'       => $this->faker->numberBetween(0, 99),
            'add_to_menu'      => false,
            'status'           => 1,
        ];
    }

    public function inMenu(): static
    {
        return $this->state(['add_to_menu' => true]);
    }

    public function inactive(): static
    {
        return $this->state(['status' => 0]);
    }
}
