<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

class SiteSettings
{
    public const CACHE_KEY = 'admin_panel_settings';
    public const DEFAULT_LIVECHAT_PROVIDER = 'Chaport';
    public const DEFAULT_LIVECHAT_EMBED_CODE = <<<'HTML'
<!-- Begin of Chaport Live Chat code -->
<script type="text/javascript">
(function(w,d,v3){
w.chaportConfig = {
  appId : '69df2dae49b709eaaf2beb08',
};

if(w.chaport)return;v3=w.chaport={};v3._q=[];v3._l={};v3.q=function(){v3._q.push(arguments)};v3.on=function(e,fn){if(!v3._l[e])v3._l[e]=[];v3._l[e].push(fn)};var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://app.chaport.com/javascripts/insert.js';var ss=d.getElementsByTagName('script')[0];ss.parentNode.insertBefore(s,ss)})(window, document);
</script>
<!-- End of Chaport Live Chat code -->
HTML;

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
            'support_email' => 'support@prologezprime.com',
            'admin_notification_email' => null,
            'livechat_enabled' => false,
            'livechat_provider' => self::DEFAULT_LIVECHAT_PROVIDER,
            'livechat_embed_code' => self::DEFAULT_LIVECHAT_EMBED_CODE,
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
