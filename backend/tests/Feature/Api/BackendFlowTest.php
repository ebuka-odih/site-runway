<?php

namespace Tests\Feature\Api;

use App\Models\Asset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BackendFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_fetch_dashboard_and_place_order(): void
    {
        $this->seed();

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'tommygreymassey@yahoo.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ]);

        $loginResponse
            ->assertOk()
            ->assertJsonStructure([
                'token',
                'token_type',
                'user' => ['id', 'name', 'email'],
            ]);

        $token = $loginResponse->json('token');

        $dashboardResponse = $this
            ->withToken($token)
            ->getJson('/api/v1/dashboard');

        $dashboardResponse
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'portfolio',
                    'analytics',
                    'positions',
                    'watchlist',
                ],
            ]);

        $btc = Asset::query()->where('symbol', 'BTC')->firstOrFail();

        $orderResponse = $this
            ->withToken($token)
            ->postJson('/api/v1/orders', [
                'asset_id' => $btc->id,
                'side' => 'buy',
                'quantity' => 0.01,
                'order_type' => 'market',
            ]);

        $orderResponse
            ->assertCreated()
            ->assertJsonPath('data.asset.symbol', 'BTC');

        $user = User::query()->where('email', 'tommygreymassey@yahoo.com')->firstOrFail();

        $this->assertGreaterThan(0, $user->orders()->count());
    }
}
