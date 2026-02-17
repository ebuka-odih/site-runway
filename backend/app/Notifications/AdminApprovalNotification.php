<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminApprovalNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $title,
        private readonly string $message,
        private readonly ?string $actionUrl = null,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject($this->title)
            ->line($this->message);

        if (is_string($this->actionUrl) && $this->actionUrl !== '') {
            $mail->action('Review request', $this->resolveActionUrl($this->actionUrl));
        }

        return $mail->line('This is an automated admin alert from RunwayAlgo.');
    }

    private function resolveActionUrl(string $actionUrl): string
    {
        if (str_starts_with($actionUrl, 'http://') || str_starts_with($actionUrl, 'https://')) {
            return $actionUrl;
        }

        return rtrim((string) config('app.url'), '/').'/'.ltrim($actionUrl, '/');
    }
}
