<?php

namespace Tests\Feature\Admin;

use App\Models\CopyRelationship;
use App\Models\Trader;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_and_access_dashboard(): void
    {
        $admin = User::factory()->admin()->create([
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $this->post('/admin/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])->assertRedirect(route('admin.dashboard'));

        $this->assertAuthenticatedAs($admin);

        $this->get('/admin')->assertOk();
    }

    public function test_non_admin_cannot_access_admin_dashboard(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/admin')
            ->assertForbidden();
    }

    public function test_admin_can_create_update_and_delete_users(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin);

        $this->post('/admin/users', [
            'username' => 'managed_user',
            'name' => 'Managed User',
            'email' => 'managed@example.com',
            'phone' => '+1 555 000 1111',
            'country' => 'United States',
            'membership_tier' => 'pro',
            'kyc_status' => 'pending',
            'timezone' => 'UTC',
            'password' => 'strong-pass-123',
            'password_confirmation' => 'strong-pass-123',
            'notification_email_alerts' => true,
            'email_verified' => true,
            'is_admin' => false,
        ])->assertRedirect(route('admin.users.index'));

        $createdUser = User::query()->where('email', 'managed@example.com')->firstOrFail();

        $this->assertDatabaseHas('users', [
            'id' => $createdUser->id,
            'name' => 'Managed User',
            'is_admin' => false,
            'membership_tier' => 'pro',
        ]);

        $this->put("/admin/users/{$createdUser->id}", [
            'username' => 'managed_user',
            'name' => 'Managed User Updated',
            'email' => 'managed@example.com',
            'phone' => '+1 555 000 2222',
            'country' => 'Canada',
            'membership_tier' => 'free',
            'kyc_status' => 'verified',
            'timezone' => 'America/Toronto',
            'password' => '',
            'password_confirmation' => '',
            'notification_email_alerts' => false,
            'email_verified' => true,
            'is_admin' => true,
        ])->assertRedirect(route('admin.users.index'));

        $this->assertDatabaseHas('users', [
            'id' => $createdUser->id,
            'name' => 'Managed User Updated',
            'country' => 'Canada',
            'is_admin' => true,
            'kyc_status' => 'verified',
        ]);

        $this->delete("/admin/users/{$createdUser->id}")
            ->assertRedirect(route('admin.users.index'));

        $this->assertDatabaseMissing('users', [
            'id' => $createdUser->id,
        ]);
    }

    public function test_admin_can_search_users_by_name_email_or_phone(): void
    {
        $admin = User::factory()->admin()->create();

        $match = User::factory()->create([
            'name' => 'Search Target',
            'email' => 'target@example.com',
            'phone' => '+1 222 333 4444',
        ]);

        User::factory()->create([
            'name' => 'Another User',
            'email' => 'another@example.com',
            'phone' => '+1 999 888 7777',
        ]);

        $this->actingAs($admin)
            ->get('/admin/users?search=target@example.com')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Users/Index')
                ->has('users.data', 1)
                ->where('users.data.0.id', $match->id)
            );

        $this->actingAs($admin)
            ->get('/admin/users?search=+1%20222%20333%204444')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Users/Index')
                ->has('users.data', 1)
                ->where('users.data.0.id', $match->id)
            );
    }

    public function test_admin_can_fund_user_balance_profit_and_holding_from_user_section(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create([
            'balance' => 100,
            'profit_balance' => 20,
            'holding_balance' => 50,
        ]);

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
            'cash_balance' => 100,
            'profit_loss' => 20,
            'investing_balance' => 50,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.users.fund', $customer), [
                'target' => 'balance',
                'amount' => 25,
                'notes' => 'Manual top-up for pending transfer',
            ])
            ->assertRedirect(route('admin.users.edit', $customer));

        $this->actingAs($admin)
            ->post(route('admin.users.fund', $customer), [
                'target' => 'profit_balance',
                'amount' => 5.5,
            ])
            ->assertRedirect(route('admin.users.edit', $customer));

        $this->actingAs($admin)
            ->post(route('admin.users.fund', $customer), [
                'target' => 'holding_balance',
                'amount' => 12,
            ])
            ->assertRedirect(route('admin.users.edit', $customer));

        $customer->refresh();
        $wallet->refresh();

        $this->assertSame(125.0, (float) $customer->balance);
        $this->assertSame(25.5, (float) $customer->profit_balance);
        $this->assertSame(62.0, (float) $customer->holding_balance);

        $this->assertSame(125.0, (float) $wallet->cash_balance);
        $this->assertSame(25.5, (float) $wallet->profit_loss);
        $this->assertSame(62.0, (float) $wallet->investing_balance);

        $this->assertSame(3, WalletTransaction::query()->where('wallet_id', $wallet->id)->count());
        $this->assertSame(
            ['deposit', 'copy_pnl', 'copy_allocation'],
            WalletTransaction::query()->where('wallet_id', $wallet->id)->orderBy('created_at')->pluck('type')->all()
        );
    }

    public function test_admin_can_deduct_user_balance_by_any_amount(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create([
            'balance' => 50,
            'profit_balance' => 20,
            'holding_balance' => 30,
        ]);

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
            'cash_balance' => 50,
            'profit_loss' => 20,
            'investing_balance' => 30,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.users.fund', $customer), [
                'target' => 'balance',
                'operation' => 'deduct',
                'amount' => 10000,
                'notes' => 'Admin recovery',
            ])
            ->assertRedirect(route('admin.users.edit', $customer));

        $customer->refresh();
        $wallet->refresh();

        $this->assertSame(-9950.0, (float) $customer->balance);
        $this->assertSame(20.0, (float) $customer->profit_balance);
        $this->assertSame(30.0, (float) $customer->holding_balance);

        $this->assertSame(-9950.0, (float) $wallet->cash_balance);
        $this->assertSame(20.0, (float) $wallet->profit_loss);
        $this->assertSame(30.0, (float) $wallet->investing_balance);

        $transaction = WalletTransaction::query()->where('wallet_id', $wallet->id)->sole();

        $this->assertSame('debit', $transaction->direction);
        $this->assertSame('deposit', $transaction->type);
        $this->assertSame(10000.0, (float) $transaction->amount);
    }

    public function test_admin_funding_requires_a_valid_target_and_positive_amount(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $this->actingAs($admin)
            ->post(route('admin.users.fund', $customer), [
                'target' => 'invalid-target',
                'amount' => 0,
            ])
            ->assertSessionHasErrors(['target', 'amount']);
    }

    public function test_admin_funding_preserves_existing_user_balances_when_wallet_is_missing(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create([
            'balance' => 5000,
            'profit_balance' => 120,
            'holding_balance' => 700,
        ]);

        $this->assertDatabaseMissing('wallets', ['user_id' => $customer->id]);

        $this->actingAs($admin)
            ->post(route('admin.users.fund', $customer), [
                'target' => 'balance',
                'amount' => 50,
            ])
            ->assertRedirect(route('admin.users.edit', $customer));

        $wallet = Wallet::query()->where('user_id', $customer->id)->firstOrFail();
        $customer->refresh();

        $this->assertSame(5050.0, (float) $wallet->cash_balance);
        $this->assertSame(700.0, (float) $wallet->investing_balance);
        $this->assertSame(120.0, (float) $wallet->profit_loss);
        $this->assertSame(5050.0, (float) $customer->balance);
        $this->assertSame(700.0, (float) $customer->holding_balance);
        $this->assertSame(120.0, (float) $customer->profit_balance);
    }

    public function test_admin_can_see_copy_trader_status_for_user_relationships(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $activeTrader = Trader::query()->create([
            'display_name' => 'Alpha Whale',
            'username' => 'alpha_whale',
            'avatar_color' => 'emerald',
            'strategy' => 'Momentum',
            'copy_fee' => 50,
            'total_return' => 12.5,
            'win_rate' => 80,
            'copiers_count' => 1,
            'risk_score' => 3,
            'joined_at' => now()->subDays(10),
            'is_verified' => true,
            'is_active' => true,
        ]);

        $pausedTrader = Trader::query()->create([
            'display_name' => 'Beta Scout',
            'username' => 'beta_scout',
            'avatar_color' => 'amber',
            'strategy' => 'Swing',
            'copy_fee' => 75,
            'total_return' => 8.25,
            'win_rate' => 61,
            'copiers_count' => 0,
            'risk_score' => 4,
            'joined_at' => now()->subDays(4),
            'is_verified' => true,
            'is_active' => true,
        ]);

        CopyRelationship::factory()->create([
            'user_id' => $customer->id,
            'trader_id' => $activeTrader->id,
            'status' => 'active',
            'allocation_amount' => 250,
            'copy_ratio' => 1.5,
            'started_at' => now()->subDays(3),
        ]);

        CopyRelationship::factory()->create([
            'user_id' => $customer->id,
            'trader_id' => $pausedTrader->id,
            'status' => 'paused',
            'allocation_amount' => 400,
            'copy_ratio' => 0.75,
            'started_at' => now()->subDay(),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.users.edit', $customer))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Users/Edit')
                ->has('copy_relationships', 2)
                ->where('copy_relationships.0.trader.display_name', 'Alpha Whale')
                ->where('copy_relationships.0.status', 'active')
                ->where('copy_relationships.1.trader.display_name', 'Beta Scout')
                ->where('copy_relationships.1.status', 'paused')
            );
    }
}
