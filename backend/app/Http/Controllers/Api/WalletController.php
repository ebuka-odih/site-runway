<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDepositRequest;
use App\Http\Requests\StoreWithdrawalRequest;
use App\Http\Requests\SubmitDepositProofRequest;
use App\Models\Asset;
use App\Models\DepositRequest;
use App\Models\PaymentMethod;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Notifications\AdminApprovalNotification;
use App\Notifications\UserEventNotification;
use App\Support\AdminActionNotificationRouter;
use App\Support\SiteSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    private const LEGACY_DEPOSIT_WALLET_ADDRESS = '0x906b2533218Df3581da06c697B51eF29f8c86381';
    private const BANK_DETAIL_KEYS = [
        'bank_name',
        'account_name',
        'account_number',
        'routing_number',
        'swift_code',
        'bank_address',
        'reference_letter',
    ];

    private const WITHDRAWAL_BANK_DETAIL_KEYS = [
        'bank_name',
        'account_name',
        'account_number',
        'routing_number',
        'swift_code',
        'bank_address',
    ];

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('positions.asset:id,current_price');
        $wallet = $this->resolveUserWallet($user);
        $availableBalances = $this->availableWithdrawalBalances($wallet, (float) $wallet->cash_balance, (float) $wallet->profit_loss);
        $tradeProfit = $this->calculateTradeProfit($user, $wallet);
        $depositMethods = $this->availableDepositMethods();
        $summaryDepositMethods = $depositMethods->isNotEmpty()
            ? $depositMethods
            : collect([$this->legacyDepositMethodPayload()]);

        $wallet->load([
            'transactions' => fn ($query) => $query->with('asset:id,symbol')->latest('occurred_at')->limit(10),
            'depositRequests' => fn ($query) => $query->latest(),
        ]);

        return response()->json([
            'data' => [
                'wallet' => [
                    'id' => $wallet->id,
                    'cash_balance' => $availableBalances['cash_balance'],
                    'investing_balance' => (float) $wallet->investing_balance,
                    'profit_loss' => $availableBalances['profit_balance'],
                    'total_balance' => round(
                        $availableBalances['cash_balance']
                        + (float) $wallet->investing_balance
                        + $availableBalances['profit_balance'],
                        8
                    ),
                    'trade_profit' => $tradeProfit,
                    'currency' => $wallet->currency,
                ],
                'recent_transactions' => $wallet->transactions->map(fn ($transaction) => [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'status' => $transaction->status,
                    'direction' => $transaction->direction,
                    'amount' => (float) $transaction->amount,
                    'quantity' => $transaction->quantity ? (float) $transaction->quantity : null,
                    'symbol' => $transaction->asset?->symbol ?? data_get($transaction->metadata, 'currency'),
                    'occurred_at' => $transaction->occurred_at?->toIso8601String(),
                ]),
                'pending_deposits' => $wallet->depositRequests
                    ->whereIn('status', ['payment', 'processing'])
                    ->values()
                    ->map(fn ($deposit) => [
                        'id' => $deposit->id,
                        'amount' => (float) $deposit->amount,
                        'currency' => $deposit->currency,
                        'network' => $deposit->network,
                        'status' => $deposit->status,
                        'expires_at' => optional($deposit->expires_at)->toIso8601String(),
                    ]),
                'deposit_methods' => $summaryDepositMethods->values(),
            ],
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $wallet = $this->resolveUserWallet($request->user());

        $validated = $request->validate([
            'type' => ['sometimes', 'string'],
            'status' => ['sometimes', 'string'],
        ]);

        $transactions = $wallet->transactions()
            ->with('asset:id,symbol,name')
            ->when(isset($validated['type']), fn ($query) => $query->where('type', $validated['type']))
            ->when(isset($validated['status']), fn ($query) => $query->where('status', $validated['status']))
            ->latest('occurred_at')
            ->paginate(20);

        return response()->json($transactions);
    }

    public function storeDeposit(StoreDepositRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        $settings = SiteSettings::get();

        if (! $settings['deposits_enabled']) {
            return response()->json([
                'message' => 'Deposits are currently disabled.',
            ], 403);
        }

        if ($settings['require_kyc_for_deposits'] && ($user->kyc_status ?? 'pending') !== 'verified') {
            return response()->json([
                'message' => 'KYC verification is required to create a deposit request.',
            ], 403);
        }

        $wallet = $this->resolveUserWallet($user);
        $depositMethods = $this->availableDepositMethods();
        $selectedMethod = $this->resolveDepositMethod($validated, $depositMethods);

        if ($selectedMethod === null && $depositMethods->isNotEmpty()) {
            return response()->json([
                'message' => 'No active payment details are configured for the selected deposit method.',
            ], 422);
        }

        $selectedChannel = $selectedMethod['channel'] ?? 'crypto';
        $selectedCurrency = $selectedMethod['currency'] ?? strtoupper((string) ($validated['currency'] ?? ''));
        $selectedNetwork = $selectedMethod['network'] ?? ($validated['network'] ?? null);
        $selectedBankDetails = $selectedMethod['bank_details'] ?? null;
        $selectedWalletAddress = $selectedMethod['wallet_address']
            ?? ($selectedBankDetails['account_number'] ?? null)
            ?? self::LEGACY_DEPOSIT_WALLET_ADDRESS;

        if ($selectedCurrency === '') {
            return response()->json([
                'message' => 'A valid deposit currency is required.',
            ], 422);
        }

        $asset = Asset::query()
            ->where('symbol', $selectedCurrency)
            ->first();

        $deposit = $wallet->depositRequests()->create([
            'asset_id' => $validated['asset_id'] ?? $asset?->id,
            'amount' => $validated['amount'],
            'currency' => $selectedCurrency,
            'network' => $selectedNetwork,
            'wallet_address' => $selectedWalletAddress,
            'status' => 'payment',
            'expires_at' => now()->addMinutes(15),
        ]);

        $user->notify(new UserEventNotification(
            eventType: 'wallet.deposit_requested',
            title: 'Deposit request created',
            message: sprintf(
                'Your deposit request for %s %s was created. Submit payment proof to continue.',
                $this->formatNumber((float) $deposit->amount),
                (string) $deposit->currency
            ),
            metadata: [
                'deposit_request_id' => $deposit->id,
                'amount' => (float) $deposit->amount,
                'currency' => $deposit->currency,
                'network' => $deposit->network,
                'status' => $deposit->status,
            ],
            actionUrl: '/dashboard/wallet',
            sendEmail: false,
        ));

        $adminMessage = sprintf(
            'Deposit request from %s (%s) for %s %s.',
            (string) ($user->name ?? 'User'),
            (string) ($user->email ?? '-'),
            $this->formatNumber((float) $deposit->amount),
            (string) $deposit->currency
        );
        $adminActionUrl = '/admin/transactions?tab=deposit';
        AdminActionNotificationRouter::send(new AdminApprovalNotification(
            title: 'Deposit approval required',
            message: $adminMessage,
            actionUrl: $adminActionUrl,
        ));

        return response()->json([
            'message' => 'Deposit request created.',
            'data' => [
                'id' => $deposit->id,
                'amount' => (float) $deposit->amount,
                'currency' => $deposit->currency,
                'network' => $deposit->network,
                'status' => $deposit->status,
                'expires_at' => optional($deposit->expires_at)->toIso8601String(),
                'wallet_address' => $deposit->wallet_address,
                'channel' => $selectedChannel,
                'bank_details' => $selectedBankDetails,
            ],
        ], 201);
    }

    public function submitProof(SubmitDepositProofRequest $request, DepositRequest $depositRequest): JsonResponse
    {
        $wallet = $this->resolveUserWallet($request->user());

        if ($depositRequest->wallet_id !== $wallet->id) {
            abort(403, 'You are not allowed to modify this deposit request.');
        }

        if (in_array($depositRequest->status, ['approved', 'rejected'], true)) {
            return response()->json([
                'message' => 'This deposit request has already been finalized.',
            ], 409);
        }

        $validated = $request->validated();
        $proofPath = $request->file('proof_file')?->store('deposit-proofs', 'public');

        if ($proofPath === null) {
            return response()->json([
                'message' => 'Proof image upload failed.',
            ], 422);
        }

        DB::transaction(function () use ($depositRequest, $validated, $proofPath) {
            $depositRequest->update([
                'transaction_hash' => $validated['transaction_hash'],
                'proof_path' => $proofPath,
                'status' => 'processing',
                'submitted_at' => now(),
            ]);
        });

        $request->user()->notify(new UserEventNotification(
            eventType: 'wallet.deposit_proof_submitted',
            title: 'Deposit proof submitted',
            message: sprintf(
                'Your proof for deposit %s %s was submitted and is awaiting admin approval.',
                $this->formatNumber((float) $depositRequest->amount),
                (string) $depositRequest->currency
            ),
            metadata: [
                'deposit_request_id' => $depositRequest->id,
                'amount' => (float) $depositRequest->amount,
                'currency' => $depositRequest->currency,
                'status' => 'processing',
            ],
            actionUrl: '/dashboard/wallet',
            sendEmail: false,
        ));

        return response()->json([
            'message' => 'Deposit proof submitted. Awaiting admin approval.',
            'data' => $depositRequest->fresh(),
        ]);
    }

    public function storeWithdrawal(StoreWithdrawalRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        $settings = SiteSettings::get();
        $payoutMethod = $validated['payout_method'] ?? 'crypto';

        if (! $settings['withdrawals_enabled']) {
            return response()->json([
                'message' => 'Withdrawals are currently disabled.',
            ], 403);
        }

        if ($settings['require_kyc_for_withdrawals'] && ($user->kyc_status ?? 'pending') !== 'verified') {
            return response()->json([
                'message' => 'KYC verification is required to submit a withdrawal request.',
            ], 403);
        }

        $wallet = $this->resolveUserWallet($user);

        $activeCopyRelationships = $user->copyRelationships()
            ->where('status', 'active')
            ->get(['started_at']);

        if ($activeCopyRelationships->isNotEmpty()) {
            if ((float) $validated['amount'] > 500) {
                return response()->json([
                    'message' => 'Active copy trader bots are limited to withdrawals of $500 per request.',
                ], 403);
            }

            $cycleStart = $activeCopyRelationships
                ->pluck('started_at')
                ->filter()
                ->min() ?? now();

            $withdrawalsThisCycle = WalletTransaction::query()
                ->where('wallet_id', $wallet->id)
                ->where('type', 'withdrawal')
                ->where('status', 'approved')
                ->where('occurred_at', '>=', $cycleStart)
                ->count();

            if ($withdrawalsThisCycle >= 2) {
                return response()->json([
                    'message' => 'You have an active copy trader bot and cannot withdraw till their bot ends its circle.',
                ], 403);
            }
        }

        $asset = $payoutMethod === 'crypto'
            ? Asset::query()->where('symbol', $validated['currency'])->first()
            : null;

        $availableBalances = $this->availableWithdrawalBalances($wallet, (float) $wallet->cash_balance, (float) $wallet->profit_loss);
        $availableForWithdrawal = $availableBalances['available_balance'];

        if ((float) $validated['amount'] > $availableForWithdrawal) {
            return response()->json([
                'message' => 'Insufficient available balance for this withdrawal request.',
                'meta' => [
                    'available_balance' => round($availableForWithdrawal, 2),
                ],
            ], 422);
        }

        $requestedAllocation = $this->allocateWithdrawal(
            $availableBalances['cash_balance'],
            $availableBalances['profit_balance'],
            (float) $validated['amount']
        );

        $withdrawal = WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'asset_id' => $validated['asset_id'] ?? $asset?->id,
            'type' => 'withdrawal',
            'status' => 'pending',
            'direction' => 'debit',
            'amount' => $validated['amount'],
            'network' => $payoutMethod === 'crypto' ? ($validated['network'] ?? null) : null,
            'notes' => 'Withdrawal request submitted. Awaiting admin approval.',
            'occurred_at' => now(),
            'metadata' => [
                'payout_method' => $payoutMethod,
                'currency' => $validated['currency'],
                'destination' => $payoutMethod === 'crypto' ? ($validated['destination'] ?? null) : null,
                'bank_details' => $payoutMethod === 'bank_transfer'
                    ? collect(self::WITHDRAWAL_BANK_DETAIL_KEYS)
                        ->mapWithKeys(fn (string $key) => [$key => $validated[$key] ?? null])
                        ->all()
                    : null,
                'cash_debit' => $requestedAllocation['cash_debit'],
                'profit_debit' => $requestedAllocation['profit_debit'],
            ],
        ]);

        $user->notify(new UserEventNotification(
            eventType: 'wallet.withdrawal_requested',
            title: 'Withdrawal request submitted',
            message: sprintf(
                'Your withdrawal request for %s %s is pending admin approval.',
                $this->formatNumber((float) $withdrawal->amount),
                (string) $validated['currency']
            ),
            metadata: [
                'wallet_transaction_id' => $withdrawal->id,
                'amount' => (float) $withdrawal->amount,
                'currency' => $validated['currency'],
                'payout_method' => $payoutMethod,
                'network' => $withdrawal->network,
                'status' => $withdrawal->status,
            ],
            actionUrl: '/dashboard/wallet',
            sendEmail: false,
        ));

        $adminMessage = sprintf(
            'Withdrawal request from %s (%s) for %s %s.',
            (string) ($user->name ?? 'User'),
            (string) ($user->email ?? '-'),
            $this->formatNumber((float) $withdrawal->amount),
            (string) $validated['currency']
        );
        $adminActionUrl = '/admin/transactions?tab=withdrawal';
        AdminActionNotificationRouter::send(new AdminApprovalNotification(
            title: 'Withdrawal approval required',
            message: $adminMessage,
            actionUrl: $adminActionUrl,
        ));

        return response()->json([
            'message' => 'Withdrawal request submitted. Awaiting admin approval.',
            'data' => [
                'id' => $withdrawal->id,
                'type' => $withdrawal->type,
                'status' => $withdrawal->status,
                'direction' => $withdrawal->direction,
                'amount' => (float) $withdrawal->amount,
                'quantity' => $withdrawal->quantity ? (float) $withdrawal->quantity : null,
                'symbol' => $asset?->symbol ?? $validated['currency'],
                'occurred_at' => $withdrawal->occurred_at?->toIso8601String(),
            ],
        ], 201);
    }

    private function resolveUserWallet(User $user): Wallet
    {
        $wallet = $user->wallet()->first();
        $cashBalanceFromUser = (float) $user->balance;
        $holdingBalanceFromUser = (float) $user->holding_balance;
        $profitBalanceFromUser = (float) $user->profit_balance;

        if (! $wallet) {
            return $user->wallet()->create([
                'cash_balance' => $cashBalanceFromUser,
                'investing_balance' => $holdingBalanceFromUser,
                'profit_loss' => $profitBalanceFromUser,
                'currency' => 'USD',
            ]);
        }

        $cashBalance = $this->resolveCashBalance((float) $wallet->cash_balance, $cashBalanceFromUser);
        $holdingBalance = $this->resolveAuthoritativeBalance((float) $wallet->investing_balance, $holdingBalanceFromUser);
        $profitBalance = $this->resolveAuthoritativeBalance((float) $wallet->profit_loss, $profitBalanceFromUser);

        if (
            $this->isDrifted((float) $wallet->cash_balance, $cashBalance) ||
            $this->isDrifted((float) $wallet->investing_balance, $holdingBalance) ||
            $this->isDrifted((float) $wallet->profit_loss, $profitBalance)
        ) {
            $wallet->fill([
                'cash_balance' => $cashBalance,
                'investing_balance' => $holdingBalance,
                'profit_loss' => $profitBalance,
            ]);
            $wallet->save();
            $wallet->refresh();
        }

        if (
            $this->isDrifted((float) $user->balance, $cashBalance) ||
            $this->isDrifted((float) $user->holding_balance, $holdingBalance) ||
            $this->isDrifted((float) $user->profit_balance, $profitBalance)
        ) {
            User::withoutTimestamps(function () use ($user, $cashBalance, $holdingBalance, $profitBalance): void {
                User::query()
                    ->whereKey($user->id)
                    ->update([
                        'balance' => $cashBalance,
                        'holding_balance' => $holdingBalance,
                        'profit_balance' => $profitBalance,
                    ]);
            });
        }

        return $wallet;
    }

    private function calculateTradeProfit(User $user, Wallet $wallet): float
    {
        $positionsMarketValue = $user->positions->sum(
            fn ($position) => (float) $position->quantity * (float) $position->asset->current_price
        );
        $positionsCostBasis = $user->positions->sum(
            fn ($position) => (float) $position->quantity * (float) $position->average_price
        );
        $realizedTradeProfit = $wallet->transactions()
            ->where('type', 'trade_sell')
            ->get(['metadata'])
            ->sum(fn (WalletTransaction $transaction) => (float) data_get($transaction->metadata, 'realized_pnl', 0));

        return round($realizedTradeProfit + ($positionsMarketValue - $positionsCostBasis), 8);
    }

    /**
     * @return array{cash_balance: float, profit_balance: float, available_balance: float}
     */
    private function availableWithdrawalBalances(Wallet $wallet, float $cashBalance, float $profitBalance): array
    {
        $availableBalances = [
            'cash_balance' => round($cashBalance, 8),
            'profit_balance' => round($profitBalance, 8),
        ];

        $wallet->transactions()
            ->where('type', 'withdrawal')
            ->where('status', 'pending')
            ->orderBy('occurred_at')
            ->orderBy('created_at')
            ->get(['amount'])
            ->each(function (WalletTransaction $transaction) use (&$availableBalances): void {
                $allocation = $this->allocateWithdrawal(
                    $availableBalances['cash_balance'],
                    $availableBalances['profit_balance'],
                    (float) $transaction->amount
                );

                $availableBalances['cash_balance'] = $allocation['cash_balance'];
                $availableBalances['profit_balance'] = $allocation['profit_balance'];
            });

        return [
            'cash_balance' => round(max(0.0, $availableBalances['cash_balance']), 8),
            'profit_balance' => round($availableBalances['profit_balance'], 8),
            'available_balance' => round(
                max(0.0, $availableBalances['cash_balance']) + max(0.0, $availableBalances['profit_balance']),
                8
            ),
        ];
    }

    /**
     * @return array{cash_balance: float, profit_balance: float, cash_debit: float, profit_debit: float, remaining: float}
     */
    private function allocateWithdrawal(float $cashBalance, float $profitBalance, float $amount): array
    {
        $availableProfit = max(0.0, $profitBalance);
        $profitDebit = min($availableProfit, $amount);
        $remaining = $amount - $profitDebit;

        $availableCash = max(0.0, $cashBalance);
        $cashDebit = min($availableCash, $remaining);
        $remaining -= $cashDebit;

        return [
            'cash_balance' => round($cashBalance - $cashDebit, 8),
            'profit_balance' => round($profitBalance - $profitDebit, 8),
            'cash_debit' => round($cashDebit, 8),
            'profit_debit' => round($profitDebit, 8),
            'remaining' => round($remaining, 8),
        ];
    }

    private function resolveAuthoritativeBalance(float $walletValue, float $userValue): float
    {
        $walletIsZero = $this->isEffectivelyZero($walletValue);
        $userIsZero = $this->isEffectivelyZero($userValue);

        if ($walletIsZero && ! $userIsZero) {
            return $userValue;
        }

        if ($userIsZero && ! $walletIsZero) {
            return $walletValue;
        }

        return max($walletValue, $userValue);
    }

    private function resolveCashBalance(float $walletValue, float $userValue): float
    {
        $walletIsZero = $this->isEffectivelyZero($walletValue);
        $userIsZero = $this->isEffectivelyZero($userValue);

        if ($walletIsZero && ! $userIsZero) {
            return $userValue;
        }

        if ($userIsZero && ! $walletIsZero) {
            return $walletValue;
        }

        return max($walletValue, $userValue);
    }

    /**
     * @return Collection<int, array{id: string, name: string, channel: string, currency: string, network: string|null, wallet_address: string|null, bank_details: array<string, string>|null}>
     */
    private function availableDepositMethods(): Collection
    {
        return PaymentMethod::query()
            ->whereIn('channel', ['crypto', 'bank_transfer'])
            ->where('status', 'active')
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(function (PaymentMethod $method): ?array {
                $walletAddress = $this->paymentMethodWalletAddress($method);
                $bankDetails = $this->paymentMethodBankDetails($method);
                $network = trim((string) ($method->network ?? ''));

                if ($method->channel === 'crypto' && $walletAddress === null) {
                    return null;
                }

                if ($method->channel === 'bank_transfer' && $bankDetails === null) {
                    return null;
                }

                return [
                    'id' => $method->id,
                    'name' => $method->name,
                    'channel' => $method->channel,
                    'currency' => strtoupper((string) $method->currency),
                    'network' => $network === '' ? null : $network,
                    'wallet_address' => $walletAddress,
                    'bank_details' => $bankDetails,
                ];
            })
            ->filter()
            ->values();
    }

    /**
     * @param  array<string, mixed>  $validated
     * @param  Collection<int, array{id: string, name: string, channel: string, currency: string, network: string|null, wallet_address: string|null, bank_details: array<string, string>|null}>  $methods
     * @return array{id: string, name: string, channel: string, currency: string, network: string|null, wallet_address: string|null, bank_details: array<string, string>|null}|null
     */
    private function resolveDepositMethod(array $validated, Collection $methods): ?array
    {
        if ($methods->isEmpty()) {
            return null;
        }

        $paymentMethodId = isset($validated['payment_method_id']) ? (string) $validated['payment_method_id'] : '';

        if ($paymentMethodId !== '') {
            return $methods->first(fn (array $method) => $method['id'] === $paymentMethodId);
        }

        $currency = strtoupper((string) ($validated['currency'] ?? ''));
        $network = trim((string) ($validated['network'] ?? ''));

        if ($currency === '') {
            return null;
        }

        $currencyMethods = $methods->where('currency', $currency)->values();

        if ($currencyMethods->isEmpty()) {
            return null;
        }

        if ($network === '') {
            return $currencyMethods->first();
        }

        $normalizedNetwork = $this->normalizeNetwork($network);

        return $currencyMethods->first(
            fn (array $method) => $this->normalizeNetwork((string) ($method['network'] ?? '')) === $normalizedNetwork
        );
    }

    private function paymentMethodWalletAddress(PaymentMethod $method): ?string
    {
        $legacyWalletAddress = data_get($method->settings ?? [], 'wallet_address');
        $walletAddress = trim((string) ($method->wallet_address
            ?? (is_string($legacyWalletAddress) ? $legacyWalletAddress : '')));

        return $walletAddress === '' ? null : $walletAddress;
    }

    /**
     * @return array<string, string>|null
     */
    private function paymentMethodBankDetails(PaymentMethod $method): ?array
    {
        $bankDetails = data_get($method->settings ?? [], 'bank_details');

        if (! is_array($bankDetails)) {
            return null;
        }

        $normalized = [];

        foreach (self::BANK_DETAIL_KEYS as $key) {
            $value = trim((string) ($bankDetails[$key] ?? ''));

            if ($value !== '') {
                $normalized[$key] = $value;
            }
        }

        if (
            ! isset($normalized['bank_name']) ||
            ! isset($normalized['account_name']) ||
            ! isset($normalized['account_number'])
        ) {
            return null;
        }

        return $normalized;
    }

    private function normalizeNetwork(string $network): string
    {
        return strtoupper((string) preg_replace('/[^a-z0-9]+/i', '', $network));
    }

    /**
     * @return array{id: string, name: string, channel: string, currency: string, network: string|null, wallet_address: string, bank_details: null}
     */
    private function legacyDepositMethodPayload(): array
    {
        return [
            'id' => '',
            'name' => 'Default Crypto Wallet',
            'channel' => 'crypto',
            'currency' => 'USDT',
            'network' => 'ERC 20',
            'wallet_address' => self::LEGACY_DEPOSIT_WALLET_ADDRESS,
            'bank_details' => null,
        ];
    }

    private function isEffectivelyZero(float $value): bool
    {
        return abs($value) < 0.00000001;
    }

    private function isDrifted(float $current, float $expected): bool
    {
        return abs($current - $expected) >= 0.00000001;
    }

    private function formatNumber(float $value): string
    {
        return number_format($value, 2, '.', ',');
    }
}
