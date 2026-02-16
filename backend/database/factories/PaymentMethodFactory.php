<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PaymentMethod>
 */
class PaymentMethodFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'channel' => fake()->randomElement(['bank_transfer', 'crypto', 'card', 'wallet', 'other']),
            'currency' => fake()->randomElement(['USD', 'USDT', 'BTC', 'ETH']),
            'network' => fake()->optional()->randomElement(['SWIFT', 'SEPA', 'ERC20', 'TRC20', 'Bitcoin']),
            'status' => fake()->randomElement(['active', 'inactive']),
            'description' => fake()->optional()->sentence(),
            'settings' => ['api_key' => fake()->bothify('pk_########')],
            'display_order' => fake()->numberBetween(0, 20),
        ];
    }
}
