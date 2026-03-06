<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification as NotificationFacade;

class AdminActionNotificationRouter
{
    public static function send(Notification $notification): void
    {
        $admins = self::resolveAdminRecipients();
        $adminEmails = $admins
            ->pluck('email')
            ->filter(fn ($email) => is_string($email) && $email !== '')
            ->map(fn (string $email) => mb_strtolower(trim($email)))
            ->values();

        if ($admins->isNotEmpty()) {
            NotificationFacade::send($admins, $notification);
        }

        $settings = SiteSettings::get();
        $configuredEmail = trim((string) ($settings['admin_notification_email'] ?? ''));

        if ($configuredEmail !== '' && ! $adminEmails->contains(mb_strtolower($configuredEmail))) {
            NotificationFacade::route('mail', $configuredEmail)->notify($notification);
        }

        if ($admins->isEmpty() && $configuredEmail === '') {
            $supportEmail = trim((string) ($settings['support_email'] ?? ''));

            if ($supportEmail !== '') {
                NotificationFacade::route('mail', $supportEmail)->notify($notification);
            }
        }
    }

    /**
     * @return Collection<int, User>
     */
    private static function resolveAdminRecipients(): Collection
    {
        return User::query()
            ->where('is_admin', true)
            ->get()
            ->filter(function (User $user): bool {
                return is_string($user->email) && trim($user->email) !== '';
            })
            ->unique(fn (User $user) => mb_strtolower(trim((string) $user->email)))
            ->values();
    }
}
