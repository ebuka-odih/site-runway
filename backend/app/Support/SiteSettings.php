<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

class SiteSettings
{
    public const CACHE_KEY = 'admin_panel_settings';

    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'brand_name' => 'PrologezPrime',
            'site_mode' => 'live',
            'deposits_enabled' => true,
            'withdrawals_enabled' => true,
            'require_kyc_for_deposits' => false,
            'require_kyc_for_withdrawals' => true,
            'session_timeout_minutes' => 60,
            'support_email' => 'support@runwayalgo.test',
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
        return [
            ...self::defaults(),
            ...Cache::get(self::CACHE_KEY, []),
        ];
    }
}
