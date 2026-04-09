<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWithdrawalRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $payoutMethod = (string) ($this->input('payout_method') ?: 'crypto');

        $this->merge([
            'payout_method' => $payoutMethod,
        ]);
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'gt:0'],
            'currency' => ['required', 'string', Rule::in(['USD', 'USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'XRP', 'BNB'])],
            'payout_method' => ['required', 'string', Rule::in(['crypto', 'bank_transfer'])],
            'network' => ['nullable', 'string', 'max:20'],
            'destination' => ['nullable', 'string', 'max:255', Rule::requiredIf(fn () => $this->input('payout_method') === 'crypto')],
            'bank_name' => ['nullable', 'string', 'max:120', Rule::requiredIf(fn () => $this->input('payout_method') === 'bank_transfer')],
            'account_name' => ['nullable', 'string', 'max:160', Rule::requiredIf(fn () => $this->input('payout_method') === 'bank_transfer')],
            'account_number' => ['nullable', 'string', 'max:60', Rule::requiredIf(fn () => $this->input('payout_method') === 'bank_transfer')],
            'routing_number' => ['nullable', 'string', 'max:60'],
            'swift_code' => ['nullable', 'string', 'max:60'],
            'bank_address' => ['nullable', 'string', 'max:255'],
            'asset_id' => ['nullable', 'uuid', Rule::exists('assets', 'id')],
        ];
    }
}
