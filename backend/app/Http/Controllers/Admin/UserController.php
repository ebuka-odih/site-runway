<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $role = (string) $request->string('role', 'all');
        $verification = (string) $request->string('verification', 'all');

        $users = User::query()
            ->select([
                'id',
                'username',
                'name',
                'email',
                'phone',
                'balance',
                'profit_balance',
                'holding_balance',
                'country',
                'is_admin',
                'membership_tier',
                'kyc_status',
                'timezone',
                'notification_email_alerts',
                'email_verified_at',
                'created_at',
            ])
            ->withCount(['orders', 'positions'])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery
                        ->whereLike('name', "%{$search}%")
                        ->orWhereLike('email', "%{$search}%")
                        ->orWhereLike('username', "%{$search}%")
                        ->orWhereLike('phone', "%{$search}%")
                        ->orWhereLike('country', "%{$search}%");

                    if (Str::isUuid($search)) {
                        $innerQuery->orWhere('id', $search);
                    }
                });
            })
            ->when($role === 'admin', fn ($query) => $query->where('is_admin', true))
            ->when($role === 'user', fn ($query) => $query->where('is_admin', false))
            ->when($verification === 'verified', fn ($query) => $query->whereNotNull('email_verified_at'))
            ->when($verification === 'unverified', fn ($query) => $query->whereNull('email_verified_at'))
            ->latest('created_at')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (User $user) => $this->userPayload($user));

        $stats = [
            'total_users' => User::query()->count(),
            'admin_users' => User::query()->where('is_admin', true)->count(),
            'verified_users' => User::query()->whereNotNull('email_verified_at')->count(),
            'pending_kyc' => User::query()->where('kyc_status', 'pending')->count(),
        ];

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role' => $role,
                'verification' => $verification,
            ],
            'stats' => $stats,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Admin/Users/Create', [
            'options' => $this->formOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate(array_merge(
            $this->commonRules(),
            [
                'password' => ['required', 'string', 'min:8', 'max:100', 'confirmed'],
            ]
        ));

        User::query()->create([
            ...$this->fillableUserValues($validated),
            'password' => $validated['password'],
            'email_verified_at' => $validated['email_verified'] ? now() : null,
        ]);

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'User has been created successfully.');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Admin/Users/Edit', [
            'user' => $this->userPayload($user),
            'options' => $this->formOptions(),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        if ($request->input('password') === '') {
            $request->merge([
                'password' => null,
                'password_confirmation' => null,
            ]);
        }

        $validated = $request->validate(array_merge(
            $this->commonRules($user),
            [
                'password' => ['nullable', 'string', 'min:8', 'max:100', 'confirmed'],
            ]
        ));

        if ($request->user()?->is($user) && ! $validated['is_admin']) {
            return back()->with('error', 'You cannot remove your own admin access.');
        }

        if (
            $user->is_admin &&
            ! $validated['is_admin'] &&
            User::query()->where('is_admin', true)->count() <= 1
        ) {
            return back()->with('error', 'At least one admin account must remain.');
        }

        $attributes = [
            ...$this->fillableUserValues($validated),
            'email_verified_at' => $validated['email_verified']
                ? ($user->email_verified_at ?? now())
                : null,
        ];

        if (! empty($validated['password'])) {
            $attributes['password'] = $validated['password'];
        }

        $user->update($attributes);

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'User has been updated successfully.');
    }

    public function fund(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'target' => ['required', 'string', Rule::in(['balance', 'profit_balance', 'holding_balance'])],
            'amount' => ['required', 'numeric', 'gt:0'],
            'notes' => ['nullable', 'string', 'max:255'],
            'redirect_to' => ['sometimes', 'string', Rule::in(['index', 'edit'])],
        ]);

        $amount = round((float) $validated['amount'], 8);

        DB::transaction(function () use ($request, $user, $validated, $amount) {
            $lockedUser = User::query()
                ->whereKey($user->id)
                ->lockForUpdate()
                ->firstOrFail();

            $wallet = Wallet::query()->firstOrCreate(
                ['user_id' => $lockedUser->id],
                [
                    'cash_balance' => 0,
                    'investing_balance' => 0,
                    'profit_loss' => 0,
                    'currency' => 'USD',
                ],
            );

            $wallet = Wallet::query()
                ->whereKey($wallet->id)
                ->lockForUpdate()
                ->firstOrFail();

            [$walletColumn, $transactionType, $defaultNotes] = $this->fundingTargetConfig($validated['target']);

            $lockedUser->{$validated['target']} = (float) $lockedUser->{$validated['target']} + $amount;
            $wallet->{$walletColumn} = (float) $wallet->{$walletColumn} + $amount;

            $lockedUser->save();
            $wallet->save();

            WalletTransaction::query()->create([
                'wallet_id' => $wallet->id,
                'type' => $transactionType,
                'status' => 'approved',
                'direction' => 'credit',
                'amount' => $amount,
                'notes' => trim((string) ($validated['notes'] ?? '')) ?: $defaultNotes,
                'occurred_at' => now(),
                'metadata' => [
                    'funding_target' => $validated['target'],
                    'funded_by_admin_id' => $request->user()?->id,
                ],
            ]);
        });

        $message = sprintf(
            'Successfully funded %s with $%s.',
            $this->fundingTargetLabel($validated['target']),
            number_format($amount, 2, '.', ',')
        );

        if (($validated['redirect_to'] ?? 'edit') === 'index') {
            return redirect()
                ->route('admin.users.index')
                ->with('success', $message);
        }

        return redirect()
            ->route('admin.users.edit', $user)
            ->with('success', $message);
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()?->is($user)) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        if ($user->is_admin && User::query()->where('is_admin', true)->count() <= 1) {
            return back()->with('error', 'At least one admin account must remain.');
        }

        $user->delete();

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'User has been deleted successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'country' => $user->country,
            'is_admin' => (bool) $user->is_admin,
            'balance' => (float) $user->balance,
            'profit_balance' => (float) $user->profit_balance,
            'holding_balance' => (float) $user->holding_balance,
            'membership_tier' => $user->membership_tier,
            'kyc_status' => $user->kyc_status,
            'timezone' => $user->timezone,
            'notification_email_alerts' => (bool) $user->notification_email_alerts,
            'email_verified' => (bool) $user->email_verified_at,
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            'fund_url' => route('admin.users.fund', $user),
            'orders_count' => $user->orders_count ?? $user->orders()->count(),
            'positions_count' => $user->positions_count ?? $user->positions()->count(),
            'created_at' => $user->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array{string, string, string}
     */
    private function fundingTargetConfig(string $target): array
    {
        return match ($target) {
            'balance' => ['cash_balance', 'deposit', 'Admin funded balance from user management'],
            'profit_balance' => ['profit_loss', 'copy_pnl', 'Admin funded profit balance from user management'],
            'holding_balance' => ['investing_balance', 'copy_allocation', 'Admin funded holding balance from user management'],
            default => ['cash_balance', 'deposit', 'Admin funded balance from user management'],
        };
    }

    private function fundingTargetLabel(string $target): string
    {
        return match ($target) {
            'balance' => 'balance',
            'profit_balance' => 'profit balance',
            'holding_balance' => 'holding balance',
            default => 'balance',
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'countries' => ['United States', 'United Kingdom', 'Canada'],
            'membership_tiers' => ['free', 'pro'],
            'kyc_statuses' => ['pending', 'verified', 'rejected'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function fillableUserValues(array $validated): array
    {
        return [
            'username' => strtolower($validated['username']),
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'] ?: null,
            'country' => $validated['country'] ?: null,
            'membership_tier' => $validated['membership_tier'],
            'kyc_status' => $validated['kyc_status'],
            'timezone' => $validated['timezone'] ?: null,
            'notification_email_alerts' => (bool) $validated['notification_email_alerts'],
            'is_admin' => (bool) $validated['is_admin'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function commonRules(?User $user = null): array
    {
        return [
            'username' => [
                'required',
                'string',
                'alpha_dash',
                'min:3',
                'max:30',
                Rule::unique('users', 'username')->ignore($user?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user?->id),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'country' => ['nullable', 'string', 'max:120'],
            'membership_tier' => ['required', 'string', Rule::in(['free', 'pro'])],
            'kyc_status' => ['required', 'string', Rule::in(['pending', 'verified', 'rejected'])],
            'timezone' => ['nullable', 'timezone'],
            'notification_email_alerts' => ['required', 'boolean'],
            'email_verified' => ['required', 'boolean'],
            'is_admin' => ['required', 'boolean'],
        ];
    }
}
