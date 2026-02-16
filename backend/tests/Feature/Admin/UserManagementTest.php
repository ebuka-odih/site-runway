<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_and_access_dashboard(): void
    {
        $admin = User::factory()->admin()->create([
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $this->post('/admin/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])->assertRedirect(route('admin.dashboard'));

        $this->assertAuthenticatedAs($admin);

        $this->get('/admin')->assertOk();
    }

    public function test_non_admin_cannot_access_admin_dashboard(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/admin')
            ->assertForbidden();
    }

    public function test_admin_can_create_update_and_delete_users(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin);

        $this->post('/admin/users', [
            'username' => 'managed_user',
            'name' => 'Managed User',
            'email' => 'managed@example.com',
            'phone' => '+1 555 000 1111',
            'country' => 'United States',
            'membership_tier' => 'pro',
            'kyc_status' => 'pending',
            'timezone' => 'UTC',
            'password' => 'strong-pass-123',
            'password_confirmation' => 'strong-pass-123',
            'notification_email_alerts' => true,
            'email_verified' => true,
            'is_admin' => false,
        ])->assertRedirect(route('admin.users.index'));

        $createdUser = User::query()->where('email', 'managed@example.com')->firstOrFail();

        $this->assertDatabaseHas('users', [
            'id' => $createdUser->id,
            'name' => 'Managed User',
            'is_admin' => false,
            'membership_tier' => 'pro',
        ]);

        $this->put("/admin/users/{$createdUser->id}", [
            'username' => 'managed_user',
            'name' => 'Managed User Updated',
            'email' => 'managed@example.com',
            'phone' => '+1 555 000 2222',
            'country' => 'Canada',
            'membership_tier' => 'free',
            'kyc_status' => 'verified',
            'timezone' => 'America/Toronto',
            'password' => '',
            'password_confirmation' => '',
            'notification_email_alerts' => false,
            'email_verified' => true,
            'is_admin' => true,
        ])->assertRedirect(route('admin.users.index'));

        $this->assertDatabaseHas('users', [
            'id' => $createdUser->id,
            'name' => 'Managed User Updated',
            'country' => 'Canada',
            'is_admin' => true,
            'kyc_status' => 'verified',
        ]);

        $this->delete("/admin/users/{$createdUser->id}")
            ->assertRedirect(route('admin.users.index'));

        $this->assertDatabaseMissing('users', [
            'id' => $createdUser->id,
        ]);
    }

    public function test_admin_can_search_users_by_name_email_or_phone(): void
    {
        $admin = User::factory()->admin()->create();

        $match = User::factory()->create([
            'name' => 'Search Target',
            'email' => 'target@example.com',
            'phone' => '+1 222 333 4444',
        ]);

        User::factory()->create([
            'name' => 'Another User',
            'email' => 'another@example.com',
            'phone' => '+1 999 888 7777',
        ]);

        $this->actingAs($admin)
            ->get('/admin/users?search=target@example.com')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Users/Index')
                ->has('users.data', 1)
                ->where('users.data.0.id', $match->id)
            );

        $this->actingAs($admin)
            ->get('/admin/users?search=+1%20222%20333%204444')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Users/Index')
                ->has('users.data', 1)
                ->where('users.data.0.id', $match->id)
            );
    }
}
