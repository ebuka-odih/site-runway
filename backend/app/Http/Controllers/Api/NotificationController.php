<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'limit' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'unread_only' => ['sometimes', 'boolean'],
        ]);

        $limit = (int) ($validated['limit'] ?? 20);
        $unreadOnly = (bool) ($validated['unread_only'] ?? false);

        $query = $request->user()->notifications()->latest('created_at');

        if ($unreadOnly) {
            $query->whereNull('read_at');
        }

        $notifications = $query->limit($limit)->get();

        return response()->json([
            'data' => $notifications->map(fn (DatabaseNotification $notification) => $this->transformNotification($notification)),
            'meta' => [
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ],
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'message' => 'All notifications marked as read.',
            'meta' => [
                'unread_count' => 0,
            ],
        ]);
    }

    public function markRead(Request $request, string $notificationId): JsonResponse
    {
        /** @var DatabaseNotification $notification */
        $notification = $request->user()->notifications()->whereKey($notificationId)->firstOrFail();

        if ($notification->read_at === null) {
            $notification->markAsRead();
            $notification->refresh();
        }

        return response()->json([
            'message' => 'Notification marked as read.',
            'data' => $this->transformNotification($notification),
            'meta' => [
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformNotification(DatabaseNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'event_type' => (string) data_get($notification->data, 'event_type', 'system'),
            'title' => (string) data_get($notification->data, 'title', 'Notification'),
            'message' => (string) data_get($notification->data, 'message', ''),
            'action_url' => data_get($notification->data, 'action_url'),
            'metadata' => data_get($notification->data, 'metadata', []),
            'created_at' => $notification->created_at?->toIso8601String(),
            'read_at' => $notification->read_at?->toIso8601String(),
        ];
    }
}
