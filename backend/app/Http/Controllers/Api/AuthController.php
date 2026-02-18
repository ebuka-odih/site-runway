<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use App\Notifications\AuthOtpNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const OTP_EXPIRY_MINUTES = 10;

    private const DEFAULT_COUNTRY = 'United States';

    private const DEFAULT_CURRENCY = 'USD';

    private const PENDING_REGISTRATION_CACHE_PREFIX = 'auth:pending_registration:';

    /**
     * @var array<int, string>
     */
    private const ALLOWED_SIGNUP_CURRENCIES = [
        'USD',
        'EUR',
        'GBP',
    ];

    public function login(LoginRequest $request): JsonResponse
    {
        $normalizedEmail = strtolower((string) $request->string('email'));
        $user = User::query()->where('email', $normalizedEmail)->first();

        if (! $user) {
            if ($this->pendingRegistrationPayload($normalizedEmail) !== null) {
                return response()->json([
                    'message' => 'Email verification is pending. Complete OTP verification to continue.',
                    'requires_verification' => true,
                ], 403);
            }

            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 422);
        }

        if (! Hash::check($request->string('password'), $user->password)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 422);
        }

        if (! $user->email_verified_at) {
            return response()->json([
                'message' => 'Email is not verified yet. Complete OTP verification to continue.',
                'requires_verification' => true,
            ], 403);
        }

        $token = $user->createToken($request->string('device_name', 'web-client'))->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->authUser($user),
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'alpha_dash', 'min:3', 'max:30', Rule::unique('users', 'username')],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'country' => ['nullable', 'string', 'max:120'],
            'currency' => ['nullable', 'string', Rule::in(self::ALLOWED_SIGNUP_CURRENCIES)],
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'max:100'],
        ]);

        $normalizedCountry = $this->normalizeCountry($validated['country'] ?? null);
        $normalizedCurrency = $this->normalizeCurrency($validated['currency'] ?? null);
        $normalizedEmail = strtolower($validated['email']);

        $pendingRegistration = [
            'username' => $validated['username'],
            'name' => $validated['name'],
            'email' => $normalizedEmail,
            'country' => $normalizedCountry,
            'phone' => $validated['phone'],
            'password_hash' => Hash::make($validated['password']),
            'currency' => $normalizedCurrency,
        ];

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(self::OTP_EXPIRY_MINUTES);
        $cacheKey = $this->pendingRegistrationCacheKey($normalizedEmail);

        Cache::put($cacheKey, [
            'registration' => $pendingRegistration,
            'otp_hash' => Hash::make($otp),
            'otp_expires_at' => $expiresAt->toIso8601String(),
        ], $expiresAt);

        $this->dispatchOtpToEmail($normalizedEmail, $otp, 'email_verification');

        return response()->json(array_merge([
            'message' => 'Verification OTP sent. Verify your email to complete account creation.',
            'email' => $normalizedEmail,
            'otp_expires_in_minutes' => self::OTP_EXPIRY_MINUTES,
        ], $this->debugOtpPayload($otp)), 201);
    }

    public function verifyEmailOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'otp' => ['required', 'digits:6'],
            'device_name' => ['sometimes', 'string', 'max:100'],
        ]);

        $normalizedEmail = strtolower($validated['email']);

        /** @var User|null $user */
        $user = User::query()->where('email', $normalizedEmail)->first();

        if (! $user) {
            $pendingRegistration = $this->pendingRegistrationPayload($normalizedEmail);

            if ($pendingRegistration === null) {
                throw ValidationException::withMessages([
                    'email' => ['No pending account exists for this email address. Register first.'],
                ]);
            }

            $this->assertValidOtp(
                $validated['otp'],
                is_string($pendingRegistration['otp_hash'] ?? null) ? $pendingRegistration['otp_hash'] : null,
                $pendingRegistration['otp_expires_at'] ?? null,
                'The verification code is invalid or expired.',
            );

            $registration = $pendingRegistration['registration'] ?? null;

            if (! is_array($registration)) {
                throw ValidationException::withMessages([
                    'email' => ['Registration payload is invalid or expired. Please register again.'],
                ]);
            }

            if (User::query()->where('email', $normalizedEmail)->exists()) {
                throw ValidationException::withMessages([
                    'email' => ['An account with this email already exists. Please log in instead.'],
                ]);
            }

            if (User::query()->where('username', (string) ($registration['username'] ?? ''))->exists()) {
                throw ValidationException::withMessages([
                    'username' => ['This username is no longer available. Please register again with a different username.'],
                ]);
            }

            /** @var array{user: User, token: string} $creation */
            $creation = DB::transaction(function () use ($registration, $normalizedEmail, $validated): array {
                $user = User::query()->create([
                    'username' => (string) ($registration['username'] ?? ''),
                    'name' => (string) ($registration['name'] ?? ''),
                    'email' => $normalizedEmail,
                    'country' => (string) ($registration['country'] ?? self::DEFAULT_COUNTRY),
                    'phone' => (string) ($registration['phone'] ?? ''),
                    'password' => (string) ($registration['password_hash'] ?? ''),
                    'membership_tier' => 'free',
                    'kyc_status' => 'pending',
                    'notification_email_alerts' => true,
                    'timezone' => null,
                    'email_verified_at' => now(),
                    'email_otp_code' => null,
                    'email_otp_expires_at' => null,
                ]);

                $user->wallet()->firstOrCreate([], [
                    'currency' => (string) ($registration['currency'] ?? self::DEFAULT_CURRENCY),
                ]);

                $token = $user->createToken($validated['device_name'] ?? 'web-client')->plainTextToken;

                return [
                    'user' => $user,
                    'token' => $token,
                ];
            });

            Cache::forget($this->pendingRegistrationCacheKey($normalizedEmail));

            return response()->json([
                'message' => 'Email verified successfully.',
                'token' => $creation['token'],
                'token_type' => 'Bearer',
                'user' => $this->authUser($creation['user']),
            ]);
        }

        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email is already verified.',
            ]);
        }

        $this->assertValidOtp(
            $validated['otp'],
            $user->email_otp_code,
            $user->email_otp_expires_at,
            'The verification code is invalid or expired.',
        );

        $user->forceFill([
            'email_verified_at' => now(),
            'email_otp_code' => null,
            'email_otp_expires_at' => null,
        ])->save();

        $token = $user->createToken($validated['device_name'] ?? 'web-client')->plainTextToken;

        return response()->json([
            'message' => 'Email verified successfully.',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->authUser($user),
        ]);
    }

    public function resendEmailOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $normalizedEmail = strtolower($validated['email']);

        /** @var User|null $user */
        $user = User::query()->where('email', $normalizedEmail)->first();

        if (! $user) {
            $pendingRegistration = $this->pendingRegistrationPayload($normalizedEmail);

            if ($pendingRegistration === null || ! is_array($pendingRegistration['registration'] ?? null)) {
                throw ValidationException::withMessages([
                    'email' => ['No pending account exists for this email address. Register first.'],
                ]);
            }

            $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $expiresAt = now()->addMinutes(self::OTP_EXPIRY_MINUTES);

            Cache::put($this->pendingRegistrationCacheKey($normalizedEmail), [
                'registration' => $pendingRegistration['registration'],
                'otp_hash' => Hash::make($otp),
                'otp_expires_at' => $expiresAt->toIso8601String(),
            ], $expiresAt);

            $this->dispatchOtpToEmail($normalizedEmail, $otp, 'email_verification');

            return response()->json(array_merge([
                'message' => 'A new verification code has been sent.',
                'otp_expires_in_minutes' => self::OTP_EXPIRY_MINUTES,
            ], $this->debugOtpPayload($otp)));
        }

        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email is already verified.',
            ], 422);
        }

        $otp = $this->issueOtp($user, 'email_verification');

        return response()->json(array_merge([
            'message' => 'A new verification code has been sent.',
            'otp_expires_in_minutes' => self::OTP_EXPIRY_MINUTES,
        ], $this->debugOtpPayload($otp)));
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        /** @var User|null $user */
        $user = User::query()->where('email', strtolower($validated['email']))->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['No account exists for this email address.'],
            ]);
        }

        $otp = $this->issueOtp($user, 'password_reset');

        return response()->json(array_merge([
            'message' => 'Password reset OTP sent to your email.',
            'otp_expires_in_minutes' => self::OTP_EXPIRY_MINUTES,
        ], $this->debugOtpPayload($otp)));
    }

    public function resetPasswordWithOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'otp' => ['required', 'digits:6'],
            'password' => ['required', 'string', 'min:8', 'max:100'],
        ]);

        /** @var User|null $user */
        $user = User::query()->where('email', strtolower($validated['email']))->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['No account exists for this email address.'],
            ]);
        }

        $this->assertValidOtp(
            $validated['otp'],
            $user->password_reset_otp_code,
            $user->password_reset_otp_expires_at,
            'The password reset code is invalid or expired.',
        );

        $user->forceFill([
            'password' => $validated['password'],
            'password_reset_otp_code' => null,
            'password_reset_otp_expires_at' => null,
        ])->save();

        $user->tokens()->delete();

        return response()->json([
            'message' => 'Password has been reset successfully.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => $this->authUser($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function authUser(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'country' => $user->country,
            'phone' => $user->phone,
            'timezone' => $user->timezone,
            'membership_tier' => $user->membership_tier,
            'kyc_status' => $user->kyc_status,
            'notification_email_alerts' => $user->notification_email_alerts,
        ];
    }

    private function issueOtp(User $user, string $purpose): string
    {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(self::OTP_EXPIRY_MINUTES);

        if ($purpose === 'email_verification') {
            $user->forceFill([
                'email_otp_code' => Hash::make($otp),
                'email_otp_expires_at' => $expiresAt,
            ])->save();
        } else {
            $user->forceFill([
                'password_reset_otp_code' => Hash::make($otp),
                'password_reset_otp_expires_at' => $expiresAt,
            ])->save();
        }

        $user->notify(new AuthOtpNotification($otp, $purpose));

        return $otp;
    }

    private function dispatchOtpToEmail(string $email, string $otp, string $purpose): void
    {
        Notification::route('mail', $email)->notify(new AuthOtpNotification($otp, $purpose));
    }

    private function pendingRegistrationCacheKey(string $email): string
    {
        return self::PENDING_REGISTRATION_CACHE_PREFIX.sha1(strtolower(trim($email)));
    }

    /**
     * @return array<string, mixed>|null
     */
    private function pendingRegistrationPayload(string $email): ?array
    {
        $payload = Cache::get($this->pendingRegistrationCacheKey($email));

        return is_array($payload) ? $payload : null;
    }

    private function assertValidOtp(string $otp, ?string $hashedOtp, mixed $expiresAt, string $message): void
    {
        $expiresAtTimestamp = null;

        if ($expiresAt instanceof \DateTimeInterface) {
            $expiresAtTimestamp = $expiresAt;
        } elseif (is_string($expiresAt)) {
            try {
                $expiresAtTimestamp = now()->parse($expiresAt);
            } catch (\Throwable) {
                $expiresAtTimestamp = null;
            }
        }

        if (! $hashedOtp || ! $expiresAtTimestamp || now()->greaterThan($expiresAtTimestamp) || ! Hash::check($otp, $hashedOtp)) {
            throw ValidationException::withMessages([
                'otp' => [$message],
            ]);
        }
    }

    /**
     * @return array<string, string>
     */
    private function debugOtpPayload(string $otp): array
    {
        if (app()->environment(['local', 'testing'])) {
            return ['debug_otp' => $otp];
        }

        return [];
    }

    private function normalizeCountry(?string $country): string
    {
        $normalized = trim((string) $country);

        if ($normalized === '') {
            return self::DEFAULT_COUNTRY;
        }

        if (in_array(strtoupper($normalized), self::ALLOWED_SIGNUP_CURRENCIES, true)) {
            return self::DEFAULT_COUNTRY;
        }

        return substr($normalized, 0, 120);
    }

    private function normalizeCurrency(?string $currency): string
    {
        $normalized = strtoupper(trim((string) $currency));

        if ($normalized === '') {
            return self::DEFAULT_CURRENCY;
        }

        if (! in_array($normalized, self::ALLOWED_SIGNUP_CURRENCIES, true)) {
            return self::DEFAULT_CURRENCY;
        }

        return $normalized;
    }
}
