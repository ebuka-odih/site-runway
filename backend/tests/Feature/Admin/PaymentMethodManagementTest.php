<?php

namespace Tests\Feature\Admin;

use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PaymentMethodManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_and_delete_payment_methods(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->post('/admin/payment-methods', [
                'name' => 'USDT ERC20',
                'channel' => 'crypto',
                'currency' => 'usdt',
                'network' => 'ERC20',
                'wallet_address' => '0x12345',
                'status' => 'active',
                'description' => 'Primary stablecoin rail',
                'display_order' => 1,
            ])
            ->assertRedirect(route('admin.payment-methods.index'));

        $method = PaymentMethod::query()->where('name', 'USDT ERC20')->firstOrFail();

        $this->assertDatabaseHas('payment_methods', [
            'id' => $method->id,
            'currency' => 'USDT',
            'status' => 'active',
            'wallet_address' => '0x12345',
        ]);

        $this->actingAs($admin)
            ->put("/admin/payment-methods/{$method->id}", [
                'name' => 'USDT ERC20 Updated',
                'channel' => 'crypto',
                'currency' => 'USDT',
                'network' => 'ERC20',
                'wallet_address' => '0x98765',
                'status' => 'inactive',
                'description' => 'Temporarily disabled for maintenance',
                'display_order' => 2,
            ])
            ->assertRedirect(route('admin.payment-methods.index'));

        $this->assertDatabaseHas('payment_methods', [
            'id' => $method->id,
            'name' => 'USDT ERC20 Updated',
            'status' => 'inactive',
            'wallet_address' => '0x98765',
            'display_order' => 2,
        ]);

        $this->actingAs($admin)
            ->delete("/admin/payment-methods/{$method->id}")
            ->assertRedirect(route('admin.payment-methods.index'));

        $this->assertDatabaseMissing('payment_methods', [
            'id' => $method->id,
        ]);
    }

    public function test_crypto_method_requires_wallet_address(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->from('/admin/payment-methods/create')
            ->post('/admin/payment-methods', [
                'name' => 'Bank Wire',
                'channel' => 'crypto',
                'currency' => 'USD',
                'network' => 'SWIFT',
                'status' => 'active',
                'display_order' => 1,
            ])
            ->assertRedirect('/admin/payment-methods/create')
            ->assertSessionHasErrors('wallet_address');
    }

    public function test_admin_can_filter_payment_methods_by_channel_and_status(): void
    {
        $admin = User::factory()->admin()->create();

        $cryptoMethod = PaymentMethod::query()->create([
            'name' => 'USDT TRC20',
            'channel' => 'crypto',
            'currency' => 'USDT',
            'network' => 'TRC20',
            'wallet_address' => 'T123',
            'status' => 'active',
            'display_order' => 1,
        ]);

        PaymentMethod::query()->create([
            'name' => 'Bank Wire USD',
            'channel' => 'bank_transfer',
            'currency' => 'USD',
            'network' => 'SWIFT',
            'status' => 'inactive',
            'display_order' => 2,
        ]);

        $this->actingAs($admin)
            ->get('/admin/payment-methods?channel=crypto&status=active')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/PaymentMethods/Index')
                ->where('filters.channel', 'crypto')
                ->where('filters.status', 'active')
                ->has('methods.data', 1)
                ->where('methods.data.0.id', $cryptoMethod->id)
            );
    }
}
