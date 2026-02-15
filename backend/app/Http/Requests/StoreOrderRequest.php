<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
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
            'asset_id' => ['required', 'uuid', Rule::exists('assets', 'id')],
            'side' => ['required', Rule::in(['buy', 'sell'])],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'order_type' => ['sometimes', Rule::in(['market', 'limit'])],
            'requested_price' => ['sometimes', 'nullable', 'numeric', 'gt:0'],
            'metadata' => ['sometimes', 'array'],
        ];
    }
}
