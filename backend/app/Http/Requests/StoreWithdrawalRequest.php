<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWithdrawalRequest extends FormRequest
{
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
            'network' => ['nullable', 'string', 'max:20'],
            'destination' => ['required', 'string', 'max:255'],
            'asset_id' => ['nullable', 'uuid', Rule::exists('assets', 'id')],
        ];
    }
}
