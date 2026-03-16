<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

class SiteSettings
{
    public const CACHE_KEY = 'admin_panel_settings';
    private const LEGACY_SUPPORT_EMAIL = 'support@runwayalgo.test';
    private const DEFAULT_SUPPORT_EMAIL = 'support@runwayalgo.com';

    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'site_mode' => 'live',
            'deposits_enabled' => true,
            'withdrawals_enabled' => true,
            'require_kyc_for_deposits' => false,
            'require_kyc_for_withdrawals' => true,
            'session_timeout_minutes' => 60,
            'support_email' => self::DEFAULT_SUPPORT_EMAIL,
            'livechat_enabled' => false,
            'livechat_provider' => null,
            'livechat_embed_code' => null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function get(): array
    {
        $settings = [
            ...self::defaults(),
            ...Cache::get(self::CACHE_KEY, []),
        ];

        if (($settings['support_email'] ?? null) === self::LEGACY_SUPPORT_EMAIL) {
            $settings['support_email'] = self::DEFAULT_SUPPORT_EMAIL;
        }

        return $settings;
    }
}
