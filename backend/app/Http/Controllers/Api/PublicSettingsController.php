<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Support\SiteSettings;

class PublicSettingsController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = SiteSettings::get();

        return response()->json([
            'data' => [
                'brand_name' => $settings['brand_name'] ?? null,
                'site_mode' => $settings['site_mode'],
                'deposits_enabled' => (bool) $settings['deposits_enabled'],
                'withdrawals_enabled' => (bool) $settings['withdrawals_enabled'],
                'require_kyc_for_deposits' => (bool) ($settings['require_kyc_for_deposits'] ?? false),
                'require_kyc_for_withdrawals' => (bool) $settings['require_kyc_for_withdrawals'],
                'session_timeout_minutes' => (int) $settings['session_timeout_minutes'],
                'support_email' => $settings['support_email'],
                'livechat_enabled' => (bool) $settings['livechat_enabled'],
                'livechat_provider' => $settings['livechat_provider'],
                'livechat_embed_code' => $settings['livechat_embed_code'],
            ],
        ]);
    }

    
}
