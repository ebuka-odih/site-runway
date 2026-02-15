<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'timezone' => ['sometimes', 'nullable', 'string', 'max:100'],
            'notification_email_alerts' => ['sometimes', 'boolean'],
            'membership_tier' => ['sometimes', 'string', 'max:30'],
            'current_password' => ['sometimes', 'required_with:new_password', 'string'],
            'new_password' => ['sometimes', 'nullable', 'string', 'min:8'],
        ];
    }
}
