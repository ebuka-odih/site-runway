<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDepositRequest extends FormRequest
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
            'payment_method_id' => ['nullable', 'uuid', Rule::exists('payment_methods', 'id')],
            'currency' => ['required_without:payment_method_id', 'string', 'max:10'],
            'network' => ['nullable', 'string', 'max:40'],
            'asset_id' => ['nullable', 'uuid', Rule::exists('assets', 'id')],
        ];
    }
}
