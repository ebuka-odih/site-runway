<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Notifications\UserEventNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_fetch_and_mark_notifications_as_read(): void
    {
        $user = User::factory()->create();

        $user->notify(new UserEventNotification(
            eventType: 'wallet.deposit_requested',
            title: 'Deposit request created',
            message: 'Your deposit request is waiting for proof upload.',
            actionUrl: '/dashboard/wallet',
        ));

        $user->notify(new UserEventNotification(
            eventType: 'order.buy_filled',
            title: 'Buy order filled',
            message: 'Your buy order was filled.',
            actionUrl: '/dashboard/trade',
        ));

        Sanctum::actingAs($user);

        $indexResponse = $this->getJson('/api/v1/notifications');

        $indexResponse
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.unread_count', 2);

        $notificationId = (string) $indexResponse->json('data.0.id');

        $this->patchJson('/api/v1/notifications/'.$notificationId.'/read')
            ->assertOk()
            ->assertJsonPath('meta.unread_count', 1);

        $this->postJson('/api/v1/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('meta.unread_count', 0);

        $this->assertSame(0, $user->fresh()->unreadNotifications()->count());
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $user = User::factory()->create();
        $anotherUser = User::factory()->create();

        $anotherUser->notify(new UserEventNotification(
            eventType: 'wallet.withdrawal_requested',
            title: 'Withdrawal request submitted',
            message: 'Your withdrawal request is pending admin approval.',
            actionUrl: '/dashboard/wallet',
        ));

        $notificationId = (string) $anotherUser->notifications()->latest('created_at')->value('id');

        Sanctum::actingAs($user);

        $this->patchJson('/api/v1/notifications/'.$notificationId.'/read')
            ->assertNotFound();
    }
}
