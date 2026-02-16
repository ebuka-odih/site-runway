<?php

namespace Tests\Feature\Admin;

use App\Models\PaymentMethod;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SettingsManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_store_livechat_settings(): void
    {
        $admin = User::factory()->admin()->create();

        $payload = [
            'site_mode' => 'live',
            'deposits_enabled' => true,
            'withdrawals_enabled' => true,
            'require_kyc_for_withdrawals' => true,
            'session_timeout_minutes' => 90,
            'support_email' => 'support@runwayalgo.test',
            'livechat_enabled' => true,
            'livechat_provider' => 'tawk.to',
            'livechat_embed_code' => '<script>console.log("livechat")</script>',
        ];

        $this->actingAs($admin)
            ->post('/admin/settings', $payload)
            ->assertRedirect(route('admin.settings.index'));

        $stored = Cache::get('admin_panel_settings');

        $this->assertIsArray($stored);
        $this->assertTrue($stored['livechat_enabled']);
        $this->assertSame('tawk.to', $stored['livechat_provider']);
        $this->assertSame('<script>console.log("livechat")</script>', $stored['livechat_embed_code']);
    }

    public function test_admin_can_export_full_site_database_details(): void
    {
        $admin = User::factory()->admin()->create([
            'email' => 'admin-export@runwayalgo.test',
        ]);

        $customer = User::factory()->create([
            'name' => 'Export Target',
            'email' => 'target@runwayalgo.test',
            'membership_tier' => 'pro',
            'kyc_status' => 'verified',
            'is_admin' => false,
        ]);

        Wallet::query()->create([
            'user_id' => $customer->id,
            'cash_balance' => 1500,
            'investing_balance' => 4200,
            'profit_loss' => 320,
            'currency' => 'USD',
        ]);

        $paymentMethod = PaymentMethod::query()->create([
            'name' => 'USDT TRC20',
            'channel' => 'crypto',
            'currency' => 'USDT',
            'network' => 'TRC20',
            'wallet_address' => 'T111111111111',
            'status' => 'active',
            'display_order' => 1,
        ]);

        $response = $this->actingAs($admin)->get('/admin/settings/export/database');

        $response->assertOk();
        $response->assertHeader('content-type', 'application/x-ndjson');

        $disposition = (string) $response->headers->get('content-disposition');
        $this->assertStringContainsString('attachment;', $disposition);
        $this->assertStringContainsString('site-database-export-', $disposition);
        $this->assertStringContainsString('.ndjson', $disposition);

        $records = collect(preg_split('/\R/', trim($response->streamedContent())))
            ->filter()
            ->map(fn (string $line) => json_decode($line, true, 512, JSON_THROW_ON_ERROR))
            ->values();

        $meta = $records->firstWhere('type', 'meta');
        $this->assertIsArray($meta);
        $this->assertSame('runwayalgo.db.export.v1', $meta['format']);
        $this->assertArrayHasKey('exported_at', $meta);
        $this->assertArrayHasKey('application', $meta);
        $this->assertArrayHasKey('connection', $meta);
        $this->assertArrayHasKey('tables_count', $meta);

        $tableRecords = $records
            ->filter(fn (array $record) => ($record['type'] ?? null) === 'table')
            ->keyBy('name');

        $this->assertTrue($tableRecords->has('users'));
        $this->assertTrue($tableRecords->has('wallets'));
        $this->assertTrue($tableRecords->has('payment_methods'));

        $userRows = $records->filter(fn (array $record) => ($record['type'] ?? null) === 'row' && ($record['table'] ?? null) === 'users');
        $exportedCustomer = $userRows->first(fn (array $row) => data_get($row, 'data.id') === $customer->id);
        $this->assertNotNull($exportedCustomer);
        $this->assertSame('Export Target', data_get($exportedCustomer, 'data.name'));
        $this->assertSame('target@runwayalgo.test', data_get($exportedCustomer, 'data.email'));
        $this->assertSame('pro', data_get($exportedCustomer, 'data.membership_tier'));
        $this->assertSame('verified', data_get($exportedCustomer, 'data.kyc_status'));
        $this->assertEquals(0, (int) data_get($exportedCustomer, 'data.is_admin'));

        $walletRows = $records->filter(fn (array $record) => ($record['type'] ?? null) === 'row' && ($record['table'] ?? null) === 'wallets');
        $exportedWallet = $walletRows->first(fn (array $row) => data_get($row, 'data.user_id') === $customer->id);
        $this->assertNotNull($exportedWallet);
        $this->assertEquals(1500.0, data_get($exportedWallet, 'data.cash_balance'));
        $this->assertEquals(4200.0, data_get($exportedWallet, 'data.investing_balance'));

        $paymentMethodRows = $records->filter(fn (array $record) => ($record['type'] ?? null) === 'row' && ($record['table'] ?? null) === 'payment_methods');
        $exportedMethod = $paymentMethodRows->first(fn (array $row) => data_get($row, 'data.id') === $paymentMethod->id);
        $this->assertNotNull($exportedMethod);
        $this->assertSame('USDT TRC20', data_get($exportedMethod, 'data.name'));
        $this->assertSame('T111111111111', data_get($exportedMethod, 'data.wallet_address'));

        $end = $records->firstWhere('type', 'end');
        $this->assertIsArray($end);
        $this->assertGreaterThanOrEqual(1, (int) ($end['tables_count'] ?? 0));
    }
}
