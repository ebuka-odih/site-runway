<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserEventNotification extends Notification
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function __construct(
        private readonly string $eventType,
        private readonly string $title,
        private readonly string $message,
        private readonly array $metadata = [],
        private readonly ?string $actionUrl = null,
        private readonly bool $sendEmail = false,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if ($this->sendEmail && (bool) data_get($notifiable, 'notification_email_alerts', false)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'event_type' => $this->eventType,
            'title' => $this->title,
            'message' => $this->message,
            'action_url' => $this->actionUrl,
            'metadata' => $this->metadata,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject($this->title)
            ->greeting('Hi '.trim((string) data_get($notifiable, 'name', 'there')).',')
            ->line($this->message);

        if (is_string($this->actionUrl) && $this->actionUrl !== '') {
            $mail->action('Open dashboard', $this->resolveActionUrl($this->actionUrl));
        }

        return $mail->line('This is an automated account update from RunwayAlgo.');
    }

    private function resolveActionUrl(string $actionUrl): string
    {
        if (str_starts_with($actionUrl, 'http://') || str_starts_with($actionUrl, 'https://')) {
            return $actionUrl;
        }

        return rtrim((string) config('app.url'), '/').'/'.ltrim($actionUrl, '/');
    }
}
