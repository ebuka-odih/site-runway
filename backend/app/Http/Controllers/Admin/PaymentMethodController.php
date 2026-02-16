<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DepositRequest;
use App\Models\PaymentMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $channel = (string) $request->string('channel', 'all');
        $status = (string) $request->string('status', 'all');

        if (! in_array($channel, ['all', ...$this->channels()], true)) {
            $channel = 'all';
        }

        $methods = PaymentMethod::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery
                        ->whereLike('name', "%{$search}%")
                        ->orWhereLike('channel', "%{$search}%")
                        ->orWhereLike('currency', "%{$search}%")
                        ->orWhereLike('network', "%{$search}%")
                        ->orWhereLike('wallet_address', "%{$search}%");
                });
            })
            ->when($channel !== 'all', fn ($query) => $query->where('channel', $channel))
            ->when($status === 'active', fn ($query) => $query->where('status', 'active'))
            ->when($status === 'inactive', fn ($query) => $query->where('status', 'inactive'))
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (PaymentMethod $method) => $this->methodPayload($method));

        $usage = DepositRequest::query()
            ->selectRaw('currency, COUNT(*) as requests_count, SUM(amount) as total_amount')
            ->groupBy('currency')
            ->orderByDesc('requests_count')
            ->get()
            ->map(fn (DepositRequest $request) => [
                'currency' => $request->currency,
                'requests_count' => (int) $request->requests_count,
                'total_amount' => (float) $request->total_amount,
            ]);

        $stats = [
            'total' => PaymentMethod::query()->count(),
            'active' => PaymentMethod::query()->where('status', 'active')->count(),
            'inactive' => PaymentMethod::query()->where('status', 'inactive')->count(),
        ];

        return Inertia::render('Admin/PaymentMethods/Index', [
            'methods' => $methods,
            'filters' => [
                'search' => $search,
                'channel' => $channel,
                'status' => $status,
            ],
            'filter_options' => [
                'channels' => ['all', ...$this->channels()],
                'statuses' => ['all', 'active', 'inactive'],
            ],
            'stats' => $stats,
            'usage' => $usage,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/PaymentMethods/Create', [
            'options' => $this->formOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        PaymentMethod::query()->create($this->fillableValues($validated));

        return redirect()
            ->route('admin.payment-methods.index')
            ->with('success', 'Payment method created successfully.');
    }

    public function edit(PaymentMethod $paymentMethod): Response
    {
        return Inertia::render('Admin/PaymentMethods/Edit', [
            'method' => $this->methodPayload($paymentMethod),
            'options' => $this->formOptions(),
        ]);
    }

    public function update(Request $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        $paymentMethod->update($this->fillableValues($validated));

        return redirect()
            ->route('admin.payment-methods.index')
            ->with('success', 'Payment method updated successfully.');
    }

    public function destroy(PaymentMethod $paymentMethod): RedirectResponse
    {
        $paymentMethod->delete();

        return redirect()
            ->route('admin.payment-methods.index')
            ->with('success', 'Payment method deleted successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function methodPayload(PaymentMethod $method): array
    {
        $legacyWalletAddress = data_get($method->settings ?? [], 'wallet_address');

        return [
            'id' => $method->id,
            'name' => $method->name,
            'channel' => $method->channel,
            'currency' => $method->currency,
            'network' => $method->network,
            'wallet_address' => $method->wallet_address
                ?? (is_string($legacyWalletAddress) ? $legacyWalletAddress : null),
            'status' => $method->status,
            'description' => $method->description,
            'display_order' => $method->display_order,
            'created_at' => $method->created_at?->toIso8601String(),
            'updated_at' => $method->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function fillableValues(array $validated): array
    {
        return [
            'name' => $validated['name'],
            'channel' => $validated['channel'],
            'currency' => strtoupper((string) $validated['currency']),
            'network' => $validated['network'] ?: null,
            'wallet_address' => $validated['channel'] === 'crypto'
                ? ($validated['wallet_address'] ?: null)
                : null,
            'status' => $validated['status'],
            'description' => $validated['description'] ?: null,
            'display_order' => (int) ($validated['display_order'] ?? 0),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'channel' => ['required', 'string', Rule::in($this->channels())],
            'currency' => ['required', 'string', 'max:10'],
            'network' => ['nullable', 'string', 'max:40'],
            'wallet_address' => ['nullable', 'string', 'max:255', 'required_if:channel,crypto'],
            'status' => ['required', 'string', Rule::in(['active', 'inactive'])],
            'description' => ['nullable', 'string', 'max:1000'],
            'display_order' => ['nullable', 'integer', 'min:0', 'max:100000'],
        ];
    }

    /**
     * @return array<int, string>
     */
    private function channels(): array
    {
        return ['bank_transfer', 'crypto', 'card', 'wallet', 'other'];
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'channels' => $this->channels(),
            'statuses' => ['active', 'inactive'],
        ];
    }
}
