<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FollowTraderRequest extends FormRequest
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
            'trader_id' => ['required', 'uuid', Rule::exists('traders', 'id')],
            'allocation_amount' => ['sometimes', 'numeric', 'gte:0'],
            'copy_ratio' => ['required', 'numeric', 'between:0.5,5'],
        ];
    }
}
