<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AuthOtpNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $otp,
        private readonly string $purpose,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        [$subject, $headline] = match ($this->purpose) {
            'email_verification' => [
                'Verify your email address',
                'Use this one-time password to verify your account.',
            ],
            'kyc_verification' => [
                'KYC verification OTP',
                'Use this one-time password to complete your KYC submission.',
            ],
            default => [
                'Password reset OTP',
                'Use this one-time password to reset your password.',
            ],
        };

        return (new MailMessage)
            ->subject($subject)
            ->line($headline)
            ->line("OTP: {$this->otp}")
            ->line('This code expires in 10 minutes.')
            ->line('If you did not request this, you can ignore this message.');
    }
}
