<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'timezone' => $user->timezone,
                'membership_tier' => $user->membership_tier,
                'kyc_status' => $user->kyc_status,
                'notification_email_alerts' => $user->notification_email_alerts,
                'security' => [
                    'two_factor_enabled' => false,
                    'password_last_changed_at' => optional($user->updated_at)->toIso8601String(),
                ],
            ],
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if (! empty($validated['new_password'])) {
            if (empty($validated['current_password']) || ! Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'Current password is incorrect.',
                ], 422);
            }

            $user->password = $validated['new_password'];
        }

        unset($validated['current_password'], $validated['new_password']);

        if ($validated !== []) {
            $user->fill($validated);
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'timezone' => $user->timezone,
                'membership_tier' => $user->membership_tier,
                'kyc_status' => $user->kyc_status,
                'notification_email_alerts' => $user->notification_email_alerts,
            ],
        ]);
    }
}
