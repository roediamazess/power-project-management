<?php

namespace Tests\Feature;

use App\Models\SiteMessage;
use App\Models\SiteNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessagesAndNotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_messages_can_be_sent_and_persisted(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $this->actingAs($sender)
            ->post('/messages', [
                'recipient_id' => $recipient->id,
                'subject' => 'Hello',
                'body' => 'Test message',
            ])
            ->assertRedirect("/messages/{$recipient->id}");

        $this->assertDatabaseHas('site_messages', [
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
            'subject' => 'Hello',
            'body' => 'Test message',
        ]);

        $this->actingAs($recipient)->get('/messages')->assertStatus(200);
    }

    public function test_notifications_can_be_opened_and_marked_read(): void
    {
        $user = User::factory()->create();
        $n = SiteNotification::query()->create([
            'user_id' => $user->id,
            'type' => 'arrangement',
            'title' => 'Test',
            'body' => 'Body',
            'url' => '/arrangements',
        ]);

        $this->actingAs($user)
            ->get("/notifications/{$n->id}")
            ->assertRedirect('/arrangements');

        $this->assertNotNull(SiteNotification::query()->findOrFail($n->id)->read_at);
    }
}

